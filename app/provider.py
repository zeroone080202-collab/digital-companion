"""Gemini multimodal provider adapter for MEDI.

This module uses the Gemini Developer API only. It deliberately avoids
browser-side LLM fallback so the UI does not show a canned retrieval answer
when the actual AI backend is unavailable.
"""
from __future__ import annotations

from dataclasses import dataclass
import asyncio
import json
import re
from typing import Any

import httpx

from app.config import Settings
from app.schemas import ChatRequest, MedicalAnswer, Paragraph
from app.policy import emergency_signal


class ProviderError(RuntimeError):
    def __init__(self, code: str, message: str, *, status: int | None = None):
        self.code = code
        self.message = message
        self.status = status
        super().__init__(message)


@dataclass
class ProviderResult:
    answer: MedicalAnswer
    provider: str
    model: str


ANSWER_SCHEMA = {
    'type': 'object',
    'properties': {
        'in_scope': {'type': 'boolean'},
        'urgency': {
            'type': 'string',
            'enum': ['emergency', 'medical_review', 'general_information', 'unknown'],
        },
        'evidence_status': {
            'type': 'string',
            'enum': ['supported', 'partial', 'insufficient', 'not_applicable'],
        },
        'paragraphs': {
            'type': 'array',
            'minItems': 1,
            'maxItems': 5,
            'items': {
                'type': 'object',
                'properties': {
                    'heading': {'type': 'string'},
                    'text': {'type': 'string'},
                    'source_ids': {'type': 'array', 'items': {'type': 'string'}},
                },
                'required': ['heading', 'text', 'source_ids'],
                'additionalProperties': False,
            },
        },
        'follow_up_questions': {
            'type': 'array',
            'maxItems': 3,
            'items': {'type': 'string'},
        },
        'image_observations': {
            'type': 'array',
            'maxItems': 5,
            'items': {'type': 'string'},
        },
        'limitations': {'type': 'string'},
    },
    'required': [
        'in_scope', 'urgency', 'evidence_status', 'paragraphs',
        'follow_up_questions', 'image_observations', 'limitations'
    ],
    'additionalProperties': False,
}


