"""Free text-generation adapters for MEDI.

MEDI retrieves the operator's uploaded medical knowledge first. A configured
free provider then turns that evidence into a conversational answer. Images are
NOT sent to these text providers.

Provider order in MEDI_AI_PROVIDER=auto:
1) Groq free tier, if GROQ_API_KEY is configured
2) Gemini free tier, if GEMINI_API_KEY is configured
3) caller falls back to browser-local WebGPU or retrieval-only mode
"""
from __future__ import annotations

from dataclasses import dataclass
import json
import re
import httpx

from app.config import Settings
from app.schemas import ChatRequest, MedicalAnswer, Paragraph
from app.policy import DISCLAIMER


class ProviderError(RuntimeError):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


@dataclass
class ProviderResult:
    answer: MedicalAnswer
    provider: str
    model: str




ANSWER_SCHEMA = {
    "type": "object",
    "properties": {
        "in_scope": {"type": "boolean"},
        "urgency": {"type": "string", "enum": ["emergency", "medical_review", "general_information", "unknown"]},
        "evidence_status": {"type": "string", "enum": ["supported", "partial", "insufficient", "not_applicable"]},
        "paragraphs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "heading": {"type": "string"},
                    "text": {"type": "string"},
                    "source_ids": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["heading", "text", "source_ids"],
                "additionalProperties": False,
            },
        },
        "follow_up_questions": {"type": "array", "items": {"type": "string"}},
        "image_observations": {"type": "array", "items": {"type": "string"}},
        "limitations": {"type": "string"},
    },
    "required": ["in_scope", "urgency", "evidence_status", "paragraphs", "follow_up_questions", "image_observations", "limitations"],
    "additionalProperties": False,
}


def _normalize_structured_answer(raw: dict, sources: list[dict]) -> MedicalAnswer:
    """Validate model JSON and refuse invented MEDI citations."""
    try:
        answer = MedicalAnswer.model_validate(raw)
    except Exception as e:
        raise ProviderError('free_ai_output', '무료 AI의 구조화된 답변을 검증하지 못했습니다.') from e

    allowed = {str(s.get('id')) for s in sources}
    used = set()
    cleaned = []
    for paragraph in answer.paragraphs[:7]:
        valid_ids = [sid for sid in paragraph.source_ids if sid in allowed]
        used.update(valid_ids)
        cleaned.append(Paragraph(heading=paragraph.heading[:80], text=paragraph.text[:6000], source_ids=valid_ids))
    if not cleaned:
        raise ProviderError('free_ai_output', '무료 AI가 본문 없이 응답했습니다.')

    evidence = answer.evidence_status
    if not sources:
        evidence = 'insufficient'
    elif not used and evidence == 'supported':
        evidence = 'partial'

    return answer.model_copy(update={
        'paragraphs': cleaned,
        'evidence_status': evidence,
        'follow_up_questions': answer.follow_up_questions[:5],
        'image_observations': answer.image_observations[:5],
        'limitations': (answer.limitations or DISCLAIMER)[:3000],
    })


SYSTEM_PROMPT = """너는 MEDI라는 한국어 의료 전문 연구·학습 보조 AI다.

가장 중요한 원칙:
1. 사용자가 운영자에게 제공한 'MEDI 의료지식 자료'를 최우선 근거로 사용한다.
2. 제공된 근거에 있는 사실과 모델의 일반 지식을 섞어서 확정적으로 말하지 않는다.
3. 근거자료가 있으면 관련 문장 끝에 [S1], [S2]처럼 실제 제공된 ID만 표시한다.
4. 자료가 부족하면 'MEDI 자료만으로는 충분히 확인되지 않는다'고 분명히 말한 뒤, 필요한 추가 정보나 일반적인 가능성을 조심스럽게 설명한다.
5. 개인 증상에서 하나의 질환으로 확정 진단하지 않는다. 가능한 원인의 범주와 구분에 도움이 되는 질문을 제시한다.
6. 처방약 시작·중단·용량 변경을 지시하지 않는다.
7. 심한 흉통, 심한 호흡곤란, 의식저하, 새로 생긴 마비, 멈추지 않는 출혈 등 응급 신호가 있으면 119 또는 응급의료기관을 우선 안내한다.
8. 사용자가 '왜 아픈가'라고 물으면 단순 경고문만 반복하지 말고, 증상 위치·시작 시점·외상·붓기/열감·체중부하 가능 여부·동반 증상 등 의학적으로 유용한 구분 정보를 자연스럽게 묻는다.
9. 설명은 어렵지 않은 한국어로 하되, 필요하면 의학용어를 괄호에 함께 적는다.
10. 답변은 의료상담 기록처럼 딱딱한 템플릿이 아니라 자연스러운 대화형 설명으로 작성한다.
11. source_ids에는 실제로 해당 문단의 근거로 사용한 MEDI 자료 ID만 넣는다. 근거가 없으면 빈 배열로 둔다.
12. 개인 증상 질문에서는 필요한 경우 2~4개의 짧은 후속 질문을 follow_up_questions에 넣는다.

이 시스템은 연구용이며 실제 의료진의 진료·검사·진단·처방을 대신하지 않는다.
"""


