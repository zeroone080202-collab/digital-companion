"""Free multimodal provider adapters for MEDI.

MEDI always retrieves the operator's uploaded medical knowledge first. A free
server provider then turns that evidence (and optional images) into a consumer-
friendly answer. Transient failures are retried and, when enabled, automatically
fail over between Groq and Gemini.
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
        'follow_up_questions': {'type': 'array', 'items': {'type': 'string'}},
        'image_observations': {'type': 'array', 'items': {'type': 'string'}},
        'limitations': {'type': 'string'},
    },
    'required': ['in_scope', 'urgency', 'evidence_status', 'paragraphs', 'follow_up_questions', 'image_observations', 'limitations'],
    'additionalProperties': False,
}


SYSTEM_PROMPT = """너는 MEDI라는 한국어 의료 전문 AI다. 사용자는 의학 전문가가 아니라 일반인이다.

목표는 '사용자가 자신의 상태와 의료정보를 이해할 수 있을 만큼 충분히 설명하되, 어렵고 장황하지 않게 답하는 것'이다.

답변 규칙:
1. MEDI에 연결된 의료지식 자료를 우선 참고한다. 관련 근거가 있으면 실제 [S1], [S2] ID만 source_ids에 넣고 본문에는 ID를 노출하지 않는다.
2. 첫 문장에서 질문에 바로 답한다. 교과서식 서론이나 긴 면책문구로 시작하지 않는다.
3. 기본 답변은 보통 600~1,000자, 최대 4개 짧은 문단으로 한다. 아주 단순한 질문은 더 짧아도 된다.
4. 증상 질문은 흔한 가능성 2~4개를 이유와 함께 설명하고, 사용자가 스스로 확인할 핵심 포인트 2~4개를 알려준다.
5. 사용자가 '자세히', '전문적으로', '논문', '기전'을 요청하면 더 깊게 설명하되 쉬운 표현을 먼저 쓴다.
6. 어려운 전문용어는 꼭 필요할 때만 '쉬운 말 (전문용어)' 순서로 한 번 설명한다.
7. 드문 질환을 과도하게 나열하거나 공포를 유발하는 표현을 쓰지 않는다.
8. 사용자가 이미지를 올렸으면 이미지 자체를 반드시 확인한다. 먼저 실제로 보이는 내용을 구체적으로 설명하고, 그 다음 관련 MEDI 의료자료와 연결한다.
9. 검사결과·약봉투처럼 글자가 있는 이미지는 읽을 수 있는 글자를 바탕으로 뜻을 풀어준다. 화질 때문에 못 읽는 글자는 지어내지 않는다.
10. 상처·피부 사진은 색, 붓기, 분비물, 상처 범위처럼 보이는 특징을 설명한다. 확정 진단은 하지 않는다.
11. X-ray·CT·MRI 같은 의료영상은 보이는 구조와 눈에 띄는 차이를 참고 수준으로 설명한다. 확정 판독, 정상 보증, 치료 결정을 하지 않는다.
12. 이미지가 흐리거나 일부만 보이면 '무엇이 부족한지'를 구체적으로 말하고, 같은 이미지를 분석하지 않은 것처럼 얼버무리지 않는다.
13. 처방약을 새로 시작·중단하거나 용량을 바꾸라고 지시하지 않는다.
14. 명확한 응급 신호가 있을 때만 응급 안내를 한다. 단순 통증이나 짧은 후속 질문만으로 '응급'이라고 단정하지 않는다.
15. MEDI 자료가 부족하면 억지로 근거를 끼워 맞추지 않는다. 일반 의학지식과 MEDI 자료가 어디까지 뒷받침하는지 구분한다.
16. 법률·보험처럼 의료 외 질문이 섞여 있으면 의료적으로 설명할 수 있는 부분만 답하고, 법률적 결론을 단정하지 않는다.