SYSTEM_PROMPT = """너는 MEDI라는 한국어 의료 전문 정보 AI다. 사용자는 의료인이 아니라 일반인이다.

핵심 목표
- 사용자가 자신의 상태, 증상, 검사, 약, 의료기기, 치료 과정과 의료 이미지를 스스로 이해할 수 있게 설명한다.
- MEDI 내부 의료자료가 있으면 먼저 활용한다.
- 내부자료가 부족해도 질문 자체에 답할 수 있는 일반 의학지식은 사용해도 된다. 다만 그 부분에는 내부자료 출처를 억지로 붙이지 않는다.
- 미리 만들어 둔 문장이나 고정 템플릿을 반복하지 않는다. 반드시 현재 질문의 의미를 먼저 파악하고, 질문마다 새 답변을 작성한다.
- 의료·건강과 관련된 질문이면 내부자료에 정확한 항목이 없어도 일반 의학지식으로 충분히 설명한다. 내부자료가 없다는 이유만으로 답변을 멈추지 않는다.
- 의료·건강과 무관한 요청만 짧게 범위를 안내하고 substantive한 비의료 답변은 하지 않는다.

답변 스타일
1. 질문이 무엇을 묻는지 먼저 해석한 뒤 첫 문장에서 그 질문에 바로 답한다.
2. 기본 답변은 보통 3~5개의 짧은 문단, 약 500~1000자 정도로 한다.
3. 너무 짧게 끝내지 말고 사용자가 '왜 그런지'까지 이해할 수 있게 이유를 설명한다.
4. 전문용어는 쉬운 말 뒤 괄호로 한 번만 덧붙인다.
5. 증상 질문은 흔한 원인 2~4개, 그 이유, 스스로 확인할 점, 진료가 필요한 신호를 설명한다.
6. 개념 질문은 무엇인지, 종류나 구분이 필요한지, 언제 쓰는지, 어떻게 작동하는지, 사용자가 헷갈리기 쉬운 점을 질문 내용에 맞게 선택해서 설명한다. 모든 항목을 억지로 채우지 않는다.
7. 사용자가 짧게 후속 질문을 해도 최근 대화 맥락을 이어서 답한다.
8. 드문 병을 불필요하게 나열하지 않는다.

이미지
9. 이미지가 있으면 반드시 이미지 자체를 먼저 본다. 이미지와 무관한 일반론만 쓰지 않는다.
10. X-ray·CT·MRI 등은 보이는 부위, 방향, 구조, 정렬, 명확히 눈에 띄는 특징을 '참고 수준'에서 설명한다.
11. 확정 진단, 정상 보증, 질환 배제는 하지 않는다. 불확실하면 '가능성이 있어 보이지만 이 사진만으로 확정할 수 없다'고 말한다.
12. 검사결과지·약봉투·문서 사진은 읽히는 내용만 옮기고 의미를 설명한다. 안 읽히는 글자는 추측하지 않는다.
13. 피부·상처 사진은 색, 붓기, 범위, 분비물 등 실제 보이는 표면 특징을 설명한다.
14. 이미지에서 실제로 관찰한 내용을 image_observations에 1~5개 넣는다. 이미지가 없으면 빈 배열로 둔다.

MEDI 자료
15. 제공된 source id만 source_ids에 넣는다. 본문에는 [S1] 같은 내부 번호를 쓰지 않는다.
16. 자료가 질문을 충분히 뒷받침하면 활용하고, 관련성이 낮으면 억지로 끼워 맞추지 않는다.
17. MEDI 자료와 모델의 일반 의학지식을 구분해서 생각하고, 존재하지 않는 논문·수치·출처를 만들지 않는다.

안전
18. 개인별 확정 진단이나 처방을 하지 않는다.
19. 처방약을 새로 시작·중단하거나 용량을 바꾸라고 지시하지 않는다.
20. 명확한 응급 신호가 있을 때만 119/응급실 안내를 우선한다.
21. 최종 영상 판독과 진료 판단은 의료진이 우선임을 짧게 알린다.

반드시 지정된 JSON 구조로만 출력한다.
"""


def _clip(value: str, n: int) -> str:
    return str(value or '')[:n]


