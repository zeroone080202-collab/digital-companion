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


def _trim_for_consumer(value: str, max_chars: int = 430, max_sentences: int = 4) -> str:
    """Keep default answers short enough for non-medical users to scan.

    The model still receives the full MEDI evidence. This only limits how much
    of a default answer is shown unless the user explicitly asks for detail.
    """
    text = re.sub(r'[ \t]+', ' ', str(value or '')).strip()
    text = re.sub(r'\n{3,}', '\n\n', text)
    if len(text) <= max_chars:
        return text
    parts = re.split(r'(?<=[.!?。！？요다])\s+|\n+', text)
    kept = []
    total = 0
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if kept and (len(kept) >= max_sentences or total + len(part) > max_chars):
            break
        kept.append(part)
        total += len(part) + 1
    out = ' '.join(kept).strip()
    if not out:
        out = text[:max_chars].rstrip()
    if len(out) < len(text) and out[-1:] not in '.!?。！？요다':
        out = out.rstrip(' ,;:') + '…'
    return out


def _normalize_structured_answer(raw: dict, sources: list[dict]) -> MedicalAnswer:
    """Validate model JSON, refuse invented citations, and simplify display."""
    try:
        answer = MedicalAnswer.model_validate(raw)
    except Exception as e:
        raise ProviderError('free_ai_output', '무료 AI의 구조화된 답변을 검증하지 못했습니다.') from e

    allowed = {str(s.get('id')) for s in sources}
    used = set()
    cleaned = []
    for paragraph in answer.paragraphs[:3]:
        valid_ids = [sid for sid in paragraph.source_ids if sid in allowed]
        used.update(valid_ids)
        heading = paragraph.heading[:30].strip()
        text = _trim_for_consumer(paragraph.text, 430, 4)
        if text:
            cleaned.append(Paragraph(heading=heading, text=text, source_ids=valid_ids))
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
        'follow_up_questions': [_trim_for_consumer(q, 100, 1) for q in answer.follow_up_questions[:2]],
        'image_observations': [_trim_for_consumer(x, 220, 2) for x in answer.image_observations[:2]],
        'limitations': '참고용 정보예요. 증상이 심하거나 계속되면 의료진에게 확인하세요.',
    })


SYSTEM_PROMPT = """너는 MEDI라는 한국어 의료 전문 AI다. 사용자는 의학 전문가가 아니라 일반인이다.

가장 중요한 목표는 '정확한 의료정보를 쉬운 말로 짧게 설명하는 것'이다.

답변 규칙:
1. MEDI에 연결된 의료지식 자료를 먼저 참고한다. 관련 근거가 있으면 실제 [S1], [S2] ID만 source_ids에 넣고, 본문에는 [S1] 같은 표기를 넣지 않는다.
2. 첫 문장에서 질문에 바로 답한다. 서론, 교과서식 정의, 장황한 주의문구로 시작하지 않는다.
3. 기본 답변은 전체 250~500자 정도를 목표로 한다. 최대 3개 짧은 문단, 문단당 1~3문장 정도로 쓴다.
4. 사용자가 '자세히', '전문적으로', '논문', '기전'처럼 상세 설명을 요청한 경우에만 길게 설명한다.
5. 어려운 전문용어는 되도록 쓰지 않는다. 꼭 필요하면 '쉬운 말 (전문용어)' 순서로 한 번만 적는다.
6. 단순 개념 질문은 보통 '한마디로 → 어디에/언제 쓰는지 → 핵심 원리'만 설명한다.
7. 증상 질문은 흔한 가능성 2~3개까지만 말하고, 꼭 필요한 확인 질문은 최대 2개만 제시한다.
8. 긴 원인 목록, 드문 질환 나열, 병태생리 단계 나열, 논문 문체, 같은 의미 반복을 피한다.
9. 사용자가 올린 이미지가 있으면 실제로 보이는 것부터 쉬운 말로 설명한다. 글자가 있는 검사결과·약봉투는 읽어서 뜻을 풀어준다. 상처·피부 사진은 눈에 보이는 특징을 설명한다. X-ray·CT·MRI는 참고 수준으로만 설명하고 확정 판독이나 정상 보증을 하지 않는다.
10. 이미지에 없는 사실을 지어내지 않는다. 화질이나 범위가 부족하면 무엇이 부족한지만 짧게 말한다.
11. 처방약을 새로 시작·중단하거나 용량을 바꾸라고 지시하지 않는다.
12. 심한 흉통, 심한 호흡곤란, 의식저하, 새 마비, 멈추지 않는 출혈처럼 명확한 응급 신호가 있으면 다른 설명보다 119 또는 응급의료기관 안내를 먼저 한다.
13. MEDI 자료가 부족하면 억지로 근거를 끼워 맞추지 않는다.
14. 마지막에 긴 면책문구를 반복하지 않는다. UI가 별도로 짧은 주의문구를 보여준다.

좋은 예:
- '인공심폐기가 뭐야?' → '심장 수술 중 잠시 심장과 폐 역할을 대신해주는 기계예요. 혈액을 몸 밖으로 빼내 산소를 넣고 다시 몸으로 보내, 의사가 심장을 멈춘 상태에서도 수술할 수 있게 도와줍니다.'
- '무릎이 아파' → 먼저 흔한 원인 몇 가지를 쉬운 말로 설명하고, 붓기·다친 적 같은 핵심 질문만 묻는다.

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
        "MEDI 자료가 관련되면 먼저 활용하고 실제 source ID만 사용해라. "
        "기본 답변은 250~500자 정도로, 최대 3개 짧은 문단으로 작성해라. "
        "첫 문장에 바로 답하고 전문용어·긴 목록·교과서식 설명을 줄여라. "
        "이미지가 있으면 보이는 내용을 먼저 설명하되 확정 진단처럼 말하지 마라."
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
    chunks = chunks[:3]

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
        body = re.sub(r'\[(?:S\d+)\]', '', body).strip()
        paragraphs.append(Paragraph(heading=heading[:30], text=_trim_for_consumer(body, 430, 4), source_ids=ids))

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
        'max_tokens': 800,
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
        'generationConfig': {'temperature': 0.2, 'topP': 0.9, 'maxOutputTokens': 760},
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
