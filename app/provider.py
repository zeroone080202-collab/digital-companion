"""Gemini-only multimodal provider adapter for MEDI.

This module intentionally removes the OpenAI/Groq dependency mismatch that was
introduced by older patches. It supports text + image input through the Gemini
GenerateContent REST API and returns MEDI's validated structured answer format.
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
        'urgency': {'type': 'string', 'enum': ['emergency', 'medical_review', 'general_information', 'unknown']},
        'evidence_status': {'type': 'string', 'enum': ['supported', 'partial', 'insufficient', 'not_applicable']},
        'paragraphs': {
            'type': 'array',
            'minItems': 1,
            'maxItems': 4,
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
        'follow_up_questions': {'type': 'array', 'maxItems': 3, 'items': {'type': 'string'}},
        'image_observations': {'type': 'array', 'maxItems': 4, 'items': {'type': 'string'}},
        'limitations': {'type': 'string'},
    },
    'required': ['in_scope', 'urgency', 'evidence_status', 'paragraphs', 'follow_up_questions', 'image_observations', 'limitations'],
    'additionalProperties': False,
}


SYSTEM_PROMPT = """너는 MEDI라는 한국어 의료 전문 정보 AI다. 사용자는 의료인이 아니라 일반인이다.

가장 중요한 목표:
- 사용자가 자신의 증상, 검사, 의료용어, 약, 의료기기, 의료 이미지를 이해할 수 있게 쉽고 충분히 설명한다.
- 너무 짧게 끝내지 말고, 너무 전문용어 위주로도 쓰지 않는다.
- 연결된 MEDI 의료자료가 있으면 우선 참고한다.

답변 방식:
1. 첫 문장에서 질문에 바로 답한다.
2. 기본 답변은 보통 3~4개의 짧은 문단으로 한다.
3. 증상 질문이면 흔한 가능성 2~4개와 그 이유, 확인할 점, 병원 확인이 필요한 신호를 설명한다.
4. 전문용어는 쉬운 표현 뒤에 괄호로 덧붙인다.
5. 드문 병을 불필요하게 나열하거나 공포를 유발하지 않는다.
6. 처방약을 새로 시작·중단하거나 용량을 바꾸라고 지시하지 않는다.

이미지 규칙:
7. 이미지가 첨부되어 있으면 반드시 실제 이미지를 먼저 본다. 이미지와 무관한 일반론으로만 답하지 않는다.
8. X-ray·CT·MRI 같은 의료영상에서는 보이는 신체부위, 촬영 방향, 큰 구조, 정렬, 눈에 띄는 비대칭이나 이상 가능성을 '참고 수준'으로 설명한다.
9. 의료영상에서 확정 진단, 정상 보증, 질환 배제는 하지 않는다. '보입니다', '가능성이 있습니다', '확인이 필요합니다'처럼 불확실성을 명확히 표현한다.
10. 검사결과지/약봉투/문서 사진은 읽히는 글자를 정확히 옮기고 의미를 설명한다. 안 읽히는 글자는 추측하지 않는다.
11. 피부·상처 사진은 색, 붓기, 범위, 분비물처럼 겉으로 보이는 특징을 설명하고 확정 진단은 하지 않는다.
12. 화질이나 잘림 때문에 분석이 제한되면 무엇이 부족한지 구체적으로 말한다.
13. 이미지에서 실제로 본 내용을 image_observations에 1~4개 넣는다. 이미지가 없으면 빈 배열로 둔다.

MEDI 자료 규칙:
14. 제공된 MEDI 자료에 실제로 있는 source id만 source_ids에 넣는다. 본문에 [S1] 같은 표시는 쓰지 않는다.
15. MEDI 자료가 부족하면 억지로 근거를 붙이지 않는다. 이미지 관찰과 일반 의학정보를 구분한다.

안전:
16. 명확한 응급 신호가 있을 때만 응급 안내를 한다.
17. 최종 판단은 의료진의 진찰·검사·판독문이 우선임을 짧게 알린다.
18. 법률·보험 질문은 의료적으로 설명할 수 있는 부분만 답하고 법적 결론을 단정하지 않는다.

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
        return '이번 질문에서 직접 연결된 MEDI 업로드 근거자료가 없습니다.'
    blocks = []
    for s in sources[:5]:
        title = _clip(s.get('title') or '업로드 자료', 140)
        year = _clip(s.get('year') or '', 20)
        excerpt = _clip(s.get('excerpt') or '', 1200)
        meta = f' ({year})' if year else ''
        blocks.append(f"[{s['id']}] {title}{meta}\n{excerpt}")
    return '\n\n'.join(blocks)


def _data_url_parts(data_url: str) -> tuple[str, str]:
    match = re.fullmatch(r'data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)', data_url or '')
    if not match:
        raise ProviderError('invalid_image', '이미지 형식을 읽지 못했습니다.')
    return match.group(1), match.group(2)