출력은 반드시 요청된 JSON 형식에 맞춘다.
"""


def _clip(value: str, n: int) -> str:
    return str(value or '')[:n]


def _trim_for_consumer(value: str, max_chars: int = 620, max_sentences: int = 6) -> str:
    text = re.sub(r'[ \t]+', ' ', str(value or '')).strip()
    text = re.sub(r'\n{3,}', '\n\n', text)
    if len(text) <= max_chars:
        return text
    parts = re.split(r'(?<=[.!?。！？요다])\s+|\n+', text)
    kept: list[str] = []
    total = 0
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if kept and (len(kept) >= max_sentences or total + len(part) > max_chars):
            break
        kept.append(part)
        total += len(part) + 1
    out = ' '.join(kept).strip() or text[:max_chars].rstrip()
    if len(out) < len(text) and out[-1:] not in '.!?。！？요다':
        out = out.rstrip(' ,;:') + '…'
    return out


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
        return '이번 질문에서 직접 연결된 MEDI 업로드 근거자료가 없음.'
    blocks = []
    for s in sources[:5]:
        title = _clip(s.get('title') or '업로드 자료', 140)
        year = _clip(s.get('year') or '', 20)
        excerpt = _clip(s.get('excerpt') or '', 1100)
        meta = f' ({year})' if year else ''
        blocks.append(f"[{s['id']}] {title}{meta}\n{excerpt}")
    return '\n\n'.join(blocks)


def _messages(request: ChatRequest, sources: list[dict]) -> list[dict]:
    question = _redact_identifiers(request.message).strip() or '첨부한 이미지를 일반인이 이해하기 쉽게 설명해줘.'
    image_instruction = (
        '첨부 이미지가 있다. 이미지의 실제 내용을 먼저 분석하고, 보이는 특징을 구체적으로 설명한 뒤 MEDI 자료와 연결해라. '
        '이미지를 보지 않은 것처럼 일반론으로만 답하면 안 된다. '
        if request.images else ''
    )
    user = (
        f"MEDI 의료지식 자료:\n{_reference_text(sources)}\n\n"
        f"사용자 질문:\n{question}\n\n"
        f"{image_instruction}"
        '사용자가 자신의 상태를 이해할 수 있게 원인과 확인 포인트를 충분히 설명하되, 기본적으로 최대 4개 짧은 문단으로 작성해라. '
        '실제 source ID만 source_ids에 사용하고 본문에는 [S1] 같은 표기를 넣지 마라.'
    )
    out = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for h in request.history[-4:]:
        out.append({'role': h.role, 'content': _clip(_redact_identifiers(h.content), 1600)})
    out.append({'role': 'user', 'content': user})
    return out


def _data_url_parts(data_url: str) -> tuple[str, str]:
    match = re.fullmatch(r'data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)', data_url or '')
    if not match:
        raise ProviderError('invalid_image', '이미지 형식을 읽지 못했습니다.')
    return match.group(1), match.group(2)


def _groq_messages(request: ChatRequest, sources: list[dict]) -> list[dict]:
    messages = _messages(request, sources)
    if not request.images:
        return messages
    text = messages[-1]['content'] + (
        '\n\n반드시 첨부 이미지 자체에서 확인한 내용을 image_observations에 1~3개 넣어라. '
        '이미지를 분석하지 못했다면 분석했다고 가장하지 말고 그 이유를 구체적으로 적어라.'
    )
    content: list[dict[str, Any]] = [{'type': 'text', 'text': text}]
    for image in request.images[:2]:
        content.append({'type': 'image_url', 'image_url': {'url': image.data_url}})
    messages[-1] = {'role': 'user', 'content': content}
    return messages


def _gemini_contents(request: ChatRequest, sources: list[dict]) -> tuple[str, list[dict]]:
    messages = _messages(request, sources)
    system = messages[0]['content']
    conversation: list[dict] = []
    tail = messages[1:]
    for index, msg in enumerate(tail):
        role = 'model' if msg['role'] == 'assistant' else 'user'
        parts: list[dict] = [{'text': msg['content']}]
        if index == len(tail) - 1 and request.images:
            parts[0]['text'] += '\n\n첨부 이미지에서 실제로 보이는 내용을 image_observations에 1~3개 적어라.'
            for image in request.images[:2]:
                mime, data = _data_url_parts(image.data_url)
                parts.append({'inline_data': {'mime_type': mime, 'data': data}})
        conversation.append({'role': role, 'parts': parts})
    return system, conversation


def _extract_json(text: str) -> dict | None:
    raw = str(text or '').strip()
    if not raw:
        return None
    candidates = [raw]
    fence = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw, flags=re.S | re.I)
    if fence:
        candidates.insert(0, fence.group(1))
    start, end = raw.find('{'), raw.rfind('}')
    if start >= 0 and end > start:
        candidates.append(raw[start:end + 1])
    for candidate in candidates:
        try:
            value = json.loads(candidate)
            if isinstance(value, dict):
                return value
        except Exception:
            continue
    return None


def _normalize_structured_answer(raw: dict, sources: list[dict], request: ChatRequest) -> MedicalAnswer:
    try:
        answer = MedicalAnswer.model_validate(raw)
    except Exception as exc:
        raise ProviderError('free_ai_output', '무료 AI의 구조화된 답변을 검증하지 못했습니다.') from exc

    allowed = {str(s.get('id')) for s in sources}
    used: set[str] = set()
    cleaned: list[Paragraph] = []
    for paragraph in answer.paragraphs[:4]:
        valid_ids = [sid for sid in paragraph.source_ids if sid in allowed]
        used.update(valid_ids)
        heading = paragraph.heading[:34].strip()
        text = _trim_for_consumer(paragraph.text, 650, 6)
        if text:
            cleaned.append(Paragraph(heading=heading, text=text, source_ids=valid_ids))
    if not cleaned:
        raise ProviderError('free_ai_output', '무료 AI가 본문 없이 응답했습니다.')

    evidence = answer.evidence_status
    if not sources:
        evidence = 'insufficient'
    elif not used and evidence == 'supported':
        evidence = 'partial'

    urgency = answer.urgency
    # The model may be over-cautious. MEDI only shows the emergency badge when
    # the user's actual text contains a server-side emergency signal.
    if urgency == 'emergency' and not emergency_signal(request.message):
        urgency = 'medical_review'

    observations = [_trim_for_consumer(x, 320, 3) for x in answer.image_observations[:3] if str(x).strip()]
    if request.images and not observations:
        observations = ['첨부 이미지를 함께 확인해 답변했습니다. 세부 판독이 필요한 의료영상은 의료진의 원본 판독과 함께 확인하는 것이 좋습니다.']

    return answer.model_copy(update={
        'paragraphs': cleaned,
        'urgency': urgency,
        'evidence_status': evidence,
        'follow_up_questions': [_trim_for_consumer(q, 120, 1) for q in answer.follow_up_questions[:3]],
        'image_observations': observations,
        'limitations': '참고용 의료정보예요. 증상이 심하거나 계속되면 의료진에게 확인하세요.',
    })


def _text_to_answer(text: str, sources: list[dict], request: ChatRequest) -> MedicalAnswer:
    text = str(text or '').strip()
    if not text:
        raise ProviderError('empty_output', '무료 AI가 빈 답변을 반환했습니다.')
    chunks = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()][:4] or [text]
    paragraphs: list[Paragraph] = []
    for chunk in chunks:
        heading = ''
        body = chunk
        first, sep, rest = chunk.partition('\n')
        if sep and len(first) <= 34 and not first.endswith(('.', '다', '요')):
            heading = first.strip('# *')
            body = rest.strip()
        body = re.sub(r'\[(?:S\d+)\]', '', body).strip()
        if body:
            paragraphs.append(Paragraph(heading=heading[:34], text=_trim_for_consumer(body, 650, 6), source_ids=[]))
    return MedicalAnswer(
        in_scope=True,
        urgency='medical_review' if emergency_signal(request.message) else 'unknown',
        evidence_status='partial' if sources else 'insufficient',
        paragraphs=paragraphs or [Paragraph(heading='', text=_trim_for_consumer(text), source_ids=[])],
        follow_up_questions=[],
        image_observations=(['첨부 이미지를 함께 확인해 답변했습니다.'] if request.images else []),
        limitations='참고용 의료정보예요. 증상이 심하거나 걱정되는 변화가 있으면 의료진에게 확인하세요.',
    )


TRANSIENT_STATUS = {408, 425, 500, 502, 503, 504}


async def _post_with_retry(url: str, *, headers: dict, payload: dict, settings: Settings, transport=None) -> httpx.Response:
    last_exc: Exception | None = None
    attempts = settings.ai_request_retries + 1
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
                await asyncio.sleep(0.65 * (2 ** attempt))
                continue
            raise ProviderError('free_ai_network', '무료 AI 연결이 불안정합니다. 자동 재연결에 실패했습니다.') from exc
        if response.status_code in TRANSIENT_STATUS and attempt + 1 < attempts:
            await asyncio.sleep(0.65 * (2 ** attempt))
            continue
        return response
    raise ProviderError('free_ai_network', '무료 AI 연결이 불안정합니다.') from last_exc


def _raise_http_provider_error(name: str, response: httpx.Response):
    if response.status_code in {401, 403}:
        raise ProviderError('free_ai_key', f'{name} API 키 또는 프로젝트 설정을 확인해 주세요.', status=response.status_code)
    if response.status_code == 429:
        raise ProviderError('free_ai_limit', f'{name} 무료 사용 한도에 잠시 도달했습니다.', status=429)
    detail = ''
    try:
        body = response.json()
        detail = str(body.get('error', {}).get('message') or body.get('message') or '')[:220]
    except Exception:
        pass
    if response.status_code >= 400:
        suffix = f' · {detail}' if detail else ''
        raise ProviderError('free_ai_upstream', f'{name} 요청 실패 ({response.status_code}){suffix}', status=response.status_code)


async def _groq(request: ChatRequest, sources: list[dict], settings: Settings, transport=None) -> ProviderResult:
    model = settings.groq_vision_model if request.images else settings.groq_model
    payload: dict[str, Any] = {
        'model': model,
        'messages': _groq_messages(request, sources),
        'temperature': 0.2,
        'top_p': 0.9,
        'max_completion_tokens': 1600,
        'stream': False,
        'response_format': ({'type': 'json_object'} if request.images else {
            'type': 'json_schema',
            'json_schema': {'name': 'medi_medical_answer', 'strict': True, 'schema': ANSWER_SCHEMA},
        }),
    }
    response = await _post_with_retry(
        'https://api.groq.com/openai/v1/chat/completions',
        headers={'Authorization': 'Bearer ' + settings.groq_api_key, 'Content-Type': 'application/json'},
        payload=payload,
        settings=settings,
        transport=transport,
    )
    _raise_http_provider_error('Groq', response)
    try:
        data = response.json()
        content = data['choices'][0]['message']['content']
    except Exception as exc:
        raise ProviderError('free_ai_output', 'Groq 응답 형식을 읽지 못했습니다.') from exc
    raw = _extract_json(content)
    if raw is not None:
        try:
            answer = _normalize_structured_answer(raw, sources, request)
        except ProviderError:
            answer = _text_to_answer(content, sources, request)
    else:
        answer = _text_to_answer(content, sources, request)
    return ProviderResult(answer, 'groq_free', model)


async def _gemini(request: ChatRequest, sources: list[dict], settings: Settings, transport=None) -> ProviderResult:
    system, conversation = _gemini_contents(request, sources)
    schema_instruction = (
        '\n반드시 JSON 객체로 답해라. 키는 in_scope, urgency, evidence_status, paragraphs, '
        'follow_up_questions, image_observations, limitations를 사용한다. paragraphs의 각 항목은 '
        'heading, text, source_ids를 가진다.'
    )
    payload = {
        'system_instruction': {'parts': [{'text': system + schema_instruction}]},
        'contents': conversation,
        'generationConfig': {
            'temperature': 0.2,
            'topP': 0.9,
            'maxOutputTokens': 1600,
            'responseMimeType': 'application/json',
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
    _raise_http_provider_error('Gemini', response)
    try:
        data = response.json()
        content = ''.join(p.get('text', '') for p in data['candidates'][0]['content']['parts'])
    except Exception as exc:
        raise ProviderError('free_ai_output', 'Gemini 응답 형식을 읽지 못했습니다.') from exc
    raw = _extract_json(content)
    if raw is not None:
        try:
            answer = _normalize_structured_answer(raw, sources, request)
        except ProviderError:
            answer = _text_to_answer(content, sources, request)
    else:
        answer = _text_to_answer(content, sources, request)
    return ProviderResult(answer, 'gemini_free', settings.gemini_model)


def _candidate_names(settings: Settings) -> list[str]:
    if settings.ai_provider == 'browser':
        return []
    preferred: list[str] = []
    if settings.ai_provider == 'groq' and settings.groq_api_key:
        preferred.append('groq')
    elif settings.ai_provider == 'gemini' and settings.gemini_api_key:
        preferred.append('gemini')
    elif settings.ai_provider == 'auto':
        if settings.groq_api_key:
            preferred.append('groq')
        if settings.gemini_api_key:
            preferred.append('gemini')
    if settings.provider_failover:
        if settings.groq_api_key and 'groq' not in preferred:
            preferred.append('groq')
        if settings.gemini_api_key and 'gemini' not in preferred:
            preferred.append('gemini')
    return preferred


async def image_search_query(request: ChatRequest, settings: Settings, transport=None) -> str:
    """Extract non-diagnostic image keywords for MEDI RAG before final answer."""
    if not request.images:
        return ''
    prompt = (
        '이 의료 이미지를 MEDI 내부자료 검색용으로만 요약해라. 진단하지 말고, '
        '보이는 신체부위·검사명·의료용어·보고서 글자·상처의 겉모습 등 검색에 도움 되는 '
        '핵심어를 한국어 중심 3~8개로 뽑아 JSON {"query":"..."} 형식으로만 답해라.'
    )
    for name in _candidate_names(settings):
        try:
            if name == 'groq':
                content: list[dict] = [{'type': 'text', 'text': prompt}]
                for image in request.images[:2]:
                    content.append({'type': 'image_url', 'image_url': {'url': image.data_url}})
                payload = {
                    'model': settings.groq_vision_model,
                    'messages': [{'role': 'user', 'content': content}],
                    'temperature': 0,
                    'max_completion_tokens': 160,
                    'stream': False,
                    'response_format': {'type': 'json_object'},
                }
                response = await _post_with_retry(
                    'https://api.groq.com/openai/v1/chat/completions',
                    headers={'Authorization': 'Bearer ' + settings.groq_api_key, 'Content-Type': 'application/json'},
                    payload=payload,
                    settings=settings,
                    transport=transport,
                )
                if response.status_code >= 400:
                    continue
                content_text = response.json()['choices'][0]['message']['content']
                raw = _extract_json(content_text) or {}
                query = _clip(raw.get('query', ''), 320)
                if query:
                    return query
            elif name == 'gemini':
                parts: list[dict] = [{'text': prompt}]
                for image in request.images[:2]:
                    mime, data = _data_url_parts(image.data_url)
                    parts.append({'inline_data': {'mime_type': mime, 'data': data}})
                payload = {
                    'contents': [{'role': 'user', 'parts': parts}],
                    'generationConfig': {'temperature': 0, 'maxOutputTokens': 160, 'responseMimeType': 'application/json'},
                }
                url = f'https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent'
                response = await _post_with_retry(
                    url,
                    headers={'x-goog-api-key': settings.gemini_api_key, 'Content-Type': 'application/json'},
                    payload=payload,
                    settings=settings,
                    transport=transport,
                )
                if response.status_code >= 400:
                    continue
                content_text = ''.join(p.get('text', '') for p in response.json()['candidates'][0]['content']['parts'])
                raw = _extract_json(content_text) or {}
                query = _clip(raw.get('query', ''), 320)
                if query:
                    return query
        except Exception:
            continue
    return ''


async def generate(request: ChatRequest, sources: list[dict], settings: Settings, transport=None) -> ProviderResult:
    candidates = _candidate_names(settings)
    if not candidates:
        raise ProviderError('free_ai_not_configured', '이미지와 답변을 처리할 무료 서버 AI가 설정되지 않았습니다.')

    errors: list[ProviderError] = []
    for name in candidates:
        try:
            if name == 'groq':
                return await _groq(request, sources, settings, transport=transport)
            if name == 'gemini':
                return await _gemini(request, sources, settings, transport=transport)
        except ProviderError as exc:
            errors.append(exc)
            continue

    # Prefer a meaningful key/rate-limit error over a generic network message.
    for code in ('free_ai_key', 'free_ai_limit', 'free_ai_upstream', 'free_ai_network', 'free_ai_output'):
        for exc in errors:
            if exc.code == code:
                raise exc
    raise errors[-1] if errors else ProviderError('free_ai_unavailable', '사용 가능한 무료 AI가 없습니다.')