def _redact_identifiers(value: str) -> str:
    text = str(value or '')
    patterns = [
        (r'\b\d{6}[- ]?[1-4]\d{6}\b', '[주민등록번호 제거]'),
        (r'\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b', '[전화번호 제거]'),
        (r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', '[이메일 제거]'),
    ]
    for pattern, replacement in patterns:
        text = re.sub(pattern, replacement, text)
    return text


def _reference_text(sources: list[dict]) -> str:
    if not sources:
        return '이번 질문에서 직접 연결된 MEDI 내부 근거자료는 없습니다. 필요한 경우 일반 의학지식으로 설명하되 내부자료 출처를 꾸며내지 마세요.'
    blocks = []
    for s in sources[:6]:
        title = _clip(s.get('title') or '업로드 자료', 150)
        year = _clip(s.get('year') or '', 20)
        excerpt = _clip(s.get('excerpt') or '', 1500)
        meta = f' ({year})' if year else ''
        blocks.append(f"[{s['id']}] {title}{meta}\n{excerpt}")
    return '\n\n'.join(blocks)


def _data_url_parts(data_url: str) -> tuple[str, str]:
    match = re.fullmatch(
        r'data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)',
        data_url or ''
    )
    if not match:
        raise ProviderError('invalid_image', '이미지 형식을 읽지 못했습니다.')
    return match.group(1), match.group(2)


def _gemini_contents(request: ChatRequest, sources: list[dict]) -> tuple[str, list[dict]]:
    question = _redact_identifiers(request.message).strip()
    if not question:
        question = '첨부한 이미지를 일반인이 이해하기 쉽게 설명해줘.'

    user_text = (
        f"MEDI 내부 의료자료:\n{_reference_text(sources)}\n\n"
        f"현재 사용자 질문:\n{question}\n\n"
        '이 질문에 직접 답하세요. MEDI 자료가 충분하면 활용하고, 부족하면 일반 의학지식으로 보완하세요. '
        '일반 의학지식으로 보완한 문단에 MEDI source id를 억지로 붙이지 마세요.'
    )
    if request.images:
        user_text += (
            '\n\n첨부 이미지가 있습니다. 반드시 실제 이미지 내용을 먼저 확인하고, '
            '보이는 특징을 설명한 다음 질문에 답하세요.'
        )

    contents: list[dict] = []
    for h in request.history[-6:]:
        role = 'model' if h.role == 'assistant' else 'user'
        contents.append({
            'role': role,
            'parts': [{'text': _clip(_redact_identifiers(h.content), 2200)}],
        })

    parts: list[dict[str, Any]] = [{'text': user_text}]
    for image in request.images[:2]:
        mime, data = _data_url_parts(image.data_url)
        parts.append({
            'text': f'사용자 선택 이미지 유형: {image.kind}. 라벨이 틀릴 수 있으므로 실제 보이는 내용을 우선하세요.'
        })
        parts.append({'inline_data': {'mime_type': mime, 'data': data}})
    contents.append({'role': 'user', 'parts': parts})
    return SYSTEM_PROMPT, contents


def _extract_text(data: dict) -> str:
    candidates = data.get('candidates') or []
    if not candidates:
        reason = ((data.get('promptFeedback') or {}).get('blockReason') or '').strip()
        if reason:
            raise ProviderError('gemini_blocked', f'Gemini가 이 요청을 차단했습니다: {reason}')
        raise ProviderError('gemini_output', 'Gemini가 답변을 반환하지 않았습니다.')

    parts = candidates[0].get('content', {}).get('parts', [])
    text = ''.join(str(p.get('text', '')) for p in parts if isinstance(p, dict))
    if not text.strip():
        finish = str(candidates[0].get('finishReason') or '')
        raise ProviderError('gemini_output', f'Gemini 답변이 비어 있습니다. {finish}'.strip())
    return text.strip()


def _parse_json_text(text: str) -> dict:
    cleaned = str(text or '').strip()
    if cleaned.startswith('```'):
        cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned, flags=re.I)
        cleaned = re.sub(r'\s*```$', '', cleaned)
    try:
        value = json.loads(cleaned)
    except Exception as exc:
        raise ProviderError('gemini_output', 'Gemini JSON 답변을 읽지 못했습니다.') from exc
    if not isinstance(value, dict):
        raise ProviderError('gemini_output', 'Gemini 답변 구조가 올바르지 않습니다.')
    return value


def _normalize_answer(raw: dict, sources: list[dict], request: ChatRequest) -> MedicalAnswer:
    try:
        answer = MedicalAnswer.model_validate(raw)
    except Exception as exc:
        raise ProviderError('gemini_output', 'Gemini의 구조화된 답변을 검증하지 못했습니다.') from exc

    allowed = {str(s.get('id')) for s in sources}
    cleaned: list[Paragraph] = []
    used: set[str] = set()

    for p in answer.paragraphs[:5]:
        ids = [sid for sid in p.source_ids if sid in allowed]
        used.update(ids)
        text = re.sub(r'\s+', ' ', str(p.text or '')).strip()
        if text:
            cleaned.append(Paragraph(
                heading=str(p.heading or '')[:48],
                text=text[:1400],
                source_ids=ids,
            ))

    if not cleaned:
        raise ProviderError('gemini_output', 'Gemini가 본문 없이 응답했습니다.')

    evidence = answer.evidence_status
    if not sources:
        evidence = 'insufficient'
    elif evidence == 'supported' and not used:
        evidence = 'partial'

    urgency = answer.urgency
    if urgency == 'emergency' and not emergency_signal(request.message):
        urgency = 'medical_review'

    observations = [
        re.sub(r'\s+', ' ', str(x)).strip()[:500]
        for x in answer.image_observations[:5]
        if str(x).strip()
    ]
    if request.images and not observations:
        observations = [
            '첨부 이미지는 전달됐지만, 이 응답에서는 확실히 설명할 수 있는 시각적 특징을 충분히 추출하지 못했습니다.'
        ]

    limitations = str(answer.limitations or '').strip()
    if request.images:
        prefix = '이미지 설명은 참고용이며 최종 영상 판독이나 진단을 대신하지 않습니다.'
        limitations = f'{prefix} {limitations}'.strip()
    elif not limitations:
        limitations = '참고용 의료정보이며 진료를 대신하지 않습니다.'

    return answer.model_copy(update={
        'paragraphs': cleaned,
        'urgency': urgency,
        'evidence_status': evidence,
        'follow_up_questions': [
            str(x).strip()[:240] for x in answer.follow_up_questions[:3]
            if str(x).strip()
        ],
        'image_observations': observations,
        'limitations': limitations[:800],
    })