def _gemini_contents(request: ChatRequest, sources: list[dict]) -> tuple[str, list[dict]]:
    question = _redact_identifiers(request.message).strip() or '첨부한 이미지를 일반인이 이해하기 쉽게 설명해줘.'
    user_text = (
        f"MEDI 의료지식 자료:\n{_reference_text(sources)}\n\n"
        f"사용자 질문:\n{question}\n\n"
        '사용자가 자신의 상태를 이해할 수 있을 만큼 충분히 설명해라. '
        '실제 source ID만 source_ids에 사용하고 본문에는 source ID를 노출하지 마라.'
    )
    if request.images:
        user_text += (
            '\n\n첨부 이미지가 있다. 먼저 이미지 자체에서 실제로 보이는 내용을 구체적으로 확인한 뒤 답해라. '
            '이미지를 보지 못했는데 본 것처럼 답하면 안 된다.'
        )

    contents: list[dict] = []
    for h in request.history[-4:]:
        role = 'model' if h.role == 'assistant' else 'user'
        contents.append({'role': role, 'parts': [{'text': _clip(_redact_identifiers(h.content), 1800)}]})

    parts: list[dict[str, Any]] = [{'text': user_text}]
    for image in request.images[:2]:
        mime, data = _data_url_parts(image.data_url)
        parts.append({'text': f'사용자 분류: {image.kind}. 실제 이미지 내용이 다르면 실제 보이는 내용을 우선해라.'})
        parts.append({'inline_data': {'mime_type': mime, 'data': data}})
    contents.append({'role': 'user', 'parts': parts})
    return SYSTEM_PROMPT, contents


def _extract_text(data: dict) -> str:
    try:
        candidates = data.get('candidates') or []
        if not candidates:
            reason = ((data.get('promptFeedback') or {}).get('blockReason') or '').strip()
            if reason:
                raise ProviderError('free_ai_blocked', f'Gemini가 이 요청을 차단했습니다: {reason}')
            raise ProviderError('free_ai_output', 'Gemini가 답변 후보를 반환하지 않았습니다.')
        parts = candidates[0].get('content', {}).get('parts', [])
        text = ''.join(str(p.get('text', '')) for p in parts)
        if not text.strip():
            raise ProviderError('free_ai_output', 'Gemini 답변이 비어 있습니다.')
        return text
    except ProviderError:
        raise
    except Exception as exc:
        raise ProviderError('free_ai_output', 'Gemini 응답 형식을 읽지 못했습니다.') from exc


def _normalize_answer(raw: dict, sources: list[dict], request: ChatRequest) -> MedicalAnswer:
    try:
        answer = MedicalAnswer.model_validate(raw)
    except Exception as exc:
        raise ProviderError('free_ai_output', 'Gemini의 구조화된 답변을 검증하지 못했습니다.') from exc

    allowed = {str(s.get('id')) for s in sources}
    cleaned: list[Paragraph] = []
    used: set[str] = set()
    for p in answer.paragraphs[:4]:
        ids = [sid for sid in p.source_ids if sid in allowed]
        used.update(ids)
        text = re.sub(r'\s+', ' ', str(p.text or '')).strip()
        if text:
            cleaned.append(Paragraph(heading=str(p.heading or '')[:40], text=text[:1100], source_ids=ids))
    if not cleaned:
        raise ProviderError('free_ai_output', 'Gemini가 본문 없이 응답했습니다.')

    evidence = answer.evidence_status
    if not sources:
        evidence = 'insufficient'
    elif evidence == 'supported' and not used:
        evidence = 'partial'

    urgency = answer.urgency
    if urgency == 'emergency' and not emergency_signal(request.message):
        urgency = 'medical_review'

    observations = [re.sub(r'\s+', ' ', str(x)).strip()[:420]
                    for x in answer.image_observations[:4] if str(x).strip()]
    if request.images and not observations:
        observations = ['첨부 이미지를 확인했지만 화면에서 확실히 구분되는 특징을 충분히 설명하지 못했습니다. 더 선명한 원본이나 의료진 판독문이 있으면 함께 확인해 주세요.']

    limitations = str(answer.limitations or '').strip()
    if request.images:
        limitations = '이미지 설명은 참고용이며 최종 영상 판독이나 진단을 대신하지 않습니다. ' + limitations
    elif not limitations:
        limitations = '참고용 의료정보이며 진료를 대신하지 않습니다.'

    return answer.model_copy(update={
        'paragraphs': cleaned,
        'urgency': urgency,
        'evidence_status': evidence,
        'follow_up_questions': [str(x).strip()[:220] for x in answer.follow_up_questions[:3] if str(x).strip()],
        'image_observations': observations,
        'limitations': limitations[:700],
    })


