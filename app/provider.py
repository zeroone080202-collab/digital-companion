"""Free text-generation adapters for MEDI.

MEDI retrieves the operator's uploaded medical knowledge first. A configured
free provider then turns that evidence into a conversational answer. Vision-capable
providers can also receive sanitized image copies for visual explanation.

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
    for paragraph in answer.paragraphs[:4]:
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
        'follow_up_questions': answer.follow_up_questions[:3],
        'image_observations': answer.image_observations[:4],
        'limitations': '참고용 의료정보예요. 증상이 심하거나 걱정되는 변화가 있으면 의료진에게 확인하세요.',
    })


SYSTEM_PROMPT = """너는 MEDI라는 한국어 의료 전문 AI다. 사용자는 의학 전문가가 아니라 일반인이다.

답변 원칙:
1. MEDI에 연결된 의료지식 자료를 가장 먼저 참고한다. 관련 근거가 있으면 실제 [S1], [S2] ID만 사용한다.
2. 질문이 짧아도 넓게 이해한다. 질병, 증상, 검사, 수술, 약, 해부학, 의료기기, 응급처치 원리 등 의학 질문을 자연스럽게 답한다.
3. 첫 문장은 결론부터 아주 쉽게 말한다. 어려운 전문용어는 꼭 필요할 때만 쉬운 말 뒤 괄호에 붙인다.
4. 기본 답변은 짧고 읽기 쉽게 쓴다. 보통 2~3개 짧은 문단이면 충분하다. 사용자가 자세히 물을 때만 길게 설명한다.
5. '인공심폐기가 뭐야?' 같은 개념 질문은 '한마디로 → 언제 쓰는지 → 어떻게 작동하는지' 정도로 설명한다. 시험답안처럼 복잡한 문장이나 과도한 분류를 피한다.
6. 개인 증상 질문은 확정 진단하지 않는다. 흔한 가능성부터 이해하기 쉽게 설명하고, 꼭 필요한 경우에만 짧은 추가 질문 1~3개를 제시한다.
7. 처방약을 새로 시작·중단하거나 용량을 바꾸라고 지시하지 않는다.
8. 심한 흉통, 심한 호흡곤란, 의식저하, 새로 생긴 마비, 멈추지 않는 출혈 등 명확한 응급 신호가 있으면 119 또는 응급의료기관을 우선 안내한다.
9. 이미지가 있으면 실제로 보이는 내용과 일반적인 의미를 구분해서 설명한다. 검사결과지의 글자는 읽어 쉽게 풀어줄 수 있다. 상처·피부 사진은 보이는 특징을 설명할 수 있다. X-ray·CT·MRI는 보이는 구조나 의심되는 점을 참고 수준으로 설명하되 확정 판독이나 '정상' 보증을 하지 않는다.
10. 이미지에 보이지 않는 사실을 지어내지 않는다. 화질이 낮거나 판단이 어려우면 솔직하게 말한다.
11. MEDI 근거가 부족하면 억지로 자료를 끼워 맞추지 말고, 일반 의학지식임을 자연스럽게 구분한다.
12. source_ids에는 그 문단에서 실제로 사용한 MEDI 자료 ID만 넣는다.

이 시스템은 의료정보 이해를 돕는 도구이며 실제 의료진의 진료·검사·확정 진단·처방을 대신하지 않는다.
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
    question = _redact_identifiers(request.message).strip() or '첨부한 이미지를 일반인이 이해하기 쉽게 설명해줘.'
    user = (
        f"MEDI 의료지식 자료:\n{_reference_text(sources)}\n\n"
        f"사용자 질문:\n{question}\n\n"
        "MEDI 자료가 관련되면 먼저 활용하고 실제 source ID만 인용해라. "
        "답변은 일반인이 읽기 쉽게 짧고 자연스럽게 작성해라. "
        "이미지가 있으면 보이는 내용을 실제로 확인해서 설명하되 확정 진단처럼 말하지 마라."
    )
    out = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for h in request.history[-4:]:
        out.append({'role': h.role, 'content': _clip(_redact_identifiers(h.content), 1200)})
    out.append({'role': 'user', 'content': user})
    return out


def _data_url_parts(data_url: str) -> tuple[str, str]:
    match = re.fullmatch(r'data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)', data_url or '')
    if not match:
        raise ProviderError('invalid_image', '이미지 형식을 읽지 못했습니다.')
    return match.group(1), match.group(2)


def _groq_messages(request: ChatRequest, sources: list[dict]) -> list[dict]:
    messages = _messages(request, sources)
    if request.images:
        text = messages[-1]['content'] + (
            "\n\n첨부 이미지를 함께 확인해라. 반드시 JSON 객체로만 답하고 "
            "in_scope, urgency, evidence_status, paragraphs, follow_up_questions, image_observations, limitations 키를 모두 포함해라."
        )
        content = [{'type': 'text', 'text': text}]
        for image in request.images[:2]:
            content.append({'type': 'image_url', 'image_url': {'url': image.data_url}})
        messages[-1] = {'role': 'user', 'content': content}
    return messages