TRANSIENT_STATUS = {408, 425, 500, 502, 503, 504}


async def _post_with_retry(
    url: str,
    *,
    headers: dict,
    payload: dict,
    settings: Settings,
    transport=None,
) -> httpx.Response:
    attempts = settings.ai_request_retries + 1
    last_exc: Exception | None = None
    for attempt in range(attempts):
        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(settings.timeout, connect=12),
                transport=transport,
                follow_redirects=False,
            ) as client:
                response = await client.post(url, headers=headers, json=payload)
        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            last_exc = exc
            if attempt + 1 < attempts:
                await asyncio.sleep(0.7 * (2 ** attempt))
                continue
            raise ProviderError('gemini_network', 'Gemini 연결이 불안정합니다. 자동 재시도에도 실패했습니다.') from exc

        if response.status_code in TRANSIENT_STATUS and attempt + 1 < attempts:
            await asyncio.sleep(0.7 * (2 ** attempt))
            continue
        return response

    raise ProviderError('gemini_network', 'Gemini 연결이 불안정합니다.') from last_exc


def _raise_http_error(response: httpx.Response):
    detail = ''
    try:
        body = response.json()
        detail = str((body.get('error') or {}).get('message') or body.get('message') or '')[:360]
    except Exception:
        pass

    if response.status_code in {401, 403}:
        raise ProviderError(
            'gemini_key',
            'Gemini API 키 인증에 실패했습니다. Google AI Studio에서 새 Auth key를 만든 뒤 Render의 GEMINI_API_KEY를 다시 확인해 주세요.',
            status=response.status_code,
        )
    if response.status_code == 404:
        raise ProviderError(
            'gemini_model',
            '설정한 Gemini 모델을 찾지 못했습니다. GEMINI_MODEL=gemini-2.5-flash 로 설정해 주세요.',
            status=404,
        )
    if response.status_code == 429:
        raise ProviderError(
            'gemini_limit',
            'Gemini 무료 사용 한도에 잠시 도달했습니다. 잠시 후 다시 시도해 주세요.',
            status=429,
        )
    if response.status_code >= 400:
        suffix = f' · {detail}' if detail else ''
        raise ProviderError(
            'gemini_upstream',
            f'Gemini 요청 실패 ({response.status_code}){suffix}',
            status=response.status_code,
        )


async def _gemini_structured(
    prompt_system: str,
    contents: list[dict],
    settings: Settings,
    *,
    max_tokens: int,
    transport=None,
) -> dict:
    # Gemini GenerateContent's structured-output shape changed in 2026.
    # Use generationConfig.responseFormat instead of the older
    # responseMimeType/responseJsonSchema pair.
    payload = {
        'system_instruction': {'parts': [{'text': prompt_system}]},
        'contents': contents,
        'generationConfig': {
            'temperature': 0.25,
            'topP': 0.9,
            'maxOutputTokens': max_tokens,
            'responseFormat': {
                'text': {
                    'mimeType': 'application/json',
                    'schema': ANSWER_SCHEMA,
                }
            },
        },
    }
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent'
    response = await _post_with_retry(
        url,
        headers={
            'x-goog-api-key': settings.gemini_api_key,
            'Content-Type': 'application/json',
        },
        payload=payload,
        settings=settings,
        transport=transport,
    )
    _raise_http_error(response)
    return _parse_json_text(_extract_text(response.json()))