TRANSIENT_STATUS = {408, 425, 500, 502, 503, 504}


async def _post_with_retry(url: str, *, headers: dict, payload: dict, settings: Settings, transport=None) -> httpx.Response:
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
            raise ProviderError('free_ai_network', 'Gemini 연결이 불안정합니다. 자동 재연결에도 실패했습니다.') from exc

        if response.status_code in TRANSIENT_STATUS and attempt + 1 < attempts:
            await asyncio.sleep(0.7 * (2 ** attempt))
            continue
        return response
    raise ProviderError('free_ai_network', 'Gemini 연결이 불안정합니다.') from last_exc


def _raise_http_error(response: httpx.Response):
    detail = ''
    try:
        body = response.json()
        detail = str((body.get('error') or {}).get('message') or body.get('message') or '')[:260]
    except Exception:
        pass
    if response.status_code in {401, 403}:
        raise ProviderError('free_ai_key', 'Gemini API 키 또는 Google AI Studio 프로젝트 설정을 확인해 주세요.', status=response.status_code)
    if response.status_code == 404:
        raise ProviderError('free_ai_model', '설정한 Gemini 모델명을 확인해 주세요.', status=404)
    if response.status_code == 429:
        raise ProviderError('free_ai_limit', 'Gemini 무료 사용 한도에 잠시 도달했습니다. 잠시 후 다시 시도해 주세요.', status=429)
    if response.status_code >= 400:
        suffix = f' · {detail}' if detail else ''
        raise ProviderError('free_ai_upstream', f'Gemini 요청 실패 ({response.status_code}){suffix}', status=response.status_code)


async def _gemini_json(prompt_system: str, contents: list[dict], settings: Settings, *, max_tokens: int, transport=None) -> dict:
    payload = {
        'system_instruction': {'parts': [{'text': prompt_system}]},
        'contents': contents,
        'generationConfig': {
            'temperature': 0.2,
            'topP': 0.9,
            'maxOutputTokens': max_tokens,
            'responseMimeType': 'application/json',
            'responseJsonSchema': ANSWER_SCHEMA,
        },
    }
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent'
    response = await _post_with_retry(
        url,
        headers={'x-goog-api-key': settings.gemini_api_key, 'Content-Type': 'application/json'},
        payload=payload,
        settings=settings,
        transport=transport,
    )
    _raise_http_error(response)
    text = _extract_text(response.json())
    try:
        value = json.loads(text)
    except Exception as exc:
        raise ProviderError('free_ai_output', 'Gemini JSON 답변을 읽지 못했습니다.') from exc
    if not isinstance(value, dict):
        raise ProviderError('free_ai_output', 'Gemini 답변 구조가 올바르지 않습니다.')
    return value


async def image_search_query(request: ChatRequest, settings: Settings, transport=None) -> str:
    """Extract safe, non-diagnostic image keywords for MEDI RAG search."""
    if not request.images or not settings.gemini_api_key:
        return ''
    parts: list[dict] = [{
        'text': (
            '이 의료 이미지를 MEDI 내부자료 검색용으로만 요약해라. 진단하지 말고, '
            '보이는 신체부위·검사 종류·의료용어·읽히는 문구·상처의 겉모습 등 검색에 도움 되는 '
            '핵심어를 한국어 중심 3~8개로 뽑아라. 마지막 줄에 QUERY: 핵심어 형식으로 적어라.'
        )
    }]
    for image in request.images[:2]:
        mime, data = _data_url_parts(image.data_url)
        parts.append({'inline_data': {'mime_type': mime, 'data': data}})
    payload = {
        'contents': [{'role': 'user', 'parts': parts}],
        'generationConfig': {'temperature': 0, 'maxOutputTokens': 180},
    }
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent'
    try:
        response = await _post_with_retry(
            url,
            headers={'x-goog-api-key': settings.gemini_api_key, 'Content-Type': 'application/json'},
            payload=payload,
            settings=settings,
            transport=transport,
        )
        if response.status_code >= 400:
            return ''
        text = _extract_text(response.json())
        match = re.search(r'QUERY\s*:\s*(.+)', text, flags=re.I)
        return _clip(match.group(1).strip() if match else text.strip(), 320)
    except Exception:
        return ''


async def generate(request: ChatRequest, sources: list[dict], settings: Settings, transport=None) -> ProviderResult:
    if not settings.gemini_api_key or settings.ai_provider == 'browser':
        raise ProviderError('free_ai_not_configured', 'Gemini 무료 API가 아직 설정되지 않았습니다.')
    system, contents = _gemini_contents(request, sources)
    raw = await _gemini_json(system, contents, settings, max_tokens=1800, transport=transport)
    answer = _normalize_answer(raw, sources, request)
    return ProviderResult(answer=answer, provider='gemini_free', model=settings.gemini_model)