def _clip(value: str, n: int) -> str:
    return str(value or '')[:n]


def _redact_identifiers(value: str) -> str:
    """Remove obvious direct identifiers before text leaves the MEDI server.

    This is a conservative convenience filter, not a complete de-identification
    system. The UI still tells users not to submit identifying information.
    """
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
    # Keep free-tier prompts comfortably below common TPM limits.
    for s in sources[:5]:
        title = _clip(s.get('title') or '업로드 자료', 140)
        year = _clip(s.get('year') or '', 20)
        excerpt = _clip(s.get('excerpt') or '', 1050)
        meta = f" ({year})" if year else ''
        blocks.append(f"[{s['id']}] {title}{meta}\n{excerpt}")
    return '\n\n'.join(blocks)


def _messages(request: ChatRequest, sources: list[dict]) -> list[dict]:
    mode = '의학 학습 모드' if request.mode == 'study' else '건강정보 모드'
    user = (
        f"현재 모드: {mode}\n\n"
        f"MEDI 업로드 근거자료:\n{_reference_text(sources)}\n\n"
        f"사용자 질문:\n{_redact_identifiers(request.message)}\n\n"
        "위 MEDI 근거자료를 먼저 활용해 답해라. 자료가 관련 있으면 실제 ID로 인용하고, "
        "관련이 없거나 부족하면 억지로 인용하지 마라. 개인 증상 질문이면 가능한 원인을 확정하지 말고 "
        "구분에 필요한 질문과 진료가 필요한 신호를 함께 설명해라."
    )
    out = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for h in request.history[-4:]:
        out.append({'role': h.role, 'content': _clip(_redact_identifiers(h.content), 1400)})
    out.append({'role': 'user', 'content': user})
    return out


def _text_to_answer(text: str, sources: list[dict], mode: str) -> MedicalAnswer:
    text = str(text or '').strip()
    if not text:
        raise ProviderError('empty_output', '무료 AI가 빈 답변을 반환했습니다.')

    allowed = {s['id'] for s in sources}
    chunks = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    if not chunks:
        chunks = [text]
    chunks = chunks[:7]

    paragraphs: list[Paragraph] = []
    used: set[str] = set()
    for chunk in chunks:
        ids = []
        for sid in re.findall(r'\[(S\d+)\]', chunk):
            if sid in allowed and sid not in ids:
                ids.append(sid)
                used.add(sid)
        # Keep citations visible in text as well as source buttons; this is clearer
        # when users export the conversation.
        heading = ''
        body = chunk
        first, sep, rest = chunk.partition('\n')
        if sep and len(first) <= 32 and not first.endswith(('.', '다', '요')):
            heading = first.strip('# *')
            body = rest.strip()
        paragraphs.append(Paragraph(heading=heading, text=body, source_ids=ids))

    evidence = 'supported' if sources and used else ('partial' if sources else 'insufficient')
    return MedicalAnswer(
        in_scope=True,
        urgency='general_information' if mode == 'study' else 'unknown',
        evidence_status=evidence,
        paragraphs=paragraphs,
        follow_up_questions=[],
        image_observations=[],
        limitations=DISCLAIMER + ' 생성형 AI의 설명은 오류가 있을 수 있으므로 중요한 의료 판단에는 의료진의 평가가 필요합니다.'
    )