def _gemini_contents(request: ChatRequest, sources: list[dict]) -> tuple[str, list[dict]]:
    messages = _messages(request, sources)
    system = messages[0]['content']
    conversation = []
    tail = messages[1:]
    for index, m in enumerate(tail):
        role = 'model' if m['role'] == 'assistant' else 'user'
        parts = [{'text': m['content']}]
        if index == len(tail) - 1 and request.images:
            for image in request.images[:2]:
                mime, data = _data_url_parts(image.data_url)
                parts.append({'inline_data': {'mime_type': mime, 'data': data}})
        conversation.append({'role': role, 'parts': parts})
    return system, conversation


def _text_to_answer(text: str, sources: list[dict], mode: str) -> MedicalAnswer:
    text = str(text or '').strip()
    if not text:
        raise ProviderError('empty_output', '무료 AI가 빈 답변을 반환했습니다.')

    allowed = {s['id'] for s in sources}
    chunks = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    if not chunks:
        chunks = [text]
    chunks = chunks[:4]

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
        urgency='unknown',
        evidence_status=evidence,
        paragraphs=paragraphs,
        follow_up_questions=[],
        image_observations=[],
        limitations='참고용 의료정보예요. 증상이 심하거나 걱정되는 변화가 있으면 의료진에게 확인하세요.'
    )


async def _groq(request: ChatRequest, sources: list[dict], settings: Settings, transport=None) -> ProviderResult:
    payload = {
        'model': settings.groq_model,
        'messages': _groq_messages(request, sources),
        'temperature': 0.2,
        'top_p': 0.9,
        'max_tokens': 1300,
        'stream': False,
        'response_format': ({'type': 'json_object'} if request.images else {
            'type': 'json_schema',
            'json_schema': {
                'name': 'medi_medical_answer',
                'strict': True,
                'schema': ANSWER_SCHEMA,
            },
        }),
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
    system, conversation = _gemini_contents(request, sources)
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


async def image_search_query(request: ChatRequest, settings: Settings, transport=None) -> str:
    """Create a short retrieval query from attached images before final RAG.

    This first pass does not diagnose. It extracts visible medical terms, body
    region, document headings, or modality names so the local MEDI knowledge
    database can be searched even when the user sends only an image.
    """
    if not request.images:
        return ''
    prompt = (
        "이 의료 이미지를 MEDI 내부자료 검색용으로만 요약해라. 진단하지 말고, "
        "보이는 신체부위·검사명·의료용어·보고서 글자·상처의 겉모습 등 검색에 도움 되는 "
        "핵심어를 한국어 중심 3~8개로 뽑아 JSON {\"query\":\"...\"} 형식으로만 답해라."
    )
    candidates=[]
    if settings.ai_provider == 'groq':
        candidates=['groq'] if settings.groq_api_key else []
    elif settings.ai_provider == 'gemini':
        candidates=['gemini'] if settings.gemini_api_key else []
    elif settings.ai_provider == 'auto':
        if settings.groq_api_key: candidates.append('groq')
        if settings.gemini_api_key: candidates.append('gemini')
    for name in candidates:
        try:
            if name == 'groq':
                content=[{'type':'text','text':prompt}]
                for image in request.images[:2]:
                    content.append({'type':'image_url','image_url':{'url':image.data_url}})
                payload={'model':settings.groq_model,'messages':[{'role':'user','content':content}],
                         'temperature':0,'max_tokens':120,'stream':False,'response_format':{'type':'json_object'}}
                async with httpx.AsyncClient(timeout=httpx.Timeout(settings.timeout,connect=10),transport=transport,follow_redirects=False) as client:
                    response=await client.post('https://api.groq.com/openai/v1/chat/completions',headers={'Authorization':'Bearer '+settings.groq_api_key,'Content-Type':'application/json'},json=payload)
                if response.status_code>=400: continue
                raw=json.loads(response.json()['choices'][0]['message']['content'])
                return _clip(raw.get('query',''),300)
            if name == 'gemini':
                parts=[{'text':prompt}]
                for image in request.images[:2]:
                    mime,data=_data_url_parts(image.data_url)
                    parts.append({'inline_data':{'mime_type':mime,'data':data}})
                payload={'contents':[{'role':'user','parts':parts}],
                         'generationConfig':{'temperature':0,'maxOutputTokens':120,'responseMimeType':'application/json'}}
                url=f'https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent'
                async with httpx.AsyncClient(timeout=httpx.Timeout(settings.timeout,connect=10),transport=transport,follow_redirects=False) as client:
                    response=await client.post(url,headers={'x-goog-api-key':settings.gemini_api_key,'Content-Type':'application/json'},json=payload)
                if response.status_code>=400: continue
                text=''.join(p.get('text','') for p in response.json()['candidates'][0]['content']['parts'])
                raw=json.loads(text)
                return _clip(raw.get('query',''),300)
        except Exception:
            continue
    return ''


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