async def image_search_query(request: ChatRequest, settings: Settings, transport=None) -> str:
    """Extract non-diagnostic image keywords for MEDI RAG search."""
    if not request.images or not settings.gemini_api_key:
        return ''

    parts: list[dict] = [{
        'text': (
            '이 의료 이미지를 MEDI 내부자료 검색용으로만 요약하세요. 확정 진단하지 말고, '
            '보이는 신체부위·검사 종류·읽히는 문구·표면 특징 등 검색에 도움 되는 '
            '핵심어를 한국어 중심으로 3~8개 적으세요. 마지막 줄은 QUERY: 핵심어 형식으로 적으세요.'
        )
    }]
    for image in request.images[:2]:
        mime, data = _data_url_parts(image.data_url)
        parts.append({'inline_data': {'mime_type': mime, 'data': data}})

    payload = {
        'contents': [{'role': 'user', 'parts': parts}],
        'generationConfig': {
            'temperature': 0,
            'maxOutputTokens': 220,
        },
    }
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent'
    try:
        response = await _post_with_retry(
            url,
            headers={
                'x-goog-api-key': settings.gemini_api_key,
                'Content-Type': 'application/json',
            },
            payload=payload,
            settings=settings,
            transport=transport,
        )
        if response.status_code >= 400:
            return ''
        text = _extract_text(response.json())
        match = re.search(r'QUERY\s*:\s*(.+)', text, flags=re.I)
        return _clip(match.group(1).strip() if match else text.strip(), 360)
    except Exception:
        return ''


def retrieval_fallback_answer(question: str, sources: list[dict]) -> MedicalAnswer:
    """Useful fallback when Gemini is not configured.

    This is deliberately NOT presented as AI reasoning. It surfaces the most
    relevant MEDI excerpts instead of returning a canned message or trying to
    launch a browser LLM that may fail on the user's device.
    """
    if not sources:
        return MedicalAnswer(
            in_scope=True,
            urgency='unknown',
            evidence_status='insufficient',
            paragraphs=[Paragraph(
                heading='Gemini 연결이 필요해요',
                text=(
                    '현재 MEDI 서버에는 Gemini API 키가 연결되지 않아 이 질문에 새 답변을 생성할 수 없습니다. '
                    'Google AI Studio에서 무료 API 키를 만든 뒤 Render의 GEMINI_API_KEY에 넣으면 '
                    '일반 의료 질문과 이미지 설명을 모두 생성할 수 있습니다.'
                ),
                source_ids=[],
            )],
            follow_up_questions=[],
            image_observations=[],
            limitations='현재 응답은 생성형 AI 답변이 아니라 연결 상태 안내입니다.',
        )

    paragraphs: list[Paragraph] = []
    for s in sources[:3]:
        excerpt = re.sub(r'\s+', ' ', str(s.get('excerpt') or '')).strip()
        if not excerpt:
            continue
        paragraphs.append(Paragraph(
            heading=str(s.get('title') or '관련 MEDI 자료')[:48],
            text=excerpt[:850],
            source_ids=[str(s.get('id'))],
        ))
    if not paragraphs:
        paragraphs = [Paragraph(
            heading='관련 자료는 찾았지만',
            text='검색된 자료에서 바로 보여드릴 수 있는 본문을 찾지 못했습니다. Gemini를 연결하면 자료를 종합해 답변할 수 있습니다.',
            source_ids=[],
        )]
    return MedicalAnswer(
        in_scope=True,
        urgency='unknown',
        evidence_status='partial',
        paragraphs=paragraphs,
        follow_up_questions=[],
        image_observations=[],
        limitations='현재는 생성형 AI가 아니라 MEDI 내부 검색 결과를 그대로 보여주는 상태입니다.',
    )


async def generate(
    request: ChatRequest,
    sources: list[dict],
    settings: Settings,
    transport=None,
) -> ProviderResult:
    if not settings.gemini_api_key:
        raise ProviderError('gemini_not_configured', 'Gemini 무료 API가 아직 설정되지 않았습니다.')
    system, contents = _gemini_contents(request, sources)
    raw = await _gemini_structured(
        system,
        contents,
        settings,
        max_tokens=2400,
        transport=transport,
    )
    answer = _normalize_answer(raw, sources, request)
    return ProviderResult(answer=answer, provider='gemini_free', model=settings.gemini_model)