async def _groq(request: ChatRequest, sources: list[dict], settings: Settings, transport=None) -> ProviderResult:
    payload = {
        'model': settings.groq_model,
        'messages': _messages(request, sources),
        'temperature': 0.2,
        'top_p': 0.9,
        'max_tokens': 1300,
        'stream': False,
        # Qwen 3.8 on Groq supports strict JSON-schema output. This prevents
        # UI-breaking ad-hoc formats while the server still checks citations.
        'response_format': {
            'type': 'json_schema',
            'json_schema': {
                'name': 'medi_medical_answer',
                'strict': True,
                'schema': ANSWER_SCHEMA,
            },
        },
    }
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(settings.timeout, connect=10), transport=transport, follow_redirects=False) as client:
            response = await client.post(
                'https://api.groq.com/openai/v1/chat/completions',
                headers={'Authorization': 'Bearer ' + settings.groq_api_key, 'Content-Type': 'application/json'},
                json=payload,
            )
    except httpx.TimeoutException as e:
        raise ProviderError('free_ai_timeout', 'Groq 무료 AI 응답 시간이 초과되었습니다.') from e
    except httpx.HTTPError as e:
        raise ProviderError('free_ai_network', 'Groq 무료 AI에 연결할 수 없습니다.') from e

    if response.status_code == 401:
        raise ProviderError('free_ai_key', 'GROQ_API_KEY를 확인해 주세요.')
    if response.status_code == 429:
        raise ProviderError('free_ai_limit', 'Groq 무료 사용 한도에 도달했습니다. 잠시 후 다시 시도하거나 브라우저 AI를 사용합니다.')
    if response.status_code >= 400:
        raise ProviderError('free_ai_upstream', f'Groq 요청 실패 ({response.status_code})')
    try:
        data = response.json()
        raw = json.loads(data['choices'][0]['message']['content'])
    except Exception as e:
        raise ProviderError('free_ai_output', 'Groq 구조화 응답 형식을 읽지 못했습니다.') from e
    return ProviderResult(_normalize_structured_answer(raw, sources), 'groq_free', settings.groq_model)


async def _gemini(request: ChatRequest, sources: list[dict], settings: Settings, transport=None) -> ProviderResult:
    messages = _messages(request, sources)
    system = messages[0]['content']
    conversation = []
    for m in messages[1:]:
        role = 'model' if m['role'] == 'assistant' else 'user'
        conversation.append({'role': role, 'parts': [{'text': m['content']}]})
    payload = {
        'system_instruction': {'parts': [{'text': system}]},
        'contents': conversation,
        'generationConfig': {'temperature': 0.2, 'topP': 0.9, 'maxOutputTokens': 1100},
    }
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent'
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(settings.timeout, connect=10), transport=transport, follow_redirects=False) as client:
            response = await client.post(url, headers={'x-goog-api-key': settings.gemini_api_key, 'Content-Type': 'application/json'}, json=payload)
    except httpx.TimeoutException as e:
        raise ProviderError('free_ai_timeout', 'Gemini 무료 AI 응답 시간이 초과되었습니다.') from e
    except httpx.HTTPError as e:
        raise ProviderError('free_ai_network', 'Gemini 무료 AI에 연결할 수 없습니다.') from e

    if response.status_code in {400, 401, 403}:
        raise ProviderError('free_ai_key', 'GEMINI_API_KEY 또는 Gemini 프로젝트 설정을 확인해 주세요.')
    if response.status_code == 429:
        raise ProviderError('free_ai_limit', 'Gemini 무료 사용 한도에 도달했습니다. 잠시 후 다시 시도합니다.')
    if response.status_code >= 400:
        raise ProviderError('free_ai_upstream', f'Gemini 요청 실패 ({response.status_code})')
    try:
        data = response.json()
        text = ''.join(p.get('text', '') for p in data['candidates'][0]['content']['parts'])
    except Exception as e:
        raise ProviderError('free_ai_output', 'Gemini 응답 형식을 읽지 못했습니다.') from e
    return ProviderResult(_text_to_answer(text, sources, request.mode), 'gemini_free', settings.gemini_model)


async def generate(request: ChatRequest, sources: list[dict], settings: Settings, transport=None) -> ProviderResult:
    """Generate with a configured free provider.

    In auto mode, a provider error falls through to the next configured free
    provider. If all fail, a ProviderError is raised so the server can use the
    browser-local model or retrieval-only fallback.
    """
    candidates: list[str] = []
    if settings.ai_provider == 'groq':
        candidates = ['groq'] if settings.groq_api_key else []
    elif settings.ai_provider == 'gemini':
        candidates = ['gemini'] if settings.gemini_api_key else []
    elif settings.ai_provider == 'browser':
        candidates = []
    else:
        if settings.groq_api_key:
            candidates.append('groq')
        if settings.gemini_api_key:
            candidates.append('gemini')

    if not candidates:
        raise ProviderError('free_ai_not_configured', '무료 서버 AI가 설정되지 않았습니다.')

    last_error: ProviderError | None = None
    for name in candidates:
        try:
            if name == 'groq':
                return await _groq(request, sources, settings, transport=transport)
            if name == 'gemini':
                return await _gemini(request, sources, settings, transport=transport)
        except ProviderError as e:
            last_error = e
            if settings.ai_provider != 'auto':
                raise
    raise last_error or ProviderError('free_ai_unavailable', '사용 가능한 무료 AI가 없습니다.')
