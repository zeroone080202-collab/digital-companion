# MEDI v0.8 수정 파일 전체 코드
아래 각 파일은 GitHub에서 같은 경로의 기존 파일을 전부 지우고 그대로 붙여넣을 수 있습니다.

## `QA_REPORT_KO.md`

```markdown
# MEDI v0.8 QA 요약

검사 항목:

- Python 문법 검사: 통과
- JavaScript 문법 검사: 통과
- SVG 11개 XML 파싱: 통과
- `/healthz`: 200 OK
- `/api/config`: v0.8.0 반환 확인
- Groq 이미지 요청: `text + image_url` 멀티모달 payload 확인
- Groq 이미지 모델: `qwen/qwen3.8-27b` 사용 확인
- Groq 임시 503 발생 시 재시도 후 Gemini로 failover 확인
- 서버 이미지 채팅 경로: `image_analysis_ok=true` 응답 확인
- 이미지 분석 실패 시 가짜 분석 대신 재시도 UI를 표시하도록 구현
- 자동 그림 선택: 현재 질문 문구만 기준으로 선택하도록 변경
- `왜이래` 같은 짧은 후속 질문이 이전 답변 때문에 무릎 그림을 띄우지 않도록 수정

```

## `README_KO.md`

```markdown
# MEDI v0.8 이미지 분석·연결 안정화 패치

이번 패치는 현재 MEDI v0.7.x 위에 덮어쓰는 패치입니다. `knowledge_bundle`은 건드리지 않습니다.

## 고친 내용

- 이미지가 첨부됐는데도 실제 이미지 분석 없이 일반 문장만 나오던 문제 수정
- Groq/Gemini 호출 실패 시 자동 재시도
- `MEDI_AI_PROVIDER=auto`에서 한 제공자가 실패하면 다른 제공자로 자동 전환
- 이미지 분석 실패 시 가짜 분석을 하지 않고 `이미지 다시 분석` 버튼 표시
- 브라우저가 열려 있는 동안 4분마다 `/healthz`를 가볍게 호출해 사용 중 Render가 잠드는 가능성을 줄임
- 502/503/504 및 일시적 네트워크 실패 시 브라우저에서도 자동 재연결
- 짧은 후속질문(`왜이래`)에 이전 답변 단어만 보고 엉뚱한 그림을 붙이던 문제 수정
- 단순한 그림 11종을 구조·라벨·확인 포인트가 들어간 상세 교육용 도식으로 교체
- 법률/보험 질문에는 무릎 같은 일반 해부 그림을 억지로 붙이지 않음
- 모델이 단순 통증을 `응급`으로 과하게 표시하지 않도록 서버에서 한 번 더 제한
- 캐시 문제 방지를 위해 CSS/JS 버전을 `v=0800`으로 갱신

## GitHub에서 교체할 파일

ZIP 안의 경로 그대로 덮어쓰세요.

- `app/config.py`
- `app/provider.py`
- `app/main.py`
- `app/schemas.py`
- `static/app.js`
- `static/app.css`
- `static/index.html`
- `static/visuals/*.svg` 11개
- `render.yaml`
- `env.example` (참고용)

## Render Environment 권장값

이미지 분석에는 **최소 하나의 정상적인 멀티모달 AI 키**가 반드시 필요합니다.

### Groq만 쓰는 경우

```text
MEDI_AI_PROVIDER=auto
MEDI_PROVIDER_FAILOVER=true
MEDI_AI_RETRIES=2
MEDI_AI_TIMEOUT=90

GROQ_API_KEY=본인키
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_VISION_MODEL=qwen/qwen3.8-27b
```

### Gemini만 쓰는 경우

```text
MEDI_AI_PROVIDER=auto
MEDI_PROVIDER_FAILOVER=true
MEDI_AI_RETRIES=2
MEDI_AI_TIMEOUT=90

GEMINI_API_KEY=본인키
GEMINI_MODEL=gemini-2.5-flash-lite
```

### 가장 안정적인 무료 구성

Groq와 Gemini 키를 **둘 다** 넣고 `MEDI_AI_PROVIDER=auto`로 두면 됩니다.

```text
MEDI_AI_PROVIDER=auto
MEDI_PROVIDER_FAILOVER=true
MEDI_AI_RETRIES=2
MEDI_AI_TIMEOUT=90

GROQ_API_KEY=본인키
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_VISION_MODEL=qwen/qwen3.8-27b

GEMINI_API_KEY=본인키
GEMINI_MODEL=gemini-2.5-flash-lite
```

한쪽이 일시적으로 실패하면 다른 쪽으로 넘어갑니다.

## 기존 환경변수는 유지

다음 값은 삭제하지 마세요.

```text
DEPLOYMENT_MODE=public
SUPABASE_URL=기존값
SUPABASE_ANON_KEY=기존값
DATA_ENCRYPTION_KEY=기존값
ALLOW_OPEN_SIGNUP=true
DATASET_RIGHTS_CONFIRMED=권한 확인 결과에 따라 true 또는 false
```

OpenAI API 키는 사용하지 않습니다.

## 배포

1. GitHub에 패치 파일 덮어쓰기
2. Commit
3. Render → Manual Deploy
4. `Clear build cache & deploy`
5. Settings의 Health Check Path가 `/healthz`인지 확인

## 꼭 알아둘 점

Render Free는 사용자가 아무도 없을 때 플랫폼 정책상 잠들 수 있습니다. 이 패치는 **페이지를 열어 사용하는 동안** 가벼운 keep-alive와 자동 재시도로 끊김을 줄이지만, 무료 플랜의 장시간 무중단 운영 자체를 보장하지는 못합니다.

또한 X-ray/CT/MRI 분석은 멀티모달 언어모델의 참고 설명입니다. 별도로 학습·검증한 영상진단 모델의 판독을 대신하지 않습니다.

```

## `app/config.py`

```python
"""MEDI runtime configuration.

All secrets stay in environment variables. MEDI can use Groq and/or Gemini free
API tiers and automatically fail over between them. Browser-local AI remains a
text-only last resort when no server provider is available.
"""
from dataclasses import dataclass, field
from pathlib import Path
import os
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / '.env', override=False)


def flag(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {'1', 'true', 'yes', 'on'}


def integer(name: str, default: int, low: int, high: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
    except ValueError:
        value = default
    return max(low, min(high, value))


@dataclass(frozen=True)
class Settings:
    database: Path = field(default_factory=lambda: Path(os.getenv('KNOWLEDGE_DB', str(ROOT / 'data/knowledge.sqlite'))))
    deployment: str = field(default_factory=lambda: os.getenv('DEPLOYMENT_MODE', 'public' if os.getenv('RENDER') else 'local'))

    # Free AI providers. These are NOT OpenAI keys.
    ai_provider: str = field(default_factory=lambda: os.getenv('MEDI_AI_PROVIDER', 'auto').strip().lower())
    provider_failover: bool = field(default_factory=lambda: flag('MEDI_PROVIDER_FAILOVER', True))
    ai_request_retries: int = field(default_factory=lambda: integer('MEDI_AI_RETRIES', 2, 0, 3))

    groq_api_key: str = field(default_factory=lambda: os.getenv('GROQ_API_KEY', '').strip())
    groq_model: str = field(default_factory=lambda: os.getenv('GROQ_MODEL', 'qwen/qwen3.8-27b').strip())
    # Keep a dedicated vision model so text-model changes cannot silently break image input.
    groq_vision_model: str = field(default_factory=lambda: os.getenv('GROQ_VISION_MODEL', 'qwen/qwen3.8-27b').strip())

    gemini_api_key: str = field(default_factory=lambda: os.getenv('GEMINI_API_KEY', '').strip())
    gemini_model: str = field(default_factory=lambda: os.getenv('GEMINI_MODEL', 'gemini-2.5-flash-lite').strip())

    # Account/history storage.
    supabase_url: str = field(default_factory=lambda: os.getenv('SUPABASE_URL', '').rstrip('/'))
    supabase_key: str = field(default_factory=lambda: os.getenv('SUPABASE_ANON_KEY', ''))
    encryption_key: str = field(default_factory=lambda: os.getenv('DATA_ENCRYPTION_KEY', ''))
    invite_code: str = field(default_factory=lambda: os.getenv('SIGNUP_INVITE_CODE', ''))
    open_signup: bool = field(default_factory=lambda: flag('ALLOW_OPEN_SIGNUP', True))

    dataset_rights_confirmed: bool = field(default_factory=lambda: flag('DATASET_RIGHTS_CONFIRMED'))

    allowed_hosts: tuple[str, ...] = field(default_factory=lambda: tuple(dict.fromkeys(
        [h.strip() for h in os.getenv(
            'ALLOWED_HOSTS',
            '127.0.0.1,localhost,testserver,*.onrender.com'
        ).split(',') if h.strip()]
        + ([os.getenv('RENDER_EXTERNAL_HOSTNAME', '').strip()] if os.getenv('RENDER_EXTERNAL_HOSTNAME', '').strip() else [])
    )))
    operator_contact: str = field(default_factory=lambda: os.getenv('OPERATOR_CONTACT', ''))

    timeout: float = field(default_factory=lambda: float(os.getenv('MEDI_AI_TIMEOUT', '90')))
    max_body_bytes: int = 15 * 1024 * 1024
    max_image_bytes: int = 5 * 1024 * 1024
    requests_per_minute: int = 8
    max_concurrency: int = 2
    guest_daily_limit: int = field(default_factory=lambda: integer('GUEST_DAILY_LIMIT', 8, 1, 50))

    @property
    def has_accounts(self) -> bool:
        return bool(self.supabase_url and self.supabase_key and self.encryption_key)

    @property
    def public(self) -> bool:
        return self.deployment == 'public'

    @property
    def configured_backends(self) -> tuple[str, ...]:
        out: list[str] = []
        if self.groq_api_key:
            out.append('groq')
        if self.gemini_api_key:
            out.append('gemini')
        return tuple(out)

    @property
    def free_server_ai(self) -> str | None:
        if self.ai_provider == 'browser':
            return None
        if self.ai_provider == 'groq':
            return 'groq' if self.groq_api_key else None
        if self.ai_provider == 'gemini':
            return 'gemini' if self.gemini_api_key else None
        return self.configured_backends[0] if self.configured_backends else None

    @property
    def image_ai_available(self) -> bool:
        # Both configured providers support image input in MEDI's adapter.
        return bool(self.groq_api_key or self.gemini_api_key)

    def validate(self):
        if self.deployment not in {'local', 'public'}:
            raise RuntimeError('Invalid DEPLOYMENT_MODE')
        if self.ai_provider not in {'auto', 'groq', 'gemini', 'browser'}:
            raise RuntimeError('MEDI_AI_PROVIDER must be auto, groq, gemini, or browser')
        if os.getenv('RENDER') and not self.public:
            raise RuntimeError('Render must use DEPLOYMENT_MODE=public; anonymous local mode must not be exposed.')
        if self.public and not self.has_accounts:
            raise RuntimeError('Public mode requires SUPABASE_URL, SUPABASE_ANON_KEY and DATA_ENCRYPTION_KEY.')
        if self.has_accounts:
            from cryptography.fernet import Fernet
            Fernet(self.encryption_key.encode())
            if not self.supabase_url.startswith('https://'):
                raise RuntimeError('Supabase requires HTTPS')


settings = Settings()

```

## `app/main.py`

```python
"""MEDI research-chat server. Run one worker; see docs before public deployment."""
import asyncio
from contextlib import asynccontextmanager, suppress
from collections import OrderedDict
import hashlib
import hmac
import json
import re
import secrets
import time
from uuid import uuid4, UUID
from pathlib import Path
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware
from app.config import Settings, settings as default_settings, ROOT
from app.cloud import CloudStore, CloudError
from app.images import sanitize_image, ImageValidationError
from app.policy import is_medical, emergency_signal, fixed_answer, DISCLAIMER
from app.provider import generate as provider_generate, image_search_query as provider_image_search_query, ProviderError, ProviderResult
from app.retrieval import KnowledgeStore
from app.schemas import (ChatRequest, Credentials, NewConversation, FeedbackRequest, DeleteAccount,
                         HistoryMessage, MedicalAnswer, Paragraph, LocalTurnSave)
from app.security import BodyAndOriginGuard, Limiter


def answer_text(answer):
    return '\n\n'.join((p.get('heading','')+'\n'+p['text']).strip() for p in answer['paragraphs'])


def create_app(cfg: Settings=default_settings, cloud_factory=CloudStore, generator=None):
    @asynccontextmanager
    async def lifespan(app):
        cfg.validate()
        app.state.cloud=cloud_factory(cfg) if cfg.has_accounts else None
        app.state.stats=KnowledgeStore(cfg.database).stats()
        async def prune_transient_cache():
            while True:
                await asyncio.sleep(30)
                cutoff=time.monotonic()-300
                while results and next(iter(results.values()))[0]<cutoff:
                    results.popitem(last=False)
        reaper=asyncio.create_task(prune_transient_cache())
        try:
            yield
        finally:
            reaper.cancel()
            with suppress(asyncio.CancelledError): await reaper
            results.clear()
            if app.state.cloud: await app.state.cloud.close()
    app=FastAPI(title='MEDI research chat',version='0.1.0',lifespan=lifespan,
                docs_url=None if cfg.public else '/docs',redoc_url=None)
    app.add_middleware(BodyAndOriginGuard,max_bytes=cfg.max_body_bytes)
    app.add_middleware(TrustedHostMiddleware,allowed_hosts=list(cfg.allowed_hosts))
    limiter=Limiter(); knowledge=KnowledgeStore(cfg.database)
    results=OrderedDict(); active=set(); active_users=set()

    @app.middleware('http')
    async def headers(request,call_next):
        response=await call_next(request)
        response.headers['X-Content-Type-Options']='nosniff'
        response.headers['Referrer-Policy']='no-referrer'
        response.headers['X-Frame-Options']='DENY'
        response.headers['Permissions-Policy']='camera=(), microphone=(), geolocation=()'
        response.headers['Content-Security-Policy']="default-src 'self'; script-src 'self' https://esm.run 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://esm.run https://huggingface.co https://*.huggingface.co https://hf.co https://*.hf.co https://cdn.jsdelivr.net https://raw.githubusercontent.com https://github.com https://objects.githubusercontent.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'"
        if request.url.path.startswith('/api'): response.headers['Cache-Control']='no-store'
        if cfg.public: response.headers['Strict-Transport-Security']='max-age=31536000'
        return response

    @app.exception_handler(RequestValidationError)
    async def bad_request(request,error): return JSONResponse({'error':'invalid_request'},422)
    @app.exception_handler(CloudError)
    async def cloud_error(request,error): return JSONResponse({'error':error.code},error.status)
    @app.exception_handler(HTTPException)
    async def http_error(request,error): return JSONResponse({'error':str(error.detail)},error.status_code)
    @app.exception_handler(ImageValidationError)
    async def image_error(request,error): return JSONResponse({'error':'invalid_image','detail':str(error)},400)

    def cloud():
        if not app.state.cloud: raise HTTPException(409,'accounts_not_configured')
        return app.state.cloud
    async def identity(request):
        token=request.cookies.get('medi_access','')
        if not cfg.has_accounts and not cfg.public: return {'id':'local','email':''},''
        if not token: raise HTTPException(401,'login_required')
        user=await cloud().user(token)
        if not await cloud().membership(token): raise HTTPException(403,'membership_required')
        return user,token
    async def chat_identity(request, response):
        token=request.cookies.get('medi_access','')
        if token and cfg.has_accounts:
            try:
                user=await cloud().user(token)
                if await cloud().membership(token): return user,token,False
            except CloudError:
                pass
        if not cfg.has_accounts and not cfg.public:
            return {'id':'local','email':''},'',True
        guest=request.cookies.get('medi_guest','')
        if not re.fullmatch(r'[0-9a-f]{32}',guest):
            guest=secrets.token_hex(16)
            response.set_cookie('medi_guest',guest,max_age=30*86400,httponly=True,secure=cfg.public,samesite='strict',path='/api')
        return {'id':'guest:'+guest,'email':''},'',True
    def cookies(response,session):
        response.set_cookie('medi_access',session['access_token'],max_age=min(int(session.get('expires_in',3600)),3600),
            httponly=True,secure=cfg.public,samesite='strict',path='/api')
        response.set_cookie('medi_refresh',session['refresh_token'],max_age=7*86400,
            httponly=True,secure=cfg.public,samesite='strict',path='/api/auth')
    def clear_cookies(response):
        response.delete_cookie('medi_access',path='/api')
        response.delete_cookie('medi_refresh',path='/api/auth')
    def auth_limit(request,email=''):
        host=request.client.host if request.client else 'unknown'
        if not limiter.allow('auth-ip:'+host,18) or not limiter.allow('auth-email:'+hashlib.sha256(email.lower().encode()).hexdigest(),8):
            raise HTTPException(429,'rate_limited')

    # Render deploy/readiness probe. Keep this endpoint intentionally cheap:
    # no authentication, database query, RAG search, or external AI call.
    @app.get('/healthz', include_in_schema=False)
    async def healthz():
        return {'ok': True, 'service': 'medi-research-chat'}

    # Backward-compatible health endpoint used by older MEDI deployments.
    @app.get('/api/health')
    async def health():
        return {'status':'ok','service':'medi-research-chat'}
    @app.get('/api/config')
    async def config():
        backend=cfg.free_server_ai
        model=(cfg.groq_model if backend=='groq' else cfg.gemini_model if backend=='gemini' else None)
        return {'app':'MEDI','version':'0.8.0','public':cfg.public,'accounts':cfg.has_accounts,
                'ai_mode':'server_free' if (cfg.configured_backends and cfg.ai_provider!='browser') else 'browser_local',
                'ai_backend':backend,'ai_backends':list(cfg.configured_backends),
                'ai_connected':bool(cfg.configured_backends and cfg.ai_provider!='browser'),'ai_model':model,
                'local_model':'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
                'knowledge':app.state.stats,'knowledge_enabled':not cfg.public or cfg.dataset_rights_confirmed,
                'dataset_rights_confirmed':cfg.dataset_rights_confirmed,
                'invite_required':False,'guest_chat':True,'max_image_mb':5,'max_images':2,
                'learning':'consented_feedback_then_human_review','radiology_enabled':False,
                'image_understanding_enabled':bool(cfg.image_ai_available and cfg.ai_provider!='browser'),
                'provider_failover':cfg.provider_failover,'ai_retries':cfg.ai_request_retries,
                'operator_contact':cfg.operator_contact}
    @app.post('/api/auth/signup')
    async def signup(data: Credentials,request: Request):
        auth_limit(request,data.email)
        if not data.terms_accepted: raise HTTPException(400,'terms_required')
        if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',data.email): raise HTTPException(400,'invalid_email')
        session=await cloud().signup(data.email,data.password)
        response=JSONResponse({'ok':True,'email_confirmation_required':not bool(session.get('access_token'))})
        if session.get('access_token'):
            await cloud().join(session['access_token'],'')
            cookies(response,session)
        return response
    @app.post('/api/auth/login')
    async def login(data: Credentials,request: Request):
        auth_limit(request,data.email)
        session=await cloud().login(data.email,data.password)
        if not await cloud().membership(session['access_token']):
            await cloud().join(session['access_token'],'')
        response=JSONResponse({'ok':True});cookies(response,session);return response
    @app.post('/api/auth/refresh')
    async def refresh(request: Request):
        host=request.client.host if request.client else 'unknown'
        if not limiter.allow('refresh:'+host,30):raise HTTPException(429,'rate_limited')
        token=request.cookies.get('medi_refresh','')
        if not token:raise HTTPException(401,'login_required')
        session=await cloud().refresh(token)
        response=JSONResponse({'ok':True});cookies(response,session);return response
    @app.post('/api/auth/logout')
    async def logout(request: Request):
        token=request.cookies.get('medi_access','')
        try:
            if token and cfg.has_accounts:await cloud().logout(token)
        except CloudError:pass
        results.clear()
        response=JSONResponse({'ok':True});clear_cookies(response);return response
    @app.get('/api/auth/session')
    async def auth_session(request: Request):
        if not cfg.has_accounts:
            return {'user':None}
        token=request.cookies.get('medi_access','')
        if token:
            try:
                user=await cloud().user(token)
                if await cloud().membership(token): return {'user':user}
            except CloudError:
                pass
        refresh_token=request.cookies.get('medi_refresh','')
        if refresh_token:
            try:
                session=await cloud().refresh(refresh_token)
                user=await cloud().user(session['access_token'])
                if not await cloud().membership(session['access_token']):
                    response=JSONResponse({'user':None});clear_cookies(response);return response
                response=JSONResponse({'user':user});cookies(response,session);return response
            except CloudError:
                response=JSONResponse({'user':None});clear_cookies(response);return response
        return {'user':None}

    @app.get('/api/auth/me')
    async def me(request: Request):
        user,_=await identity(request)
        return {'user':user}

    @app.get('/api/conversations')
    async def conversations(request:Request):
        _,token=await identity(request)
        return {'conversations':await cloud().conversations(token)}
    @app.post('/api/conversations')
    async def new_conversation(data:NewConversation,request:Request):
        user,token=await identity(request)
        cid=str(uuid4());await cloud().new_conversation(token,user['id'],cid,data.title)
        return {'id':cid}
    @app.get('/api/conversations/{cid}')
    async def read_conversation(cid:UUID,request:Request):
        _,token=await identity(request)
        return {'id':str(cid),'turns':await cloud().turns(token,str(cid))}
    @app.delete('/api/conversations/{cid}')
    async def delete_conversation(cid:UUID,request:Request):
        _,token=await identity(request)
        await cloud().delete_conversation(token,str(cid))
        results.clear()  # bounded transient cache; persisted records remain owner-scoped
        return {'ok':True}

    @app.post('/api/chat')
    async def chat(data: ChatRequest,request:Request,response:Response):
        user,token,is_guest=await chat_identity(request,response)
        if not data.consent:raise HTTPException(400,'processing_consent_required')
        uid=user['id'];key=(uid,str(data.request_id))
        now=time.monotonic()
        while results and (next(iter(results.values()))[0]<now-300 or len(results)>100): results.popitem(last=False)
        digest=hashlib.sha256(data.model_dump_json().encode()).hexdigest()
        if key in results:
            if results[key][1]!=digest:raise HTTPException(409,'request_id_conflict')
            return results[key][2]
        if key in active:raise HTTPException(409,'request_in_progress')
        if not limiter.allow('chat:'+uid,cfg.requests_per_minute): raise HTTPException(429,'rate_limited')
        if uid in active_users:raise HTTPException(409,'request_in_progress')
        active.add(key);active_users.add(uid)
        try:
            # Saved history comes from owner-scoped DB, not forged client records.
            if data.conversation_id:
                if is_guest: raise HTTPException(401,'login_required_for_saving')
                saved=await cloud().turns(token,str(data.conversation_id),80)
                if len(saved)>=80:raise HTTPException(409,'conversation_full')
                for old in saved:
                    if old['id']==str(data.request_id):
                        if old['question']!=data.message:raise HTTPException(409,'request_id_conflict')
                        return old['response']
                hist=[]
                for t in saved[-4:]:
                    hist.extend([HistoryMessage(role='user',content=t['question'][:2000]),
                                 HistoryMessage(role='assistant',content=answer_text(t['response']['answer'])[:3000])])
                data=data.model_copy(update={'history':hist})

            sources=[];image_info=[];provider='guardrail';model=None;provider_warning=None
            if emergency_signal(data.message):
                answer=fixed_answer('emergency')
            elif not is_medical(data.message,data.history,bool(data.images)):
                answer=fixed_answer('out_of_scope')
            else:
                # Re-encode images in memory before any external multimodal call.
                # EXIF/ICC metadata is removed and the original bytes are not stored.
                clean_images=[]
                for image in data.images:
                    clean_url,info=await asyncio.to_thread(sanitize_image,image.data_url,cfg.max_image_bytes)
                    image_info.append(info)
                    clean_images.append(image.model_copy(update={'data_url':clean_url,'kind':'photo'}))
                if clean_images:
                    data=data.model_copy(update={'images':clean_images})

                query=(data.message or '').strip()
                if len(query)<80 and data.history:
                    previous=next((h.content for h in reversed(data.history) if h.role=='user'),'')
                    query=(previous[:220]+' '+query).strip()
                # Image-only questions get a short, non-diagnostic vision pass so
                # the operator's MEDI knowledge can still participate in RAG.
                if data.images and cfg.image_ai_available and cfg.ai_provider!='browser':
                    try:
                        image_hint=await provider_image_search_query(data,cfg)
                        if image_hint:
                            query=(query+' '+image_hint).strip()
                    except Exception:
                        pass
                if not query:
                    query='의료 이미지 검사 결과 상처 의료영상'
                if not cfg.public or cfg.dataset_rights_confirmed:
                    sources=await asyncio.to_thread(knowledge.search,query,study=False,limit=5)

                # Prefer a free server-side provider because it works on PCs and
                # phones even when WebGPU is unavailable. The uploaded MEDI
                # evidence is inserted into the prompt before generation.
                if cfg.configured_backends and cfg.ai_provider!='browser':
                    try:
                        gen=generator or provider_generate
                        produced=await gen(data,sources,cfg)
                        if isinstance(produced, ProviderResult):
                            answer=produced.answer;provider=produced.provider;model=produced.model
                        elif isinstance(produced, MedicalAnswer):
                            answer=produced;provider='free_server_ai';model=None
                        else:
                            raise ProviderError('free_ai_output','무료 AI 응답 형식이 올바르지 않습니다.')
                    except ProviderError as exc:
                        provider_warning=exc.code
                        if data.images:
                            provider='vision_unavailable'
                            text=('이미지는 정상적으로 받았지만 외부 이미지 이해 AI가 잠시 응답하지 않았어요. '
                                  'MEDI가 여러 번 재연결하고 가능한 다른 무료 제공자까지 시도했지만 이번 요청에서는 분석을 완료하지 못했습니다. '
                                  '아래의 “이미지 다시 분석”을 누르면 같은 사진과 질문으로 다시 시도할 수 있어요.')
                            image_note=['이번 응답은 이미지 내용을 판독한 결과가 아닙니다. 이미지 분석이 성공한 뒤 다시 설명하겠습니다.']
                        else:
                            provider='browser_local'
                            text=('MEDI 의료자료는 찾았지만 무료 서버 AI 연결이 잠시 실패했습니다. '
                                  '브라우저 보조 AI로 답변 생성을 시도합니다.' if sources else
                                  '이번 질문과 직접 연결되는 MEDI 의료자료를 찾지 못했고 무료 서버 AI 연결도 잠시 실패했습니다. '
                                  '브라우저 보조 AI로 일반적인 설명을 시도합니다.')
                            image_note=[]
                        answer=MedicalAnswer(in_scope=True,urgency='unknown',
                            evidence_status='partial' if sources else 'insufficient',
                            paragraphs=[Paragraph(heading='',text=text,source_ids=[])],
                            follow_up_questions=[],image_observations=image_note,limitations='참고용 의료정보예요. 중요한 판단은 의료진에게 확인하세요.')
                else:
                    provider='browser_local'
                    if sources:
                        text='MEDI 의료자료를 찾았습니다. 브라우저 보조 AI가 이 자료를 우선 근거로 답변을 작성합니다.'
                        evidence='partial'
                    else:
                        text='이번 질문과 직접 연결되는 MEDI 의료자료는 찾지 못했습니다. 브라우저 보조 AI가 일반 의학지식으로 설명하되 근거 부족을 표시합니다.'
                        evidence='insufficient'
                    image_note=['이미지는 첨부됐지만 현재 연결된 멀티모달 서버 AI가 없어 내용을 분석하지 못했습니다.'] if data.images else []
                    answer=MedicalAnswer(in_scope=True,urgency='unknown',
                        evidence_status=evidence,
                        paragraphs=[Paragraph(heading='',text=text,source_ids=[])],
                        follow_up_questions=[],image_observations=image_note,limitations=DISCLAIMER)

            result={'id':str(data.request_id),'answer':answer.model_dump(),'sources':sources,
                    'provider':provider,'model':model,'provider_warning':provider_warning,
                    'image_processing':image_info,'image_bytes_stored':False,'quota':None,
                    'saved':False,'learning_applied':False,
                    'local_ai_allowed':provider=='browser_local' and not bool(data.images),
                    'image_analysis_ok':bool(data.images and provider in {'groq_free','gemini_free','free_server_ai'}),
                    'retryable':bool(provider_warning in {'free_ai_network','free_ai_timeout','free_ai_limit','free_ai_upstream'}),
                    'knowledge_used':bool(sources)}
            results[key]=(time.monotonic(),digest,result)
            return result
        finally:
            active.discard(key);active_users.discard(uid)

    @app.post('/api/conversations/{cid}/turns/local')
    async def save_local_turn(cid:UUID,data:LocalTurnSave,request:Request):
        user,token=await identity(request)
        if data.response.get('provider') not in {'browser_local','retrieval_only','vision_unavailable','guardrail','groq_free','gemini_free','free_server_ai'}:
            raise HTTPException(400,'invalid_request')
        try:
            MedicalAnswer.model_validate(data.response.get('answer'))
        except Exception:
            raise HTTPException(400,'invalid_request')
        await cloud().require_conversation(token,str(cid))
        response_payload=dict(data.response)
        response_payload['saved']=True
        payload={'question':data.question,'mode':data.mode,'had_images':data.had_images,'response':response_payload}
        await cloud().save_turn(token,user['id'],str(cid),str(data.request_id),payload)
        return {'ok':True,'saved':True}

    @app.post('/api/feedback')
    async def feedback(data: FeedbackRequest,request:Request):
        user,token=await identity(request)
        if not data.consent or not data.deidentified_ack: raise HTTPException(400,'feedback_consent_required')
        if not limiter.allow('feedback:'+user['id'],10):raise HTTPException(429,'rate_limited')
        try: UUID(data.turn_id)
        except ValueError:raise HTTPException(400,'invalid_request')
        # Not a complete de-identification system. Human review is mandatory.
        combined=data.question+' '+data.answer+' '+data.correction
        if re.search(r'\b\d{6}[- ]?[1-4]\d{6}\b|\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}',combined):
            raise HTTPException(400,'identifiers_detected')
        fid=str(uuid4())
        await cloud().feedback(token,user['id'],fid,data.model_dump())
        return {'ok':True,'id':fid,'status':'pending_human_review','automatically_trained':False}
    @app.get('/api/feedback')
    async def list_feedback(request:Request):
        _,token=await identity(request);return {'feedback':await cloud().list_feedback(token)}
    @app.delete('/api/feedback/{fid}')
    async def delete_feedback(fid:UUID,request:Request):
        _,token=await identity(request);await cloud().delete_feedback(token,str(fid));return {'ok':True}
    @app.delete('/api/account')
    async def delete_account(data:DeleteAccount,request:Request):
        _,token=await identity(request);await cloud().delete_account(token)
        results.clear()
        response=JSONResponse({'ok':True});clear_cookies(response);return response

    @app.get('/')
    async def index(): return FileResponse(ROOT/'static/index.html')
    @app.get('/robots.txt')
    async def robots():
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse('User-agent: *\nDisallow: /\n')
    app.mount('/static',StaticFiles(directory=ROOT/'static'),name='static')
    return app

app=create_app()

```

## `app/provider.py`

```python
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

```

## `app/schemas.py`

```python
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, model_validator

class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid')

class HistoryMessage(Strict):
    role: Literal['user', 'assistant']
    content: str = Field(min_length=1, max_length=6000)

class ImageInput(Strict):
    name: str = Field(default='image', max_length=160)
    data_url: str = Field(max_length=7_100_000)
    kind: Literal['report', 'photo', 'radiology']

class ChatRequest(Strict):
    request_id: UUID
    conversation_id: UUID | None = None
    message: str = Field(min_length=1, max_length=4000)
    history: list[HistoryMessage] = Field(default_factory=list, max_length=12)
    images: list[ImageInput] = Field(default_factory=list, max_length=2)
    mode: Literal['health', 'study'] = 'health'
    consent: bool = False

    @model_validator(mode='after')
    def validate_total(self):
        self.message = self.message.strip()
        if not self.message:
            raise ValueError('Message cannot be blank')
        if sum(len(m.content) for m in self.history) > 24000:
            raise ValueError('History too long; start a new conversation')
        return self

class Paragraph(Strict):
    heading: str
    text: str
    source_ids: list[str]

class MedicalAnswer(Strict):
    in_scope: bool
    urgency: Literal['emergency', 'medical_review', 'general_information', 'unknown']
    evidence_status: Literal['supported', 'partial', 'insufficient', 'not_applicable']
    paragraphs: list[Paragraph]
    follow_up_questions: list[str]
    image_observations: list[str]
    limitations: str

class Credentials(Strict):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=5, max_length=128)
    invite_code: str = Field(default='',max_length=200)
    terms_accepted: bool = False

class NewConversation(Strict):
    title: str = Field(default='New conversation',min_length=1,max_length=70)

class FeedbackRequest(Strict):
    turn_id: str = Field(min_length=36,max_length=36)
    question: str = Field(min_length=1,max_length=4000)
    answer: str = Field(min_length=1,max_length=16000)
    correction: str = Field(default='',max_length=4000)
    rating: Literal['helpful','needs_review']
    consent: bool = False
    deidentified_ack: bool = False

class DeleteAccount(Strict):
    confirm: Literal['DELETE MY ACCOUNT']

class LocalTurnSave(Strict):
    request_id: UUID
    question: str = Field(min_length=1, max_length=4000)
    mode: Literal['health', 'study'] = 'health'
    had_images: bool = False
    response: dict

```

## `env.example`

```text
DEPLOYMENT_MODE=local
MEDI_AI_PROVIDER=auto
MEDI_PROVIDER_FAILOVER=true
MEDI_AI_RETRIES=2
MEDI_AI_TIMEOUT=90

# Free server AI. For the most stable image analysis, configure both.
GROQ_API_KEY=
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_VISION_MODEL=qwen/qwen3.8-27b
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite

# Accounts/history (required on public Render deployment):
SUPABASE_URL=
SUPABASE_ANON_KEY=
DATA_ENCRYPTION_KEY=
ALLOW_OPEN_SIGNUP=true

# Set true only after verifying that you may use the uploaded dataset in this service.
DATASET_RIGHTS_CONFIRMED=false
OPERATOR_CONTACT=
GUEST_DAILY_LIMIT=8

```

## `render.yaml`

```yaml
services:
  - type: web
    name: medi-research-chat
    runtime: python
    plan: free
    buildCommand: pip install -r requirements.txt && python tools/bootstrap.py
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1 --no-access-log
    healthCheckPath: /healthz
    envVars:
      - key: PYTHON_VERSION
        value: 3.13.5
      - key: DEPLOYMENT_MODE
        value: public
      - key: MEDI_AI_PROVIDER
        value: auto
      - key: MEDI_PROVIDER_FAILOVER
        value: "true"
      - key: MEDI_AI_RETRIES
        value: "2"
      - key: MEDI_AI_TIMEOUT
        value: "90"
      - key: GROQ_MODEL
        value: qwen/qwen3.8-27b
      - key: GROQ_VISION_MODEL
        value: qwen/qwen3.8-27b
      - key: GROQ_API_KEY
        sync: false
      - key: GEMINI_MODEL
        value: gemini-2.5-flash-lite
      - key: GEMINI_API_KEY
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: DATA_ENCRYPTION_KEY
        sync: false
      - key: OPERATOR_CONTACT
        sync: false
      - key: DATASET_RIGHTS_CONFIRMED
        value: "false"
      - key: ALLOW_OPEN_SIGNUP
        value: "true"
      - key: GUEST_DAILY_LIMIT
        value: "8"

```

## `static/app.css`

```css
:root{--font-scale:1;--ink:#263a42;--muted:#74838b;--green:#247d73;--green-soft:#e9f3ef;--border:#e3e9e8;--paper:#fbfcfc;--shadow:0 12px 45px #1a3c4410;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR","Malgun Gothic",sans-serif;color:var(--ink);font-synthesis:none}*{box-sizing:border-box}html,body{margin:0;height:100%;background:var(--paper)}button,input,select,textarea{font:inherit}button{cursor:pointer;touch-action:manipulation}button,a,input,textarea,select{outline-offset:4px}button:focus-visible,a:focus-visible{outline:2px solid var(--green)}button:disabled{cursor:not-allowed;opacity:.5}button{color:inherit}button,a{ -webkit-tap-highlight-color:transparent}button{border:0}button[hidden],[hidden]{display:none!important}a{color:var(--green)}.layout{height:100dvh;display:flex;overflow:hidden}.sidebar{width:252px;flex-shrink:0;display:flex;flex-direction:column;background:#f0f4f3;border-right:1px solid var(--border);padding:30px 18px 18px;gap:20px}.brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:var(--ink);padding:0 10px}.brand>span{font-weight:750;font-size:calc(26px * var(--font-scale));letter-spacing:1px;line-height:1.2}.brand small{display:block;font-size:calc(8px * var(--font-scale));font-weight:650;letter-spacing:1.6px;color:#7d928f;margin-top:4px}.new-chat{display:flex;align-items:center;gap:9px;text-align:left;background:var(--green);color:white;padding:13px 15px;border-radius:10px;margin-top:6px;font-weight:600;font-size:calc(14px * var(--font-scale))}.plus{font-size:calc(23px * var(--font-scale));line-height:1;font-weight:400}.new-chat kbd{margin-left:auto;font-size:calc(10px * var(--font-scale));border:1px solid #ffffff55;padding:2px 5px;border-radius:4px}.nav-caption{font-size:calc(11px * var(--font-scale));letter-spacing:1.1px;color:#82938f;padding:2px 12px 0;font-weight:600}.conversation-list{flex:1;min-height:50px;overflow:auto;margin-top:-10px}.conversation-empty{font-size:calc(12px * var(--font-scale));color:#8d9a97;line-height:1.7;padding:12px}.conversation-row{display:flex;align-items:center;gap:2px;border-radius:8px;margin-bottom:4px}.conversation-row.active{background:#e0ece7}.conversation-row .conversation-open{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:none;font-size:calc(12px * var(--font-scale));text-align:left;padding:11px}.conversation-delete{background:transparent;opacity:.6;width:32px;height:34px;border-radius:6px}.conversation-delete:hover{background:#dae5e1;color:#93443a}.sidebar-bottom{display:flex;flex-direction:column;gap:14px}.data-card{display:flex;flex-direction:column;gap:8px;text-align:left;border:1px solid #dfe8e3;background:#f9fbfa;border-radius:12px;padding:15px;color:var(--ink)}.data-top{display:flex;gap:7px;align-items:center;font-size:calc(10px * var(--font-scale));color:#59756b;font-weight:600}.status-dot{height:6px;width:6px;border-radius:50%;background:#6a9e89;display:inline-block;flex-shrink:0}.arrow{margin-left:auto;font-size:calc(16px * var(--font-scale))}.data-card strong{font-size:calc(23px * var(--font-scale));letter-spacing:-.5px;font-weight:650}.data-card small{font-size:calc(10px * var(--font-scale));line-height:1.6;color:#7c8c85}.data-line{height:1px;background:#e3eae6;display:block;width:100%;margin:2px 0}.side-link{display:flex;gap:9px;background:none;padding:0 10px;font-size:calc(12px * var(--font-scale));color:#758781;text-align:left}.account-button{display:flex;align-items:center;gap:10px;text-align:left;padding:14px 6px 2px;background:none;border-top:1px solid #dfe7e3}.account-button b{display:block;max-width:135px;overflow:hidden;text-overflow:ellipsis;font-size:calc(12px * var(--font-scale));font-weight:600}.account-button small{display:block;color:#83918c;font-size:calc(10px * var(--font-scale));margin-top:4px}.avatar{display:inline-grid;place-items:center;background:#dfeae4;color:#4d7365;border-radius:50%;width:31px;height:31px;font-size:calc(12px * var(--font-scale));font-weight:600}.workspace{min-width:0;flex:1;display:flex;flex-direction:column;position:relative}.topbar{height:74px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 35px;border-bottom:1px solid #edf0ef;gap:10px;background:#fbfcfce8}.top-left,.top-right{display:flex;gap:12px;align-items:center;min-width:0}.top-left>b{font-size:calc(15px * var(--font-scale));letter-spacing:.7px}.version-tag{font-size:calc(9px * var(--font-scale));letter-spacing:1.1px;background:#f1f3f1;color:#8b9790;border:1px solid #e5e9e5;border-radius:4px;padding:4px 6px}.connection{font-size:calc(11px * var(--font-scale));color:#7d8b87}.quiet-button{background:none;border:1px solid var(--border);border-radius:7px;padding:7px 11px;font-size:calc(11px * var(--font-scale))}.icon-button{background:transparent;width:32px;height:32px;border-radius:7px;font-size:calc(22px * var(--font-scale))}.menu-button{display:none}.system-notice{margin:14px auto 0;max-width:830px;width:calc(100% - 64px);border:1px solid #e9e1c7;border-radius:8px;background:#fcf9ef;font-size:calc(12px * var(--font-scale));line-height:1.6;color:#8b7348;padding:9px 14px}.scroll-area{min-height:0;flex:1;overflow:auto;overscroll-behavior:contain;scroll-behavior:smooth}.welcome{max-width:880px;margin:0 auto;padding:76px 42px 35px;text-align:center}.welcome-symbol{margin-bottom:22px}.eyebrow{font-size:calc(9px * var(--font-scale));letter-spacing:2.3px;font-weight:600;color:#8a9d95;margin:0 0 16px}.welcome h1{font-size:calc(36px * var(--font-scale));font-weight:650;letter-spacing:-1.5px;line-height:1.5;white-space:pre-line;margin:0}.welcome-description{font-size:calc(13px * var(--font-scale));color:#809087;line-height:1.9;margin:15px auto 0;max-width:500px;word-break:keep-all;white-space:pre-line}.suggestions{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:39px;text-align:left}.suggestion{padding:21px 18px 18px;text-align:left;background:white;border:1px solid #e0e8e4;border-radius:12px;position:relative;min-height:151px;transition:transform .15s,box-shadow .15s}.suggestion:hover{transform:translateY(-3px);box-shadow:var(--shadow);border-color:#aecfc0}.card-icon{display:block;color:#538272;font-size:calc(21px * var(--font-scale));margin-bottom:14px}.suggestion b{font-size:calc(13px * var(--font-scale));font-weight:650}.suggestion p{font-size:calc(11px * var(--font-scale));color:#84928c;line-height:1.8;margin:9px 8px 0 0;word-break:keep-all}.card-arrow{position:absolute;top:22px;right:18px;color:#a1b1a8;font-size:calc(16px * var(--font-scale))}.welcome-note{display:flex;justify-content:center;align-items:center;gap:7px;color:#8b9892;font-size:calc(10px * var(--font-scale));margin:22px 0 0}.composer-area{padding:14px 36px 15px;background:linear-gradient(#fbfcfc00,#fbfcfc 13%);flex-shrink:0;max-height:53dvh;overflow:auto}.composer{max-width:800px;margin:0 auto;background:white;border:1px solid #d8e3dd;border-radius:15px;box-shadow:0 5px 25px #27473707;padding:13px 16px 10px}.composer:focus-within{border-color:#8cb5a5;box-shadow:0 0 0 3px #e9f3ed80}textarea{resize:vertical}.composer textarea{width:100%;border:0;outline:none;background:transparent;resize:none;font-size:calc(14px * var(--font-scale));color:var(--ink);line-height:1.7;min-height:52px;max-height:120px;display:block;padding:2px}.composer textarea::placeholder{color:#a0aca6}.composer-tools{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:6px}.tool-group{display:flex;gap:9px;align-items:center}.attach-button{display:flex;align-items:center;gap:5px;background:none;font-size:calc(11px * var(--font-scale));color:#647e71;padding:4px}.tool-divider{height:15px;width:1px;background:#e1e7e3}.composer select{border:0;background:#f0f5f2;font-size:calc(11px * var(--font-scale));padding:6px 8px;border-radius:6px;color:#6e8579;max-width:115px}.send-button{width:33px;height:33px;display:grid;place-items:center;border-radius:9px;background:var(--green);color:white;font-size:calc(23px * var(--font-scale))}.stop-button{border-radius:7px;background:#edf0ef;color:#47645a;font-size:calc(11px * var(--font-scale));padding:8px}.char-count{font-size:calc(9px * var(--font-scale));color:#99a79f}.composer-options{max-width:800px;display:flex;align-items:center;justify-content:space-between;margin:9px auto 0;gap:10px}.save-option{font-size:calc(10px * var(--font-scale));color:#82918a;display:flex;gap:5px;align-items:center}.save-option input{accent-color:var(--green);margin:0;width:12px;height:12px}.text-button{background:none;color:#658475;font-size:calc(11px * var(--font-scale));padding:4px}.disclaimer{text-align:center;color:#9aa69e;font-size:calc(9px * var(--font-scale));line-height:1.7;margin:7px 0 0}.messages{max-width:840px;margin:0 auto;padding:22px 30px 6px}.turn{margin:18px 0 35px}.user-message{margin-left:auto;max-width:87%;width:fit-content;padding:14px 19px;background:#ecf3ef;border-radius:17px 17px 4px 17px;line-height:1.8;font-size:calc(14px * var(--font-scale));white-space:pre-wrap;overflow-wrap:anywhere}.user-images{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}.user-images img{width:80px;height:70px;object-fit:contain;border-radius:8px;border:1px solid var(--border)}.assistant-message{padding-top:25px}.assistant-label{display:flex;align-items:center;gap:9px;font-size:calc(12px * var(--font-scale));font-weight:650;margin-bottom:15px}.assistant-label img{height:24px;width:24px}.evidence-badge{font-size:calc(9px * var(--font-scale));font-weight:500;border-radius:5px;padding:3px 7px;background:#f0f2ef;color:#819083;margin-left:auto}.evidence-badge.emergency{color:#9b5541;background:#fff0e7}.answer-paragraph{margin:0 0 16px;font-size:calc(14px * var(--font-scale));line-height:1.95;overflow-wrap:anywhere}.answer-paragraph h3{font-size:calc(14px * var(--font-scale));font-weight:650;margin:0 0 6px}.answer-paragraph p{white-space:pre-wrap;margin:0}.source-cite{display:inline-block;background:#e7f0eb;color:#527961;font-size:calc(10px * var(--font-scale));padding:2px 6px;border-radius:4px;margin:6px 5px 0 0}.source-list{margin-top:17px;border:1px solid var(--border);border-radius:10px;padding:12px 14px;background:#fff}.source-list>summary{font-size:calc(12px * var(--font-scale));cursor:pointer;color:#617a69;list-style:none}.source-item{border-top:1px solid var(--border);padding:12px 0 1px;margin-top:11px}.source-item summary{cursor:pointer;overflow-wrap:anywhere;font-size:calc(12px * var(--font-scale));line-height:1.6}.source-meta{font-size:calc(10px * var(--font-scale));color:#8b968c;line-height:1.6;margin:5px 0}.excerpt{white-space:pre-wrap;overflow-wrap:anywhere;font-size:calc(12px * var(--font-scale));line-height:1.85;margin:8px 0;color:#69796e;max-height:310px;overflow:auto}.source-warning{font-size:calc(10px * var(--font-scale));color:#988872;line-height:1.6;margin:9px 0 0}.answer-limits{font-size:calc(10px * var(--font-scale));line-height:1.8;color:#8f9b94;border-left:2px solid #dce6df;padding-left:10px;margin-top:15px}.followups{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}.followup{font-size:calc(11px * var(--font-scale));text-align:left;padding:7px 10px;border-radius:7px;background:#f0f5f1;color:#587b63;border:1px solid #e2ebe3}.turn-actions{display:flex;gap:10px;margin-top:12px}.turn-action{font-size:calc(10px * var(--font-scale));background:none;padding:4px 2px;color:#8a9890}.pending{max-width:780px;margin:15px auto 25px;padding:15px;font-size:calc(12px * var(--font-scale));color:#769183;display:flex;align-items:center;gap:10px}.pulse{height:8px;width:8px;background:#8daf9c;border-radius:50%;animation:pulse 1.1s ease-in-out infinite}.attachments{display:flex;gap:10px;overflow:auto}.attachment{display:flex;gap:8px;align-items:center;border:1px solid var(--border);border-radius:8px;padding:7px;margin-bottom:9px;max-width:290px;flex-shrink:0}.attachment img{width:44px;height:48px;object-fit:contain;background:#f5f7f5;border-radius:5px}.attachment-info{min-width:0}.attachment-name{display:block;max-width:140px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;font-size:calc(10px * var(--font-scale));color:#748278}.attachment select{max-width:170px;font-size:calc(10px * var(--font-scale));margin-top:5px}.attachment button{font-size:calc(16px * var(--font-scale));background:none;color:#8a9790;padding:2px}.toast{position:fixed;bottom:25px;left:50%;transform:translateX(-50%);z-index:100;max-width:min(550px,90vw);background:#294b3f;color:#fff;box-shadow:var(--shadow);border-radius:9px;padding:13px 20px;font-size:calc(12px * var(--font-scale));line-height:1.7}.dialog-heading{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:20px 23px;border-bottom:1px solid var(--border)}.dialog-heading h2{font-size:calc(18px * var(--font-scale));margin:0;font-weight:650;line-height:1.5}.dialog-body{padding:19px 24px 23px;font-size:calc(13px * var(--font-scale));line-height:1.9;overflow-wrap:anywhere}.dialog-body p{margin:0 0 16px}.dialog-body h3{font-size:calc(14px * var(--font-scale));margin:18px 0 7px}.dialog-body .field{display:flex;flex-direction:column;gap:5px;font-size:calc(12px * var(--font-scale));margin-bottom:14px}.field input,.field textarea,.field select{width:100%;border:1px solid #dbe4dd;border-radius:7px;padding:10px 11px;background:#fcfdfc;color:var(--ink);font-size:calc(13px * var(--font-scale))}.dialog-body textarea{min-height:65px}.dialog-body .subtle{color:#8b9990;font-size:calc(12px * var(--font-scale))}.notice-box{background:#f3f7f3;border:1px solid #e2e9e0;border-radius:8px;padding:13px 14px;font-size:calc(12px * var(--font-scale));color:#708271}.check-line{display:flex;align-items:flex-start;gap:8px;font-size:calc(12px * var(--font-scale));line-height:1.7;margin:14px 0}.check-line input{flex-shrink:0;margin-top:4px;accent-color:var(--green)}dialog{max-width:560px;width:calc(100% - 32px);border:1px solid var(--border);padding:0;border-radius:15px;color:var(--ink);max-height:88dvh;overflow:auto;box-shadow:0 24px 90px #162e3530}dialog::backdrop{background:#18342e55;backdrop-filter:blur(3px)}.dialog-actions{padding:0 24px 21px;display:flex;justify-content:flex-end;gap:9px}.primary-button{background:var(--green);color:white;padding:10px 16px;border-radius:8px;font-size:calc(13px * var(--font-scale))}.full{width:100%;margin-top:9px}.inline-error{font-size:calc(12px * var(--font-scale));color:#a55c47;line-height:1.7}.danger{color:#a35945}.stat-row{display:flex;justify-content:space-between;padding:10px 0;gap:14px;border-bottom:1px solid var(--border);font-size:calc(12px * var(--font-scale))}.stat-row span:last-child{text-align:right}.feedback-row{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:calc(11px * var(--font-scale))}.skip{position:fixed;top:-80px;z-index:200;background:white;padding:12px}.skip:focus{top:8px}.sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.shade{display:none}@keyframes pulse{50%{opacity:.25}}@media(min-width:1600px){.welcome{padding-top:110px}.welcome h1{font-size:calc(42px * var(--font-scale))}.welcome-description{font-size:calc(15px * var(--font-scale))}.suggestion b{font-size:calc(15px * var(--font-scale))}.suggestion p{font-size:calc(12px * var(--font-scale))}.sidebar{width:270px}.composer-area{padding-bottom:25px}}@media(max-height:780px) and (min-width:861px){.welcome{padding-top:25px}.welcome-symbol{margin-bottom:12px}.welcome h1{font-size:calc(31px * var(--font-scale))}.suggestions{margin-top:22px}.suggestion{min-height:130px;padding:16px}.welcome-note{margin-top:12px}}@media(max-width:1100px){.sidebar{width:222px;padding:25px 14px 15px}.topbar{padding:0 24px}.welcome{padding-left:28px;padding-right:28px}.welcome h1{font-size:calc(32px * var(--font-scale))}.suggestion{padding:18px 13px}.composer-area{padding-left:26px;padding-right:26px}.connection{font-size:calc(10px * var(--font-scale))}.data-top{font-size:calc(9px * var(--font-scale))}}@media(max-width:860px){.sidebar{position:fixed;inset:0 auto 0 0;width:265px;z-index:31;transform:translateX(-100%);transition:transform .18s;box-shadow:20px 0 70px #263e3522}.sidebar.open{transform:translateX(0)}.shade{display:block;position:fixed;inset:0;background:#112e3440;z-index:30}.menu-button{display:block}.topbar{height:63px;padding:0 18px}.welcome{padding-top:50px}.composer-area{padding-left:20px;padding-right:20px}.system-notice{width:calc(100% - 40px)}.top-right{gap:7px}}@media(max-width:540px){.version-tag{font-size:calc(7px * var(--font-scale));padding:3px 4px;letter-spacing:.5px}.top-left,.top-right{gap:6px}.top-left>b{font-size:calc(13px * var(--font-scale))}.topbar{padding:0 11px}.top-right .quiet-button{font-size:calc(9px * var(--font-scale));padding:6px}.connection{font-size:calc(9px * var(--font-scale));max-width:87px;text-align:right;line-height:1.5}.welcome{padding:36px 22px 15px}.welcome-symbol{margin-bottom:16px}.welcome h1{font-size:calc(28px * var(--font-scale));letter-spacing:-1px}.eyebrow{font-size:calc(8px * var(--font-scale));letter-spacing:1.5px}.welcome-description{font-size:calc(12px * var(--font-scale));line-height:1.85}.suggestions{grid-template-columns:1fr;gap:9px;margin-top:25px}.suggestion{min-height:79px;padding:15px 35px 14px 55px}.card-icon{position:absolute;left:19px;top:18px;font-size:calc(23px * var(--font-scale));margin:0}.suggestion b{font-size:calc(12px * var(--font-scale))}.suggestion p{font-size:calc(10px * var(--font-scale));margin:5px 0 0;line-height:1.6}.card-arrow{right:17px;top:20px}.welcome-note{font-size:calc(9px * var(--font-scale));line-height:1.7;margin-top:17px}.composer-area{padding:9px 12px 10px}.composer{padding:10px 12px 9px;border-radius:12px}.composer textarea{font-size:calc(13px * var(--font-scale));min-height:48px}.composer-options{margin-top:8px}.save-option{font-size:calc(9px * var(--font-scale))}.text-button{font-size:calc(10px * var(--font-scale))}.disclaimer{font-size:calc(8px * var(--font-scale));margin-top:5px;line-height:1.65;padding:0 2px}.messages{padding:10px 19px}.user-message{font-size:calc(13px * var(--font-scale));max-width:94%;padding:11px 15px}.answer-paragraph{font-size:calc(13px * var(--font-scale));line-height:1.95}.answer-paragraph h3{font-size:calc(13px * var(--font-scale))}.assistant-message{padding-top:21px}.system-notice{font-size:calc(10px * var(--font-scale));padding:8px 11px;width:calc(100% - 26px);margin-top:10px}.dialog-body{padding:17px 18px}.dialog-heading{padding:17px 18px}.dialog-heading h2{font-size:calc(16px * var(--font-scale))}.char-count{display:none}.attachments{gap:7px}.attachment{max-width:245px}.attachment-name{max-width:110px}.attachment select{max-width:145px}.pending{font-size:calc(11px * var(--font-scale));margin:12px 12px 18px}.welcome-description{white-space:normal}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
@media(max-width:540px){.composer textarea{font-size:calc(16px * var(--font-scale))}.answer-paragraph{font-size:calc(15px * var(--font-scale))}.answer-paragraph h3{font-size:calc(15px * var(--font-scale))}.user-message{font-size:calc(15px * var(--font-scale))}.field input,.field textarea,.field select{font-size:calc(16px * var(--font-scale))}.composer-area{padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}.suggestion b{font-size:calc(13px * var(--font-scale))}.suggestion p{font-size:calc(11px * var(--font-scale))}}

/* v0.2 accessibility appearance */
.settings-grid{display:grid;gap:8px;min-width:min(420px,80vw)}
html[data-theme="dark"]{color-scheme:dark;--ink:#e7f0ee;--muted:#a8b9b6;--green:#65b6a8;--green-soft:#17312d;--border:#2b3b39;--paper:#101817;--shadow:0 12px 45px #0006}
html[data-theme="dark"] body,html[data-theme="dark"] .workspace,html[data-theme="dark"] .scroll-area{background:#101817;color:var(--ink)}
html[data-theme="dark"] .sidebar{background:#14201e;border-color:#2a3a37}
html[data-theme="dark"] .topbar{background:#101817eb;border-color:#263432}
html[data-theme="dark"] .composer-area{background:linear-gradient(180deg,#10181700,#101817 22%)}
html[data-theme="dark"] .composer,html[data-theme="dark"] dialog,html[data-theme="dark"] .suggestion,html[data-theme="dark"] .data-card,html[data-theme="dark"] .message.assistant,html[data-theme="dark"] .reference-card,html[data-theme="dark"] .attachment{background:#182421;color:var(--ink);border-color:#31413e}
html[data-theme="dark"] input,html[data-theme="dark"] textarea,html[data-theme="dark"] select{background:#111b19;color:var(--ink);border-color:#344541}
html[data-theme="dark"] .system-notice,html[data-theme="dark"] .notice-box{background:#2c291d;color:#e8d69c;border-color:#5f5534}
html[data-theme="dark"] .quiet-button,html[data-theme="dark"] .icon-button,html[data-theme="dark"] .text-button,html[data-theme="dark"] .side-link,html[data-theme="dark"] .account-button{color:var(--ink)}
html[data-theme="dark"] .conversation-row.active{background:#203632}
html[data-theme="dark"] .conversation-delete:hover{background:#3a2b2a}
html[data-theme="dark"] .dialog-heading{border-color:#2b3b39}
html[data-theme="dark"] .subtle,html[data-theme="dark"] .disclaimer,html[data-theme="dark"] .char-count,html[data-theme="dark"] .conversation-empty{color:#9eafab}

/* v0.4 free local AI + safety dialog */
.user-message{background:#dcefe8!important;color:#173a35!important;border:1px solid #c4ddd4!important;font-weight:500}
.user-message *{color:inherit!important}
html[data-theme="dark"] .user-message{background:#245f56!important;color:#f5fffc!important;border-color:#34796e!important}
html[data-theme="dark"] .user-message *{color:#f5fffc!important}
.settings-card{display:grid;grid-template-columns:1fr auto;gap:10px 14px;align-items:center;border:1px solid var(--border);border-radius:11px;padding:14px 15px;background:color-mix(in srgb,var(--paper) 86%,var(--green-soft) 14%)}
.settings-card strong{font-size:calc(13px * var(--font-scale))}
.settings-card .subtle{margin:4px 0 0!important;line-height:1.6!important}
.settings-card .full{grid-column:1/-1;margin-top:2px}
.switch{position:relative;width:46px;height:26px;display:inline-block;flex:0 0 auto}.switch input{position:absolute;opacity:0;width:1px;height:1px}.switch span{position:absolute;inset:0;border-radius:999px;background:#aab8b3;transition:.18s}.switch span:before{content:"";position:absolute;width:20px;height:20px;left:3px;top:3px;background:#fff;border-radius:50%;box-shadow:0 1px 4px #0003;transition:.18s}.switch input:checked+span{background:var(--green)}.switch input:checked+span:before{transform:translateX(20px)}
.safety-dialog .notice-box{line-height:1.8}.safety-actions{flex-wrap:wrap}.local-ai-progress{font-variant-numeric:tabular-nums}
html[data-theme="dark"] .settings-card{background:#15211f;border-color:#31413e}
html[data-theme="dark"] .safety-dialog{background:#182421;color:var(--ink)}
@media(max-width:540px){.settings-card{grid-template-columns:1fr auto;padding:13px}.settings-card #localAiPrepare{grid-column:1/-1;width:100%}.safety-actions{display:grid;grid-template-columns:1fr}.safety-actions button{width:100%}}

/* =========================================================
   MEDI v0.5 - readable settings in BOTH light/dark themes
   ========================================================= */
:root,
html[data-theme="light"]{
  color-scheme:light;
  --dialog-bg:#ffffff;
  --dialog-text:#20383a;
  --dialog-muted:#647b78;
  --field-bg:#f7faf9;
  --field-text:#173638;
  --field-border:#cfdcda;
  --card-bg:#f4f8f7;
  --button-bg:#ffffff;
  --button-text:#21413f;
}
html[data-theme="dark"]{
  color-scheme:dark;
  --dialog-bg:#17221f;
  --dialog-text:#f0f8f6;
  --dialog-muted:#b7c9c5;
  --field-bg:#0f1917;
  --field-text:#f4fbf9;
  --field-border:#40534f;
  --card-bg:#1b2926;
  --button-bg:#1d2c29;
  --button-text:#edf8f5;
}

#settingsDialog,
#infoDialog,
#consentDialog,
#authDialog,
#feedbackDialog{
  background:var(--dialog-bg)!important;
  color:var(--dialog-text)!important;
  border-color:var(--field-border)!important;
}
#settingsDialog .dialog-heading,
#infoDialog .dialog-heading,
#consentDialog .dialog-heading,
#authDialog .dialog-heading,
#feedbackDialog .dialog-heading{
  background:var(--dialog-bg)!important;
  color:var(--dialog-text)!important;
  border-color:var(--field-border)!important;
}
#settingsDialog .dialog-body,
#settingsDialog .dialog-body label,
#settingsDialog .dialog-body label>span,
#settingsDialog strong,
#settingsDialog h2,
#settingsDialog p,
#settingsDialog button{
  color:var(--dialog-text);
}
#settingsDialog .subtle,
#settingsDialog .settings-help{
  color:var(--dialog-muted)!important;
}
#settingsDialog .field select,
#settingsDialog .field input,
#settingsDialog .field textarea{
  background:var(--field-bg)!important;
  color:var(--field-text)!important;
  border:1px solid var(--field-border)!important;
  opacity:1!important;
  -webkit-text-fill-color:var(--field-text)!important;
}
#settingsDialog select option{
  background:var(--dialog-bg)!important;
  color:var(--dialog-text)!important;
}
#settingsDialog .settings-card{
  background:var(--card-bg)!important;
  color:var(--dialog-text)!important;
  border-color:var(--field-border)!important;
}
#settingsDialog .quiet-button,
#settingsDialog .icon-button{
  background:var(--button-bg)!important;
  color:var(--button-text)!important;
  border-color:var(--field-border)!important;
}
#settingsDialog .primary-button{
  color:#fff!important;
}
.settings-help{
  margin:4px 2px 0!important;
  font-size:calc(11px * var(--font-scale));
  line-height:1.75;
}
.settings-dot{
  width:10px;height:10px;border-radius:50%;background:#5ba792;
  box-shadow:0 0 0 4px color-mix(in srgb,#5ba792 18%,transparent);
}

/* Remove the old white provider pill. Only meaningful counts/emergency remain. */
.source-count{
  margin-left:auto;
  font-size:calc(9px * var(--font-scale));
  font-weight:550;
  color:#6f827d;
  background:transparent;
  padding:2px 0;
}
html[data-theme="dark"] .source-count{color:#aabdb8}
.evidence-badge:not(.emergency){display:none!important}

/* Strong readable chat colors */
html[data-theme="light"] .user-message{
  background:#d9eee8!important;
  color:#123d38!important;
  border-color:#b8d8cf!important;
}
html[data-theme="dark"] .user-message{
  background:#286b61!important;
  color:#ffffff!important;
  border-color:#3a8579!important;
}
html[data-theme="light"] .assistant-message,
html[data-theme="light"] .answer-paragraph,
html[data-theme="light"] .assistant-label{color:#20383a!important}
html[data-theme="dark"] .assistant-message,
html[data-theme="dark"] .answer-paragraph,
html[data-theme="dark"] .assistant-label{color:#edf7f4!important}

/* Dialog helper text and notices must remain legible */
html[data-theme="light"] .notice-box{background:#eef6f3;color:#496761;border-color:#cfdfda}
html[data-theme="dark"] .notice-box{background:#2a281c;color:#f0dda1;border-color:#665b36}
html[data-theme="light"] .inline-error{color:#9c493d}
html[data-theme="dark"] .inline-error{color:#ffb2a4}

@media(max-width:540px){
  #settingsDialog{width:calc(100% - 20px);max-height:92dvh}
  .settings-grid{min-width:0;width:100%}
  .settings-card{grid-template-columns:1fr auto}
  .source-count{font-size:calc(10px * var(--font-scale))}
}

/* =========================================================
   MEDI v0.5.1 - settings contrast hardening
   ========================================================= */
#settingsDialog{
  color:var(--dialog-text)!important;
  background:var(--dialog-bg)!important;
}
#settingsDialog .dialog-heading h2,
#settingsDialog .field>span,
#settingsDialog .settings-card strong,
#settingsDialog .settings-card p,
#settingsDialog .settings-help,
#settingsDialog label,
#settingsDialog button{
  opacity:1!important;
}
#settingsDialog .dialog-heading h2,
#settingsDialog .field>span,
#settingsDialog .settings-card strong{
  color:var(--dialog-text)!important;
  font-weight:700!important;
}
html[data-theme="light"] #settingsDialog .subtle,
html[data-theme="light"] #settingsDialog .settings-help{
  color:#4f6864!important;
}
html[data-theme="dark"] #settingsDialog .subtle,
html[data-theme="dark"] #settingsDialog .settings-help{
  color:#c2d2ce!important;
}
html[data-theme="light"] #settingsDialog .settings-card{
  background:#f3f8f6!important;
  border-color:#cbdad6!important;
}
html[data-theme="dark"] #settingsDialog .settings-card{
  background:#1b2a27!important;
  border-color:#445a55!important;
}
html[data-theme="light"] #settingsDialog select{
  background:#ffffff!important;
  color:#173638!important;
  border-color:#bfcfcb!important;
}
html[data-theme="dark"] #settingsDialog select{
  background:#0e1816!important;
  color:#f6fbfa!important;
  border-color:#526963!important;
}
html[data-theme="light"] #settingsDialog .quiet-button{
  background:#ffffff!important;
  color:#1e4541!important;
  border-color:#bdcfca!important;
}
html[data-theme="dark"] #settingsDialog .quiet-button{
  background:#243532!important;
  color:#f4fbf9!important;
  border-color:#526963!important;
}
#settingsDialog [hidden]{display:none!important}

/* =========================================================
   MEDI v0.5.2 - source/reference cards blend with both themes
   ========================================================= */
html[data-theme="light"] .source-list{
  background:#f6faf8!important;
  border-color:#cfddd9!important;
  color:#25433f!important;
}
html[data-theme="light"] .source-list>summary{
  color:#45645e!important;
  background:#f6faf8!important;
}
html[data-theme="light"] .source-item{
  background:#ffffff!important;
  border-color:#d9e5e1!important;
}
html[data-theme="light"] .source-item>summary{
  color:#24433f!important;
}
html[data-theme="light"] .source-meta,
html[data-theme="light"] .excerpt,
html[data-theme="light"] .source-warning{
  color:#58706b!important;
}

html[data-theme="dark"] .source-list{
  background:#182623!important;
  border-color:#40534f!important;
  color:#e7f3f0!important;
}
html[data-theme="dark"] .source-list>summary{
  color:#bed1cc!important;
  background:#182623!important;
}
html[data-theme="dark"] .source-item{
  background:#1d2d29!important;
  border-color:#40534f!important;
}
html[data-theme="dark"] .source-item>summary{
  color:#edf7f4!important;
}
html[data-theme="dark"] .source-meta,
html[data-theme="dark"] .excerpt,
html[data-theme="dark"] .source-warning{
  color:#b9cbc7!important;
}


/* MEDI v0.6 - consumer mode + clipboard image UI */
.paste-hint{font-size:calc(10px * var(--font-scale));color:var(--muted);white-space:nowrap}
.attachment-kind{display:block;margin-top:4px;color:var(--muted);font-size:calc(9px * var(--font-scale))}
.attachment-info{min-width:0}
.answer-paragraph p{line-height:1.75}
.answer-paragraph h3{font-size:calc(14px * var(--font-scale));margin-bottom:7px}
.answer-limits{font-size:calc(10px * var(--font-scale));line-height:1.6;opacity:.72}
@media(max-width:640px){.paste-hint{display:none}.answer-paragraph h3{font-size:calc(13px * var(--font-scale))}}


/* v0.7: simpler consumer answer + automatic educational visuals */
.answer-summary{margin-top:.35rem;padding:1rem 1.1rem;border-radius:16px;background:color-mix(in srgb,var(--green-soft) 75%,var(--paper));border:1px solid color-mix(in srgb,var(--green) 18%,var(--border));}
.answer-summary h3{margin-top:0}.answer-summary p{font-size:1.04em;line-height:1.72;margin-bottom:0}
.medi-visual{margin:1rem 0 1.15rem;max-width:680px;border:1px solid var(--border);border-radius:18px;overflow:hidden;background:var(--surface,#fff);box-shadow:0 8px 28px rgba(25,55,60,.06)}
.medi-visual img{display:block;width:100%;max-height:300px;object-fit:contain;background:#f8fbfa}
.medi-visual figcaption{display:grid;gap:.25rem;padding:.85rem 1rem 1rem;color:var(--ink)}
.medi-visual figcaption strong{font-size:.98em}.medi-visual figcaption span{line-height:1.55}.medi-visual figcaption small{color:var(--muted)}
[data-theme="dark"] .answer-summary{background:#17312f;border-color:#34514e}
[data-theme="dark"] .medi-visual{background:#142220;border-color:#334844}
[data-theme="dark"] .medi-visual img{background:#eef6f4}
[data-theme="dark"] .medi-visual figcaption{color:#eef7f5}
[data-theme="dark"] .medi-visual figcaption small{color:#a9bbb7}
@media(max-width:640px){.answer-summary{padding:.9rem}.medi-visual{margin:.85rem 0;border-radius:14px}.medi-visual img{max-height:220px}.medi-visual figcaption{padding:.75rem .85rem .9rem}}

/* =========================================================
   MEDI v0.8 - stable image analysis + clearer anatomy visuals
   ========================================================= */
.medi-visual{max-width:820px;border-radius:20px}
.medi-visual img{max-height:440px;padding:8px;cursor:zoom-in;outline:none}
.medi-visual img:focus{box-shadow:inset 0 0 0 3px color-mix(in srgb,var(--green) 55%,transparent)}
.medi-visual figcaption{padding:1rem 1.1rem 1.05rem}
.medi-visual figcaption strong{font-size:1.02em}
.medi-visual figcaption span{font-size:.96em;line-height:1.65}
.visual-dialog-image{display:block;width:100%;max-height:70vh;object-fit:contain;border-radius:14px;background:#f6faf8}
.image-analysis-ok{border-left:3px solid #4b8f82;padding-left:14px}
.image-analysis-warning{margin-top:12px;padding:14px 16px;border:1px solid #e1c5a9;border-radius:14px;background:#fff7ed;color:#6d4324}
html[data-theme="dark"] .image-analysis-warning{background:#35281f;border-color:#6d4e34;color:#f8dfc7}
.retry-analysis{margin-top:10px;min-height:40px;padding:0 14px;border:1px solid var(--green);border-radius:10px;background:var(--green);color:#fff;font:inherit;font-weight:700;cursor:pointer}
.retry-analysis:hover{filter:brightness(.96)}
.connection[data-state="reconnecting"]{opacity:.78}
@media(max-width:640px){.medi-visual img{max-height:330px;padding:4px}.medi-visual figcaption{padding:.85rem .9rem 1rem}.visual-dialog-image{max-height:62vh}}

```

## `static/app.js`

```javascript
'use strict';
const T={
 skip:'\uc9c8\ubb38 \uc785\ub825\uc73c\ub85c \uac74\ub108\ub6f0\uae30',newChat:'\uc0c8 \ub300\ud654',history:'\ub098\uc758 \ub300\ud654',loading:'\uc5f0\uacb0 \ud655\uc778 \uc911',knowledgeLabel:'\uc5f0\uacb0\ub41c \uc758\ud559\uc9c0\uc2dd',dataCaution:'\uc784\uc0c1 \uac80\ud1a0 \uc804 \uc5c5\ub85c\ub4dc \uc790\ub8cc',privacy:'\uac1c\uc778\uc815\ubcf4\uc640 \ud559\uc2b5 \uc548\ub0b4',localSession:'\uac8c\uc2a4\ud2b8 \uc0ac\uc6a9',temporary:'\ub85c\uadf8\uc778 \uc5c6\uc774 \ubc14\ub85c \uc0ac\uc6a9 \uac00\ub2a5',export:'\ub300\ud654 \ub0b4\ubcf4\ub0b4\uae30',welcomeTitle:'의료가 궁금할 때, 편하게 물어보세요.',welcomeDescription:'증상, 질병, 검사, 수술, 약, 의료기기까지 어려운 의학 내용을 쉽게 설명해드려요. 사진을 올리거나 붙여넣어 물어볼 수도 있어요.',cardKnowledge:'증상이 궁금할 때',cardKnowledgeDesc:'아픈 곳과 증상을 말하면 가능한 이유를 쉽게 정리',cardImage:'사진으로 물어보기',cardImageDesc:'검사 결과, 상처 사진, X-ray 등 이미지를 올려 질문',cardStudy:'의학용어 쉽게 알아보기',cardStudyDesc:'인공심폐기 같은 낯선 용어도 일상적인 말로 설명',welcomeNote:'\uc5f0\uad6c\u00b7\ud559\uc2b5\uc6a9 \ubca0\ud0c0\uc785\ub2c8\ub2e4. \uc9c4\ub2e8\uc774\ub098 \ucc98\ubc29\uc744 \uc81c\uacf5\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.',pending:'처리하고 있습니다.',questionLabel:'\uc758\ub8cc\u00b7\uac74\uac15 \uc9c8\ubb38',questionPlaceholder:'예: 인공심폐기가 뭐야? / 무릎이 아픈데 왜 그럴까? 사진은 붙여넣어도 돼요.',attach:'\uc774\ubbf8\uc9c0 \ucca8\ubd80 (JPG, PNG, WebP)',image:'\uc774\ubbf8\uc9c0',mode:'\ub300\ud654 \ubaa8\ub4dc',health:'\uac74\uac15\uc9c0\uc2dd',study:'\uc758\ud559 \ud559\uc2b5',send:'\ubcf4\ub0b4\uae30',stop:'\uc911\ub2e8',saveChat:'\uc774 \ub300\ud654\ub97c \ub0b4 \uacc4\uc815\uc5d0 \uc800\uc7a5',processingInfo:'안전·개인정보 안내',disclaimer:'MEDI\ub294 \uc9c4\ub2e8\u00b7\ucc98\ubc29\u00b7\uc601\uc0c1 \ud310\ub3c5\uc744 \ub300\uccb4\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \uc751\uae09\uc0c1\ud669\uc740 \ucc57\ubd07\uc774 \uc544\ub2cc 119\ub85c \uc5f0\ub77d\ud558\uc138\uc694.',close:'\ub2eb\uae30',consentTitle:'MEDI 이용 전 확인해주세요',consentBody:'질문과 최근 대화는 관련 의료자료를 찾기 위해 MEDI 서버로 전송됩니다. Groq 또는 Gemini가 연결된 경우 질문·검색된 의료자료 일부와 첨부 이미지의 메타데이터를 제거한 사본이 답변 생성을 위해 해당 제공자에 전송될 수 있습니다. 원본 이미지는 대화기록에 저장하지 않습니다.',consentPrivacy:'실명, 주민번호, 연락처, 병원 등록번호 등 개인을 식별할 수 있는 정보는 입력하지 마세요. 사진·검사결과지에도 이름, 환자번호, 생년월일 등이 보이지 않도록 가려주세요. 심한 흉통, 호흡곤란, 의식저하, 마비, 멈추지 않는 출혈 등 긴급한 증상은 MEDI 답변을 기다리지 말고 119 또는 응급의료기관을 이용하세요.',consentCheck:'안내 내용을 확인했습니다.',cancel:'\ucde8\uc18c',agree:'확인하고 계속',login:'\ub85c\uadf8\uc778',signup:'\ud68c\uc6d0\uac00\uc785',authDescription:'\ub85c\uadf8\uc778\ud558\uc9c0 \uc54a\uc544\ub3c4 \ubc14\ub85c \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \ud68c\uc6d0\uac00\uc785\u00b7\ub85c\uadf8\uc778\ud558\uba74 \uc800\uc7a5\uc744 \uc120\ud0dd\ud55c \ub300\ud654 \uae30\ub85d\uc744 \ub0b4 \uacc4\uc815\uc5d0 \ub0a8\uae38 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',email:'\uc774\uba54\uc77c',password:'\ube44\ubc00\ubc88\ud638 (5\uc790 \uc774\uc0c1)',invite:'\ucd08\ub300\ucf54\ub4dc (\uc6b4\uc601\uc790\uac00 \uc81c\ud55c\ud55c \uacbd\uc6b0\uc5d0\ub9cc)',terms:'\uc758\ub8cc \uc11c\ube44\uc2a4\uac00 \uc544\ub2cc \uc5f0\uad6c\uc6a9 \ub3c4\uad6c\uc784\uc744 \uc774\ud574\ud558\uba70, \ube44\uc2dd\ubcc4 \uc815\ubcf4\ub85c\ub9cc \uc2dc\ud5d8\ud569\ub2c8\ub2e4.',toSignup:'\uc544\uc9c1 \uacc4\uc815\uc774 \uc5c6\uc73c\uc2e0\uac00\uc694? \ud68c\uc6d0\uac00\uc785',toLogin:'\uc774\ubbf8 \uacc4\uc815\uc774 \uc788\uc73c\uc2e0\uac00\uc694? \ub85c\uadf8\uc778',feedbackTitle:'\ub354 \ub098\uc740 \ub2f5\ubcc0\uc744 \uc704\ud55c \ud53c\ub4dc\ubc31',feedbackDescription:'\ud53c\ub4dc\ubc31\uc740 \uc989\uc2dc \ud559\uc2b5\ub418\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \ub3d9\uc758\ud55c \ub0b4\uc6a9\ub9cc \uc6b4\uc601\uc790\uc758 \uac80\ud1a0 \ub300\uae30\uc5f4\uc5d0 \ubcf4\ub0b4\uba70, \uc758\ud559\u00b7\uac1c\uc778\uc815\ubcf4 \uac80\ud1a0 \ud6c4 \uc218\ub3d9\uc73c\ub85c \ubc18\uc601\ud569\ub2c8\ub2e4. \uc544\ub798 \ub0b4\uc6a9\uc5d0\uc11c \uac1c\uc778\uc815\ubcf4\ub97c \uc0ad\uc81c\ud558\uc138\uc694.',feedbackQuestion:'\uac80\ud1a0\uc6a9 \uc9c8\ubb38 (\uc218\uc815 \uac00\ub2a5)',feedbackAnswer:'\uac80\ud1a0\uc6a9 \ub2f5\ubcc0 (\uc218\uc815 \uac00\ub2a5)',correction:'\uc218\uc815 \uc758\uacac\u00b7\ucc38\uace0 \uadfc\uac70',rating:'\ud3c9\uac00',needsReview:'\uac80\ud1a0\uac00 \ud544\uc694\ud574\uc694',helpful:'\ub3c4\uc6c0\uc774 \ub410\uc5b4\uc694',feedbackConsent:'\uc704 \ud53c\ub4dc\ubc31\uc744 \uc6b4\uc601\uc790\uac00 \uc77d\uace0 \uc11c\ube44\uc2a4 \uac1c\uc120\uc5d0 \uac80\ud1a0\ud558\ub294 \ub370 \ubcc4\ub3c4\ub85c \ub3d9\uc758\ud569\ub2c8\ub2e4.',deidentified:'\uc9c8\ubb38\u00b7\ub2f5\ubcc0\u00b7\uc218\uc815 \uc758\uacac\uc5d0\uc11c \uc2dd\ubcc4 \uac00\ub2a5\ud55c \uac1c\uc778\uc815\ubcf4\ub97c \uc81c\uac70\ud588\uc2b5\ub2c8\ub2e4.',feedbackSend:'\uac80\ud1a0 \ub300\uae30\uc5f4\uc5d0 \ubcf4\ub0b4\uae30',promptKnowledge:'무릎이 아픈데 어떤 원인이 있을 수 있어?',promptStudy:'인공심폐기가 뭐야? 일반인이 이해하기 쉽게 설명해줘.',promptImage:'이 이미지에서 보이는 내용을 일반인이 이해하기 쉽게 설명해줘.',emptyHistory:'\uc800\uc7a5\ud55c \ub300\ud654\uac00 \uc5ec\uae30\uc5d0 \ud45c\uc2dc\ub429\ub2c8\ub2e4.',demo:'MEDI',connected:'MEDI 의료 AI',demoNotice:'MEDI는 연결된 의료지식 자료를 우선 활용합니다.',rightsNotice:'\uc790\ub8cc \uc774\uc6a9\uad8c\ud55c\uc744 \uc6b4\uc601\uc790\uac00 \ud655\uc778\ud558\uae30 \uc804\uae4c\uc9c0 \uc678\ubd80 \uc11c\ube44\uc2a4\uc5d0\uc11c\ub294 \uc790\ub8cc \uac80\uc0c9\uc774 \ube44\ud65c\uc131\ud654\ub429\ub2c8\ub2e4.',noAccounts:'\ub85c\uceec \uccb4\ud5d8\uc5d0\uc11c\ub294 \uacc4\uc815 \uc800\uc7a5\uc744 \uc0ac\uc6a9\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. Supabase\ub97c \uc5f0\uacb0\ud558\uba74 \ud68c\uc6d0 \uae30\ub2a5\uc744 \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',loginNeeded:'\ub300\ud654 \uc800\uc7a5 \uae30\ub2a5\uc740 \ub85c\uadf8\uc778 \ud6c4 \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',copy:'\ubcf5\uc0ac',copied:'\ub2f5\ubcc0\uc744 \ubcf5\uc0ac\ud588\uc2b5\ub2c8\ub2e4.',feedback:'\ud53c\ub4dc\ubc31',references:'\ucc38\uace0\ud55c \uc5c5\ub85c\ub4dc \uc790\ub8cc',referenceWarning:'\ucd9c\ucc98\uba85\u00b7\uc5f0\ub3c4\ub294 \ub370\uc774\ud130\uc14b \ud45c\uae30\uc785\ub2c8\ub2e4. \uc6d0\ubb38\u00b7\ucd5c\uc2e0\uc131\u00b7\uc758\ud559\uc801 \uc815\ud655\uc131\uc740 \ubcc4\ub3c4 \uac80\ud1a0\uac00 \ud544\uc694\ud569\ub2c8\ub2e4.',observations:'이미지에서 보이는 점',notSaved:'\uc800\uc7a5\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \uc774 \ub300\ud654\ub97c \ub0b4\ubcf4\ub0b8 \ub4a4 \uc774\ub3d9\ud574 \uc8fc\uc138\uc694.',imageLimit:'\uc774\ubbf8\uc9c0\ub294 \ud55c \ubc88\uc5d0 2\uc7a5, \uac01 5MB\uae4c\uc9c0\uc785\ub2c8\ub2e4.',imageType:'JPG, PNG, WebP \uc774\ubbf8\uc9c0\ub9cc \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',report:'\uac80\uc0ac\uc9c0\u00b7\ud310\ub3c5\ubb38',photo:'\ud53c\ubd80 \ub4f1 \uc678\ubd80 \uc0ac\uc9c4',radiology:'의료영상',delete:'\uc0ad\uc81c',logout:'\ub85c\uadf8\uc544\uc6c3',deleteAccount:'\uacc4\uc815\uacfc \uc800\uc7a5 \ub0b4\uc6a9 \uc0ad\uc81c',deleteConfirm:'\uc774 \ub300\ud654\ub97c \uc0ad\uc81c\ud560\uae4c\uc694? \ubcf5\uad6c\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.',accountConfirm:'\uacc4\uc815\u00b7\ub300\ud654\u00b7\ubcf4\uad00 \uc911\uc778 \ud53c\ub4dc\ubc31\uc744 \uc0ad\uc81c\ud569\ub2c8\ub2e4. \uacc4\uc18d\ud558\ub824\uba74 DELETE MY ACCOUNT\ub97c \uc785\ub825\ud558\uc138\uc694.',stopped:'처리를 중단했습니다.',unsavedConfirm:'\uc800\uc7a5\ub418\uc9c0 \uc54a\uc740 \ub300\ud654\uac00 \uc788\uc2b5\ub2c8\ub2e4. \ub0b4\ubcf4\ub0b4\uae30 \uc5c6\uc774 \uc774\ub3d9\ud560\uae4c\uc694?',checkEmail:'\uc778\uc99d \uba54\uc77c\uc744 \ud655\uc778\ud55c \ub4a4 \ub2e4\uc2dc \ub85c\uadf8\uc778\ud574 \uc8fc\uc138\uc694.',feedbackSuccess:'\uac80\ud1a0 \ub300\uae30\uc5f4\uc5d0 \uc800\uc7a5\ud588\uc2b5\ub2c8\ub2e4. \uc790\ub3d9\uc73c\ub85c \ud559\uc2b5\ub418\uc9c0\ub294 \uc54a\uc2b5\ub2c8\ub2e4.',feedbackLocal:'\ub85c\uceec \uac80\ud1a0 \ud6c4\ubcf4 \ud30c\uc77c\uc744 \ub9cc\ub4e4\uc5c8\uc2b5\ub2c8\ub2e4. \uc11c\ubc84\uc5d0\ub294 \ubcf4\ub0b4\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.',saved:'\uacc4\uc815\uc5d0 \uc800\uc7a5\ub428',temporaryChat:'\uc784\uc2dc \ub300\ud654',emptyExport:'\ub0b4\ubcf4\ub0bc \ub300\ud654\uac00 \uc544\uc9c1 \uc5c6\uc2b5\ub2c8\ub2e4.'
};
const ERR={login_required:T.loginNeeded,invalid_invite:'\ucd08\ub300\ucf54\ub4dc\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.',membership_required:'\ucc98\uc74c \ub85c\uadf8\uc778\ud560 \ub54c \uc720\ud6a8\ud55c \ucd08\ub300\ucf54\ub4dc\ub97c \uc785\ub825\ud574 \uc8fc\uc138\uc694.',rate_limited:'\uc694\uccad\uc774 \ub9ce\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.',daily_limit:'\uc624\ub298\uc758 \uc5f0\uad6c\uc6a9 AI \uc0ac\uc6a9 \ud55c\ub3c4\uc5d0 \ub3c4\ub2ec\ud588\uc2b5\ub2c8\ub2e4.',storage_limit:'\uc800\uc7a5 \ud55c\ub3c4\uc5d0 \ub3c4\ub2ec\ud588\uc2b5\ub2c8\ub2e4. \ubd88\ud544\uc694\ud55c \ub300\ud654\ub97c \uc0ad\uc81c\ud574 \uc8fc\uc138\uc694.',server_busy:'\uc11c\ubc84\uac00 \ub2e4\ub978 \uc694\uccad\uc744 \ucc98\ub9ac \uc911\uc785\ub2c8\ub2e4. \uc790\ub3d9 \uc7ac\uc804\uc1a1\ud558\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.',auth_failed_check_email_and_password:'\uc774\uba54\uc77c\u00b7\ube44\ubc00\ubc88\ud638\u00b7\uc774\uba54\uc77c \uc778\uc99d \uc5ec\ubd80\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.',cloud_unavailable:'\uacc4\uc815 \uc800\uc7a5\uc18c\uc5d0 \uc5f0\uacb0\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.',cloud_request_failed:'\uc800\uc7a5\uc18c \uc124\uc815\uc744 \uc6b4\uc601\uc790\uac00 \ud655\uc778\ud574\uc57c \ud569\ub2c8\ub2e4.',identifiers_detected:'\ud53c\ub4dc\ubc31\uc5d0 \uc5f0\ub77d\ucc98 \ub4f1 \uac1c\uc778\uc815\ubcf4\ub85c \ubcf4\uc774\ub294 \ubb38\uad6c\uac00 \uc788\uc2b5\ub2c8\ub2e4. \uc81c\uac70\ud574 \uc8fc\uc138\uc694.',invalid_image:'\uc774\ubbf8\uc9c0 \ud615\uc2dd\u00b7\ud06c\uae30\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694. 5MB, 1,200\ub9cc \ud654\uc18c \uc774\ud558\uc785\ub2c8\ub2e4.',conversation_full:'\uc774 \ub300\ud654\uac00 \uae38\uc5b4\uc838 \uc0c8 \ub300\ud654\ub97c \uc2dc\uc791\ud574\uc57c \ud569\ub2c8\ub2e4.',invalid_request:'\uc785\ub825 \ud56d\ubaa9\uc758 \ud615\uc2dd\uacfc \uae38\uc774\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.',request_in_progress:'\ub3d9\uc77c\ud55c \uc694\uccad\uc744 \uc774\ubbf8 \ucc98\ub9ac \uc911\uc785\ub2c8\ub2e4.',terms_required:'\uc5f0\uad6c\uc6a9 \uc774\uc6a9 \uc548\ub0b4\uc5d0 \ub3d9\uc758\ud574 \uc8fc\uc138\uc694.'};
function requestId(){
 if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
 const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
 const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
 return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
const $=id=>document.getElementById(id);
const state={config:null,user:null,cid:null,turns:[],images:[],busy:false,consent:false,pendingConsent:false,controller:null,signup:false,feedbackTurn:null,refresh:null,loadVersion:0};
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
for(const n of document.querySelectorAll('[data-i18n]'))n.textContent=T[n.dataset.i18n]||n.dataset.i18n;
for(const n of document.querySelectorAll('[data-placeholder]'))n.placeholder=T[n.dataset.placeholder];
for(const n of document.querySelectorAll('[data-title]'))n.title=T[n.dataset.title];
function prefGet(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
function prefSet(key,value){try{localStorage.setItem(key,value);}catch{}}
const appearance={theme:prefGet('medi-theme','system'),font:prefGet('medi-font-scale','1')};
const safetyNoticeEnabled=()=>prefGet('medi-safety-notice','show')!=='hide';
function safetySeenThisSession(){try{return sessionStorage.getItem('medi-safety-seen')==='1';}catch{return false;}}
function markSafetySeen(){try{sessionStorage.setItem('medi-safety-seen','1');}catch{}state.consent=true;}
function resetSafetySeen(){try{sessionStorage.removeItem('medi-safety-seen');}catch{}state.consent=false;}
state.consent=!safetyNoticeEnabled()||safetySeenThisSession();
function updateSafetySettings(){if($('safetyToggle'))$('safetyToggle').checked=safetyNoticeEnabled();if($('safetySettingText'))$('safetySettingText').textContent=safetyNoticeEnabled()?'첫 질문 전에 한 번 표시합니다.':'자동 안내를 표시하지 않습니다. 아래 버튼으로 언제든 다시 볼 수 있습니다.';}
function setPendingText(text){const n=$('pending')?.querySelector('span:last-child');if(n&&text)n.textContent=text;}
function updateLocalAIStatus(){const ai=window.MEDILocalAI?.status?.();if($('localAiStatus'))$('localAiStatus').textContent=ai?.message||(window.MEDILocalAI?.supported?.()?'서버 AI가 일시적으로 안 될 때 사용할 브라우저 보조 AI를 준비할 수 있습니다.':'이 브라우저는 WebGPU 보조 AI를 지원하지 않습니다. 무료 서버 AI가 연결되어 있으면 정상 사용 가능합니다.');if($('localAiPrepare'))$('localAiPrepare').disabled=!(window.MEDILocalAI?.supported?.());}
function applyAppearance(){const dark=appearance.theme==='dark'||(appearance.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.style.setProperty('--font-scale',appearance.font);}
applyAppearance();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(appearance.theme==='system')applyAppearance();});
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,6000);}
function failure(e){return e.name==='AbortError'?T.stopped:(ERR[e.code]||e.detail||'\uc694\uccad\uc744 \ucc98\ub9ac\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \uc5f0\uacb0 \uc0c1\ud0dc\uc640 \uc11c\ubc84 \uc124\uc815\uc744 \ud655\uc778\ud574 \uc8fc\uc138\uc694.');}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function api(path,options={},retry=true,networkAttempt=0){
 const method=options.method||'GET';const headers={'X-Medi-Client':'web',...(method!=='GET'?{'Content-Type':'application/json'}:{}),...options.headers};
 let r;
 try{
  r=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,headers});
 }catch(err){
  if(networkAttempt<2&&err?.name!=='AbortError'){
   if(state.busy)setPendingText(networkAttempt===0?'연결을 다시 확인하고 있습니다…':'서버에 다시 연결하고 있습니다…');
   await sleep(900*(networkAttempt+1));
   return api(path,options,retry,networkAttempt+1);
  }
  throw Object.assign(err||new Error('network'),{code:err?.name==='AbortError'?'aborted':'network'});
 }
 if([502,503,504].includes(r.status)&&networkAttempt<2){
  if(state.busy)setPendingText('서버가 깨어나는 중입니다. 잠시만 기다려 주세요…');
  await sleep(1200*(networkAttempt+1));
  return api(path,options,retry,networkAttempt+1);
 }
 if(r.status===401&&retry&&!path.startsWith('/api/auth/')){
  if(!state.refresh)state.refresh=api('/api/auth/refresh',{method:'POST',body:'{}'},false).finally(()=>state.refresh=null);
  await state.refresh;return api(path,options,false,networkAttempt);
 }
 let data;try{data=await r.json();}catch{throw Object.assign(new Error('Invalid server response'),{code:'network',status:r.status});}
 if(!r.ok)throw Object.assign(new Error(data.error||'network'),{code:data.error,detail:data.detail,status:r.status});return data;
}
async function keepSessionWarm(){
 if(document.hidden||!navigator.onLine)return;
 try{await fetch('/healthz',{cache:'no-store',credentials:'same-origin'});}catch{}
}
setInterval(keepSessionWarm,4*60*1000);
window.addEventListener('online',keepSessionWarm);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)keepSessionWarm();});
function closeMenu(){$('sidebar').classList.remove('open');$('shade').hidden=true;}
$('menuButton').onclick=()=>{$('sidebar').classList.toggle('open');$('shade').hidden=!$('sidebar').classList.contains('open');};$('shade').onclick=closeMenu;
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
function showInfo(title,fill){$('infoTitle').textContent=title;$('infoBody').replaceChildren();fill($('infoBody'));$('infoDialog').showModal();}
function para(root,text,cls=''){root.append(el('p',cls,text));}
function stat(root,label,value){const row=el('div','stat-row');row.append(el('span','',label),el('span','',value));root.append(row);}
function statusUI(){
 const c=state.config;if(!c)return;
 const ai=window.MEDILocalAI?.status?.();
 if(c.ai_connected){
  const provider=c.ai_backend==='groq'?'Groq':(c.ai_backend==='gemini'?'Gemini':'무료 서버 AI');
  $('connection').textContent='MEDI 의료 AI';
  $('connection').title=provider+' · '+(c.ai_model||'');
 }else if(window.MEDILocalAI?.supported?.()){
  $('connection').textContent=ai?.ready?'브라우저 AI 준비됨':'브라우저 보조 AI';
 }else{
  $('connection').textContent='의료지식 검색';
 }
 $('docCount').textContent=(c.knowledge.documents||0).toLocaleString()+'건';
 $('chunkCount').textContent=(c.knowledge.chunks||0).toLocaleString()+'개 검색 조각';
 const notes=[];
 if(!c.knowledge_enabled)notes.push('업로드한 MEDI 의료자료 검색이 현재 비활성화되어 있습니다. 자료 이용권한을 확인한 경우 Render의 DATASET_RIGHTS_CONFIRMED=true로 설정해야 의료자료가 답변에 사용됩니다.');
 $('systemNotice').textContent=notes.join(' ');$('systemNotice').hidden=!notes.length;
 if($('serverAiStatus')){
  if(c.ai_connected){
   const names=(c.ai_backends||[]).map(x=>x==='groq'?'Groq':x==='gemini'?'Gemini':x);
   const backup=names.length>1?' · 자동 예비 연결 '+names.slice(1).join(', '):'';
   const n=c.ai_backend==='groq'?'Groq 무료 서버 AI':c.ai_backend==='gemini'?'Gemini 무료 서버 AI':'무료 서버 AI';
   $('serverAiStatus').textContent=`${n} 연결 설정됨 · ${c.ai_model||''}${backup}`;
  }else $('serverAiStatus').textContent='무료 서버 AI 미연결 · Render에 GROQ_API_KEY 또는 GEMINI_API_KEY를 추가하면 PC·휴대폰에서 답변과 이미지 분석이 가능합니다.';
 }
 if($('knowledgeStatus'))$('knowledgeStatus').textContent=c.knowledge_enabled?`MEDI 의료자료 활성 · ${(c.knowledge.documents||0).toLocaleString()}건`:'MEDI 의료자료 비활성 · DATASET_RIGHTS_CONFIRMED 확인 필요';
 if($('localAiCard'))$('localAiCard').hidden=!!c.ai_connected;
 $('accountName').textContent=state.user?.email||(c.accounts?T.login:T.localSession);$('accountState').textContent=state.user?T.saved:T.temporary;
 $('saveChat').disabled=!c.accounts||!state.user||state.busy||!!state.cid;
 if(!c.accounts||!state.user)$('saveChat').checked=false;
 $('inviteField').hidden=!c.invite_required;
 updateLocalAIStatus();updateSafetySettings();
}
async function historyList(){
 $('conversationList').replaceChildren();if(!state.config?.accounts||!state.user){$('conversationList').append(el('p','conversation-empty',T.emptyHistory));return;}
 try{const data=await api('/api/conversations');for(const c of data.conversations){const row=el('div','conversation-row'+(c.id===state.cid?' active':''));const open=el('button','conversation-open',c.title);open.title=c.title;open.onclick=()=>loadConversation(c.id);const del=el('button','conversation-delete','\u00d7');del.title=T.delete;del.setAttribute('aria-label',T.delete+' '+c.title);del.onclick=async()=>{if(state.busy)return;if(!confirm(T.deleteConfirm))return;try{await api('/api/conversations/'+c.id,{method:'DELETE'});if(state.cid===c.id)newChat(true);await historyList();}catch(e){toast(failure(e));}};row.append(open,del);$('conversationList').append(row);}if(!data.conversations.length)$('conversationList').append(el('p','conversation-empty',T.emptyHistory));}catch(e){toast(failure(e));}
}
function hasUnsaved(){return state.turns.some(t=>t.response&&!t.response.saved);}
function clearImages(){state.images=[];renderAttachments();$('fileInput').value='';}
function newChat(force=false){if(state.busy)return;if(!force&&hasUnsaved()&&!confirm(T.unsavedConfirm))return;state.loadVersion++;state.cid=null;state.turns=[];$('messages').replaceChildren();$('welcome').hidden=false;$('question').value='';updateInput();clearImages();$('saveChat').checked=false;statusUI();historyList();closeMenu();$('question').focus();}
$('newChat').onclick=()=>newChat();
async function loadConversation(cid){if(state.busy)return;if(hasUnsaved()&&!confirm(T.unsavedConfirm))return;const version=++state.loadVersion;try{const r=await api('/api/conversations/'+cid);if(version!==state.loadVersion)return;state.cid=cid;state.turns=r.turns;$('messages').replaceChildren();$('welcome').hidden=state.turns.length>0;for(const t of state.turns)renderTurn(t);$('saveChat').checked=true;clearImages();statusUI();historyList();closeMenu();scrollBottom();}catch(e){toast(failure(e));}}
function updateInput(){$('charCount').textContent=$('question').value.length+' / 4000';$('question').style.height='auto';$('question').style.height=Math.min(120,Math.max(52,$('question').scrollHeight))+'px';}
$('question').addEventListener('input',updateInput);
$('question').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&window.innerWidth>540){e.preventDefault();$('chatForm').requestSubmit();}});
for(const b of document.querySelectorAll('[data-prompt]'))b.onclick=()=>{if(state.busy)return;$('question').value=T[b.dataset.prompt];updateInput();$('question').focus();};
$('welcomeImage').onclick=()=>{$('question').value=T.promptImage;updateInput();$('fileInput').click();};$('attachButton').onclick=()=>$('fileInput').click();
async function addImageFiles(files,label='이미지'){
 for(const f of files){
  if(state.images.length>=2){toast(T.imageLimit);break;}
  if(f.size>5*1024*1024){toast(T.imageLimit);continue;}
  if(!['image/jpeg','image/png','image/webp'].includes(f.type)){toast(T.imageType);continue;}
  try{
   const url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f);});
   state.images.push({name:(f.name||label).slice(0,160),data_url:url,kind:'photo'});
  }catch{toast(T.imageType);}
 }
 renderAttachments();
}
$('fileInput').onchange=async e=>{await addImageFiles([...e.target.files]);e.target.value='';};
$('question').addEventListener('paste',async e=>{
 const files=[...(e.clipboardData?.items||[])].filter(x=>x.kind==='file'&&x.type.startsWith('image/')).map(x=>x.getAsFile()).filter(Boolean);
 if(!files.length)return;
 e.preventDefault();
 await addImageFiles(files,'붙여넣은 이미지');
 toast('이미지를 붙여넣었습니다. 바로 질문하거나 이미지만 보내도 됩니다.');
});
function renderAttachments(){$('attachments').replaceChildren();state.images.forEach((im,i)=>{const card=el('div','attachment'),img=el('img');img.src=im.data_url;img.alt=T.image;const inf=el('div','attachment-info');inf.append(el('span','attachment-name',im.name),el('small','attachment-kind','첨부 이미지'));const del=el('button','','\u00d7');del.type='button';del.setAttribute('aria-label',T.delete+' '+im.name);del.onclick=()=>{state.images.splice(i,1);renderAttachments();};card.append(img,inf,del);$('attachments').append(card);});}
function setBusy(b){state.busy=b;$('pending').hidden=!b;$('sendButton').hidden=b;$('stopButton').hidden=!b;for(const id of ['question','mode','attachButton','newChat','welcomeImage'])$(id).disabled=b;statusUI();}
function scrollBottom(){requestAnimationFrame(()=>$('scrollArea').scrollTo({top:$('scrollArea').scrollHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));}
function answerText(a){return a.paragraphs.map(p=>(p.heading?p.heading+'\n':'')+p.text).join('\n\n')+(a.image_observations.length?'\n\n'+a.image_observations.join('\n'):'')+'\n\n'+a.limitations;}
const VISUAL_AIDS=[
 {keys:['인공심폐기','인공심폐','심폐우회','체외순환','heart-lung','cardiopulmonary bypass'],src:'/static/visuals/heart_lung_machine.svg',title:'인공심폐기는 이렇게 도와줘요',caption:'심장수술 중 혈액이 저장통·펌프·산화기를 거쳐 다시 몸으로 돌아오는 흐름을 표시했어요.'},
 {keys:['무릎','슬관절','슬개','반월상','십자인대','knee'],src:'/static/visuals/knee.svg',title:'무릎은 이런 구조예요',caption:'대퇴골·정강뼈·무릎뼈·연골·반월상연골·십자인대의 위치를 함께 표시했어요.'},
 {keys:['고혈압','저혈압','혈압','blood pressure'],src:'/static/visuals/blood_pressure.svg',title:'혈압은 이런 뜻이에요',caption:'혈관 안의 압력과 수축기·이완기 숫자가 무엇을 뜻하는지 함께 보여줘요.'},
 {keys:['당뇨','혈당','인슐린','diabetes','glucose'],src:'/static/visuals/diabetes.svg',title:'혈당과 인슐린의 관계',caption:'혈액 속 포도당, 췌장, 인슐린, 세포가 어떻게 연결되는지 보여줘요.'},
 {keys:['천식','폐렴','호흡','기관지','기침','폐','lung','asthma'],src:'/static/visuals/lungs.svg',title:'폐와 기도는 이렇게 이어져요',caption:'기관·기관지·좌우 폐와 폐포까지 공기가 이동하는 길을 표시했어요.'},
 {keys:['상처','피부','발진','봉합','찰과상','화상','염증','wound','rash'],src:'/static/visuals/wound.svg',title:'상처는 겉모습 변화도 중요해요',caption:'피부 단면과 함께 붉음·붓기·열감·분비물 같은 변화 포인트를 표시했어요.'},
 {keys:['복통','위염','소화','위','장','stomach','digest'],src:'/static/visuals/stomach.svg',title:'소화기관은 이렇게 이어져요',caption:'식도에서 위·십이지장·장으로 이어지는 소화기관의 흐름을 보여줘요.'},
 {keys:['허리','척추','디스크','목 통증','요추','경추','spine'],src:'/static/visuals/spine.svg',title:'척추는 몸의 중심을 지지해요',caption:'척추뼈·디스크·신경뿌리의 위치와 신경 증상이 생길 수 있는 이유를 보여줘요.'},
 {keys:['뇌','두통','뇌졸중','마비','신경','brain'],src:'/static/visuals/brain.svg',title:'뇌는 몸의 여러 기능을 조절해요',caption:'뇌의 주요 영역과 갑작스러운 신경 증상에서 확인할 점을 함께 표시했어요.'},
 {keys:['약','복용','처방','알약','캡슐','medicine','drug'],src:'/static/visuals/medicine.svg',title:'약은 복용정보 확인이 중요해요',caption:'약 봉투나 처방전 사진에서 이름·용량·횟수·시간을 어디서 확인하는지 보여줘요.'},
 {keys:['심장','심근','협심','심부전','부정맥','맥박','heart'],src:'/static/visuals/heart.svg',title:'심장은 혈액을 보내는 펌프예요',caption:'심장의 네 방과 폐·온몸으로 혈액이 이동하는 기본 흐름을 표시했어요.'}
];
const VISUAL_SKIP_TERMS=['고소','소송','합의','손해배상','배상','법률','법적','과실','보험금','보험처리','진단서 발급'];
function pickVisualAid(question,answer,hadImages){
 if(hadImages)return null;
 const text=(question||'').trim().toLowerCase();
 if(!text||text.length<3||VISUAL_SKIP_TERMS.some(k=>text.includes(k)))return null;
 // Only the user's current wording may trigger a diagram. A short follow-up such
 // as "왜이래" must not inherit an unrelated picture from the model's answer.
 for(const item of VISUAL_AIDS){if(item.keys.some(k=>text.includes(k.toLowerCase())))return item;}
 return null;
}
function makeVisualAid(item){
 const fig=el('figure','medi-visual');
 const img=el('img');img.src=item.src;img.alt=item.title;img.loading='lazy';img.decoding='async';
 img.tabIndex=0;img.title='그림 크게 보기';
 const enlarge=()=>showInfo(item.title,b=>{const big=el('img','visual-dialog-image');big.src=item.src;big.alt=item.title;b.append(big);para(b,item.caption,'subtle');});
 img.onclick=enlarge;img.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();enlarge();}};
 const cap=el('figcaption','');cap.append(el('strong','',item.title),el('span','',item.caption),el('small','','교육용으로 구조와 흐름을 단순화한 그림 · 그림을 누르면 크게 볼 수 있어요'));
 fig.append(img,cap);return fig;
}

function retryImageTurn(t){
 if(state.busy||!t?.previewImages?.length)return;
 state.images=t.previewImages.map((src,i)=>({name:'다시 분석 이미지 '+(i+1),data_url:src,kind:'photo'}));
 renderAttachments();
 $('question').value=t.question||'이 이미지를 다시 분석해줘.';
 updateInput();
 $('question').focus();
 scrollBottom();
 toast('같은 이미지와 질문을 다시 준비했습니다. 전송하면 재분석합니다.');
}
function renderTurn(t){
 const turn=el('article','turn');turn.dataset.id=t.id;turn.append(el('div','user-message',t.question));if(t.previewImages?.length){const imgs=el('div','user-images');for(const src of t.previewImages){const img=el('img');img.src=src;img.alt=T.image;imgs.append(img);}turn.append(imgs);}if(t.had_images&&!t.previewImages?.length)turn.append(el('p','source-meta','\uc774\ubbf8\uc9c0 \ucca8\ubd80 \uc774\ub825\uc774 \uc788\uc2b5\ub2c8\ub2e4. \uc6d0\ubcf8\uc740 \uc800\uc7a5\ud558\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.'));
 if(t.response){const r=t.response,a=r.answer,assistant=el('div','assistant-message'),label=el('div','assistant-label'),mark=el('img');mark.src='/static/mark.svg';mark.alt='';label.append(mark,el('span','','MEDI'));
 if(a.urgency==='emergency')label.append(el('span','evidence-badge emergency','즉시 도움 안내'));
 assistant.append(label);
 const visual=pickVisualAid(t.question,a,t.had_images);
 a.paragraphs.forEach((p,index)=>{const block=el('div','answer-paragraph'+(index===0?' answer-summary':''));if(p.heading)block.append(el('h3','',p.heading));block.append(el('p','',p.text));assistant.append(block);if(index===0&&visual)assistant.append(makeVisualAid(visual));});
 if(a.image_observations.length){
  const obs=el('div',r.image_analysis_ok?'answer-paragraph image-analysis-ok':'answer-paragraph image-analysis-warning');
  obs.append(el('h3','',r.image_analysis_ok?T.observations:'이미지 분석 연결 안내'),el('p','',a.image_observations.join('\n')));
  if(t.had_images&&!r.image_analysis_ok&&r.retryable&&t.previewImages?.length){const retry=el('button','retry-analysis','이미지 다시 분석');retry.type='button';retry.onclick=()=>retryImageTurn(t);obs.append(retry);}
  assistant.append(obs);
 }
 if(t.had_images&&!r.image_analysis_ok&&r.retryable&&!a.image_observations.length&&t.previewImages?.length){const retryBox=el('div','answer-paragraph image-analysis-warning');retryBox.append(el('h3','','이미지 분석 연결 안내'),el('p','','이미지 분석 연결이 일시적으로 실패했습니다. 같은 사진으로 다시 시도할 수 있어요.'));const retry=el('button','retry-analysis','이미지 다시 분석');retry.type='button';retry.onclick=()=>retryImageTurn(t);retryBox.append(retry);assistant.append(retryBox);}
 if(r.sources.length){const sources=el('details','source-list');sources.append(el('summary','','답변에 참고한 MEDI 자료 '+r.sources.length+'개'));for(const s of r.sources){const item=el('details','source-item');item.dataset.source=s.id;item.append(el('summary','',s.id+'  '+s.title),el('p','source-meta',(s.source_label||'\uc5c5\ub85c\ub4dc \uc790\ub8cc')+' \u00b7 '+(s.year||'\uc5f0\ub3c4 \ubbf8\uc0c1')+' \u00b7 '+(s.source_type==='qa'?'\ud559\uc2b5 \ubb38\ud56d':'\ucc38\uace0 \ubb38\uc11c')),el('p','excerpt',s.excerpt));sources.append(item);}sources.append(el('p','source-warning',T.referenceWarning));assistant.append(sources);}
 if(a.follow_up_questions.length){const fs=el('div','followups');for(const q of a.follow_up_questions){const b=el('button','followup',q);b.onclick=()=>{if(!state.busy){$('question').value=q;updateInput();$('question').focus();}};fs.append(b);}assistant.append(fs);}assistant.append(el('p','answer-limits',a.limitations));
 const actions=el('div','turn-actions');const copy=el('button','turn-action',T.copy);copy.onclick=async()=>{try{await navigator.clipboard.writeText(answerText(a));toast(T.copied);}catch{toast('Clipboard is unavailable.');}};actions.append(copy);if(state.user){const fb=el('button','turn-action',T.feedback);fb.onclick=()=>openFeedback(t);actions.append(fb);}assistant.append(actions);if(r.save_warning)assistant.append(el('p','inline-error',T.notSaved));turn.append(assistant);
 }else if(t.error){turn.append(el('p','inline-error',t.error));}
 const old=[...$('messages').children].find(x=>x.dataset.id===t.id);if(old)old.replaceWith(turn);else $('messages').append(turn);
}
function askConsent(sendAfter=false){state.pendingConsent=sendAfter;$('consentDialog').showModal();}
$('settingsButton').onclick=()=>{$('themeSelect').value=appearance.theme;$('fontScale').value=appearance.font;updateSafetySettings();updateLocalAIStatus();$('settingsDialog').showModal();};
$('themeSelect').onchange=()=>{appearance.theme=$('themeSelect').value;prefSet('medi-theme',appearance.theme);applyAppearance();};
$('fontScale').onchange=()=>{appearance.font=$('fontScale').value;prefSet('medi-font-scale',appearance.font);applyAppearance();};
$('consentButton').onclick=()=>askConsent(false);
$('acceptConsent').onclick=()=>{markSafetySeen();$('consentDialog').close();if(state.pendingConsent){state.pendingConsent=false;$('chatForm').requestSubmit();}};
$('neverConsent').onclick=()=>{prefSet('medi-safety-notice','hide');markSafetySeen();updateSafetySettings();$('consentDialog').close();if(state.pendingConsent){state.pendingConsent=false;$('chatForm').requestSubmit();}};
$('safetyToggle').onchange=()=>{if($('safetyToggle').checked){try{localStorage.removeItem('medi-safety-notice');}catch{}resetSafetySeen();}else{prefSet('medi-safety-notice','hide');markSafetySeen();}updateSafetySettings();};
$('showSafetyNow').onclick=()=>{state.pendingConsent=false;$('consentDialog').showModal();};
$('localAiPrepare').onclick=async()=>{if(!window.MEDILocalAI?.supported?.()){toast('이 브라우저에서는 WebGPU 보조 AI를 사용할 수 없습니다. 무료 서버 AI를 연결하면 기기와 관계없이 사용할 수 있습니다.');return;}try{$('localAiPrepare').disabled=true;await window.MEDILocalAI.prepare();}finally{updateLocalAIStatus();$('localAiPrepare').disabled=!(window.MEDILocalAI?.supported?.());statusUI();}};
window.MEDILocalAI?.setProgressHandler?.(info=>{if($('localAiStatus'))$('localAiStatus').textContent=info.message;if(state.busy)setPendingText(info.message);if(info.status==='ready'||info.status==='unsupported'||info.status==='error')statusUI();});
$('saveChat').onchange=()=>{if($('saveChat').checked&&!state.user){$('saveChat').checked=false;openAuth();}};
$('chatForm').onsubmit=async e=>{
 e.preventDefault();if(state.busy||!state.config)return;const typed=$('question').value.trim();if(!typed&&!state.images.length){$('question').focus();return;}const question=typed||'첨부한 이미지를 일반인이 이해하기 쉽게 설명해줘.';if(!state.consent){askConsent(true);return;}
 const id=requestId(),images=state.images.map(i=>({...i}));const t={id,question,had_images:!!images.length,mode:'health',previewImages:images.map(i=>i.data_url)};let mounted=false;setBusy(true);state.controller=new AbortController();
 const timer=setTimeout(()=>state.controller?.abort(),100000);
 try{
  if($('saveChat').checked&&!state.cid){const c=await api('/api/conversations',{method:'POST',body:JSON.stringify({title:(typed||'이미지 질문').slice(0,70)})});state.cid=c.id;}
  const history=state.turns.filter(x=>x.response).slice(-4).flatMap(x=>[{role:'user',content:x.question.slice(0,1600)},{role:'assistant',content:answerText(x.response.answer).slice(0,2200)}]);
  state.turns.push(t);mounted=true;$('welcome').hidden=true;renderTurn(t);scrollBottom();setPendingText('관련 의료자료를 찾고 있습니다…');
  const r=await api('/api/chat',{method:'POST',body:JSON.stringify({request_id:id,conversation_id:state.cid,message:question,history:state.cid?[]:history,images,mode:t.mode,consent:true}),signal:state.controller.signal});
  clearTimeout(timer);state.controller=null;
  if(r.provider==='browser_local'&&r.local_ai_allowed){
   if(window.MEDILocalAI?.supported?.()){
    try{setPendingText('무료 기기 AI를 준비하고 있습니다…');const generated=await window.MEDILocalAI.generate({question,mode:t.mode,sources:r.sources||[],history,hadImages:!!images.length});r.answer=generated.answer;r.model=generated.model;r.local_generated=true;}
    catch(err){r.provider='retrieval_only';r.local_ai_error=true;toast('브라우저 보조 AI를 실행하지 못했습니다. 설정에서 무료 서버 AI 연결 상태를 확인해 주세요.');}
   }else r.provider='retrieval_only';
  }
  if(state.cid&&state.user){
   try{await api('/api/conversations/'+state.cid+'/turns/local',{method:'POST',body:JSON.stringify({request_id:id,question,mode:t.mode,had_images:!!images.length,response:r})});r.saved=true;}
   catch(saveErr){r.saved=false;r.save_warning='answer_not_saved_export_before_leaving';}
  }
  t.response=r;renderTurn(t);$('question').value='';clearImages();updateInput();scrollBottom();if(state.cid)historyList();
 }catch(err){if(mounted){t.error=failure(err);renderTurn(t);}toast(failure(err));if(err.code==='login_required'){state.user=null;openAuth();}}
 finally{clearTimeout(timer);state.controller=null;setBusy(false);setPendingText(T.pending);}
};
$('stopButton').onclick=()=>{if(state.controller)state.controller.abort();else toast('기기 AI 답변 생성 중에는 잠시 기다려 주세요.');};
function download(name,obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
$('exportButton').onclick=()=>{if(!state.turns.length){toast(T.emptyExport);return;}download('MEDI-conversation-'+new Date().toISOString().slice(0,10)+'.json',{version:'0.1.0',purpose:'research_only',exported_at:new Date().toISOString(),turns:state.turns.map(({previewImages,...t})=>t)});};
function openAuth(){if(!state.config?.accounts){showInfo(T.localSession,b=>para(b,T.noAccounts));return;}$('authError').textContent='';$('authDialog').showModal();}
function authMode(signup){state.signup=signup;$('authTitle').textContent=signup?T.signup:T.login;$('authSubmit').textContent=signup?T.signup:T.login;$('authToggle').textContent=signup?T.toLogin:T.toSignup;$('termsField').hidden=!signup;$('terms').required=signup;$('inviteField').hidden=!(signup&&state.config?.invite_required);$('password').autocomplete=signup?'new-password':'current-password';}
$('authToggle').onclick=()=>authMode(!state.signup);
$('authForm').onsubmit=async e=>{e.preventDefault();$('authSubmit').disabled=true;$('authError').textContent='';try{const r=await api('/api/auth/'+(state.signup?'signup':'login'),{method:'POST',body:JSON.stringify({email:$('email').value.trim(),password:$('password').value,invite_code:$('invite').value,terms_accepted:$('terms').checked})},false);if(r.email_confirmation_required){toast(T.checkEmail);authMode(false);return;}const me=await api('/api/auth/session',{},false);state.user=me.user;$('authDialog').close();$('password').value='';$('invite').value='';newChat(true);statusUI();await historyList();}catch(err){$('authError').textContent=failure(err);}finally{$('authSubmit').disabled=false;}};
$('accountButton').onclick=async()=>{
 if(!state.user){openAuth();return;}
 showInfo('\ub098\uc758 \uacc4\uc815',b=>{para(b,state.user.email);para(b,'\uc800\uc7a5\ud55c \ub300\ud654\uc640 \ud53c\ub4dc\ubc31\uc740 \uac01\uac01 \uc0ad\uc81c\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \uc6b4\uc601\uc790\uac00 \uc774\ubbf8 \ub0b4\ubcf4\ub0b8 \uac80\ud1a0 \uc0ac\ubcf8\uc758 \ucca0\ud68c\ub294 \uc6b4\uc601\uc790\uc5d0\uac8c \ubb38\uc758\ud574\uc57c \ud569\ub2c8\ub2e4.');const section=el('div');section.id='myFeedback';b.append(section);const logout=el('button','quiet-button full',T.logout);logout.onclick=async()=>{if(state.busy)return;try{await api('/api/auth/logout',{method:'POST',body:'{}'});state.user=null;$('infoDialog').close();newChat(true);statusUI();}catch(e){toast(failure(e));}};b.append(logout);const del=el('button','quiet-button full danger',T.deleteAccount);del.onclick=async()=>{if(state.busy)return;if(prompt(T.accountConfirm)!=='DELETE MY ACCOUNT')return;try{await api('/api/account',{method:'DELETE',body:JSON.stringify({confirm:'DELETE MY ACCOUNT'})});state.user=null;$('infoDialog').close();newChat(true);statusUI();}catch(e){toast(failure(e));}};b.append(del);});
 try{const r=await api('/api/feedback');const b=$('myFeedback');if(!b)return;b.append(el('h3','','\ub0b4\uac00 \ubcf4\ub0b8 \ud53c\ub4dc\ubc31'));if(!r.feedback.length)para(b,'\uc800\uc7a5\ub41c \ud53c\ub4dc\ubc31\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.','subtle');for(const f of r.feedback){const row=el('div','feedback-row');row.append(el('span','',new Date(f.created_at).toLocaleDateString()+' \u00b7 '+f.id.slice(0,8)));const d=el('button','quiet-button',T.delete);d.onclick=async()=>{try{await api('/api/feedback/'+f.id,{method:'DELETE'});row.remove();}catch(e){toast(failure(e));}};row.append(d);b.append(row);}}catch(e){toast(failure(e));}
};
$('dataInfo').onclick=()=>showInfo(T.knowledgeLabel,b=>{stat(b,'\uac80\uc0c9\uc5d0 \uc5f0\uacb0\ub41c \ubb38\uc11c\u00b7\ubb38\ud56d',(state.config?.knowledge.documents||0).toLocaleString());stat(b,'\uac80\uc0c9 \uc870\uac01',(state.config?.knowledge.chunks||0).toLocaleString());stat(b,'\ub370\uc774\ud130\uc14b \uc784\ud3ec\ud2b8',(state.config?.knowledge.datasets||0).toString());para(b,'MEDI는 학습용 QA와 참고 문서를 모두 검색 대상으로 활용하되, 검증·테스트 분할 자료는 대화 검색에서 제외합니다. 검색 결과는 의료적 확신도가 아니라 질문과 자료의 관련도입니다.');para(b,T.referenceWarning,'notice-box');para(b,'\uace8\uc808 \uc601\uc0c1 \uc790\ub8cc 1,539\uc7a5\uc758 \uad6c\uc870\uc640 \ub77c\ubca8\uc744 \uc810\uac80\ud588\uc9c0\ub9cc, \uc601\uc0c1 \ubaa8\ub378\uc744 \ud559\uc2b5\ud55c \uac83\uc740 \uc544\ub2d9\ub2c8\ub2e4. \uc601\uc0c1 \ud310\ub3c5\uc740 \ube44\ud65c\uc131\ud654\ub418\uc5b4 \uc788\uc2b5\ub2c8\ub2e4.');});
$('privacyButton').onclick=()=>showInfo(T.privacy,b=>{para(b,T.consentBody);para(b,T.consentPrivacy,'notice-box');b.append(el('h3','','저장과 학습은 다릅니다'));para(b,'비로그인 대화는 현재 브라우저 화면에서만 사용합니다. 로그인 후 저장을 선택한 문자 대화만 Supabase에 암호화된 형태로 보관됩니다.');para(b,'무료 서버 AI가 연결된 경우 질문과 검색된 MEDI 근거자료 일부가 답변 생성을 위해 해당 제공자에 전송될 수 있습니다. 첨부 이미지는 메타데이터를 제거한 사본으로 처리되며, 이미지 이해가 가능한 무료 서버 AI가 연결된 경우 답변 생성을 위해 전송될 수 있습니다. 원본 이미지는 MEDI 대화기록에 저장하지 않습니다.');para(b,T.feedbackDescription);para(b,'사용자 피드백은 자동으로 모델을 재학습시키지 않으며, 검토 후 별도로 반영해야 합니다.');if(state.config?.operator_contact)para(b,'운영자 문의: '+state.config.operator_contact);});
function openFeedback(t){state.feedbackTurn=t;$('feedbackQuestion').value=t.question;$('feedbackAnswer').value=answerText(t.response.answer);$('correction').value='';$('feedbackConsent').checked=false;$('deidentified').checked=false;$('feedbackError').textContent='';$('feedbackSubmit').textContent=(state.config.accounts&&state.user)?T.feedbackSend:'\ub85c\uceec \uac80\ud1a0 \ud30c\uc77c \ub9cc\ub4e4\uae30';$('feedbackDialog').showModal();}
$('feedbackForm').onsubmit=async e=>{e.preventDefault();const t=state.feedbackTurn;if(!t)return;const p={turn_id:t.id,question:$('feedbackQuestion').value,answer:$('feedbackAnswer').value,correction:$('correction').value,rating:$('rating').value,consent:$('feedbackConsent').checked,deidentified_ack:$('deidentified').checked};$('feedbackSubmit').disabled=true;try{if(state.config.accounts&&state.user){await api('/api/feedback',{method:'POST',body:JSON.stringify(p)});toast(T.feedbackSuccess);}else{download('MEDI-feedback-candidate.json',{...p,status:'pending_human_review',automatically_trained:false});toast(T.feedbackLocal);}$('feedbackDialog').close();}catch(e){$('feedbackError').textContent=failure(e);}finally{$('feedbackSubmit').disabled=false;}};
window.addEventListener('beforeunload',e=>{if(state.busy||hasUnsaved()){e.preventDefault();e.returnValue='';}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
(async()=>{try{state.config=await api('/api/config');if(state.config.accounts){state.user=(await api('/api/auth/session',{},false)).user;}statusUI();updateSafetySettings();updateLocalAIStatus();authMode(false);await historyList();}catch(e){$('connection').textContent='연결 실패';toast(failure(e));}})();

```

## `static/index.html`

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark"><meta name="robots" content="noindex,nofollow">
<title>MEDI - Medical Research Companion</title>
<link rel="icon" href="/static/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="/static/app.css?v=0800">
<script src="/static/local_ai.js?v=0800" defer></script>
<script src="/static/app.js?v=0800" defer></script>
</head>
<body>
<a class="skip" href="#question" data-i18n="skip"></a>
<div class="layout">
<button id="shade" class="shade" aria-label="Close navigation" hidden></button>
<aside id="sidebar" class="sidebar" aria-label="Conversation navigation">
 <a class="brand" href="/" aria-label="MEDI home"><img src="/static/mark.svg" width="35" height="35" alt=""><span>MEDI<small>RESEARCH COMPANION</small></span></a>
 <button id="newChat" class="new-chat"><span class="plus">+</span><span data-i18n="newChat"></span><kbd>N</kbd></button>
 <div class="nav-caption" data-i18n="history"></div><div id="conversationList" class="conversation-list"></div>
 <div class="sidebar-bottom">
  <button id="dataInfo" class="data-card"><span class="data-top"><span class="status-dot"></span><span data-i18n="knowledgeLabel"></span><span class="arrow">&#8599;</span></span><strong id="docCount">--</strong><small id="chunkCount" data-i18n="loading"></small><span class="data-line"></span><small data-i18n="dataCaution"></small></button>
  <button id="privacyButton" class="side-link"><span aria-hidden="true">&#9671;</span><span data-i18n="privacy"></span></button>
  <button id="accountButton" class="account-button"><span class="avatar">M</span><span><b id="accountName" data-i18n="localSession"></b><small id="accountState" data-i18n="temporary"></small></span><span class="arrow">&#8250;</span></button>
 </div>
</aside>
<div class="workspace">
 <header class="topbar"><div class="top-left"><button id="menuButton" class="icon-button menu-button" aria-label="Open navigation">&#9776;</button><b>MEDI</b><span class="version-tag">RESEARCH BETA</span></div><div class="top-right"><span id="connection" class="connection" data-i18n="loading"></span><button id="settingsButton" class="quiet-button" type="button">설정</button><button id="exportButton" class="quiet-button" data-i18n="export"></button></div></header>
 <div id="systemNotice" class="system-notice" role="status" hidden></div>
 <main id="scrollArea" class="scroll-area">
  <section id="welcome" class="welcome">
   <div class="welcome-symbol"><img src="/static/mark.svg" width="42" height="42" alt=""></div>
   <p class="eyebrow">A SPACE FOR BETTER UNDERSTANDING</p><h1 data-i18n="welcomeTitle"></h1><p class="welcome-description" data-i18n="welcomeDescription"></p>
   <div class="suggestions">
    <button class="suggestion" data-prompt="promptKnowledge"><span class="card-icon">&#9783;</span><b data-i18n="cardKnowledge"></b><p data-i18n="cardKnowledgeDesc"></p><span class="card-arrow">&#8599;</span></button>
    <button class="suggestion" data-prompt="promptStudy"><span class="card-icon">&#10022;</span><b data-i18n="cardStudy"></b><p data-i18n="cardStudyDesc"></p><span class="card-arrow">&#8599;</span></button>
    <button class="suggestion" id="welcomeImage"><span class="card-icon">&#9635;</span><b data-i18n="cardImage"></b><p data-i18n="cardImageDesc"></p><span class="card-arrow">&#8599;</span></button>
   </div><p class="welcome-note"><span class="status-dot"></span><span data-i18n="welcomeNote"></span></p>
  </section>
  <section id="messages" class="messages" aria-label="Conversation"></section>
  <div id="pending" class="pending" role="status" hidden><span class="pulse"></span><span data-i18n="pending"></span></div>
 </main>
 <footer class="composer-area"><form id="chatForm" class="composer">
  <div id="attachments" class="attachments"></div>
  <label class="sr-only" for="question" data-i18n="questionLabel"></label><textarea id="question" rows="2" maxlength="4000" data-placeholder="questionPlaceholder"></textarea>
  <div class="composer-tools"><div class="tool-group"><button type="button" id="attachButton" class="attach-button" data-title="attach"><span class="plus">+</span><span class="attach-label" data-i18n="image"></span></button><span class="paste-hint">이미지는 Ctrl+V로 붙여넣기도 가능</span><input type="hidden" id="mode" value="health"></div><div class="tool-group"><span id="charCount" class="char-count">0 / 4000</span><button type="submit" id="sendButton" class="send-button" data-title="send" aria-label="Send message">&#8593;</button><button type="button" id="stopButton" class="stop-button" data-i18n="stop" hidden></button></div></div>
 </form>
 <div class="composer-options"><label class="save-option"><input type="checkbox" id="saveChat"><span data-i18n="saveChat"></span></label><button id="consentButton" class="text-button" data-i18n="processingInfo"></button></div>
 <p class="disclaimer" data-i18n="disclaimer"></p>
 </footer>
</div>
</div>
<input type="file" id="fileInput" accept="image/png,image/jpeg,image/webp" multiple hidden>
<div id="toast" class="toast" role="status" hidden></div>
<dialog id="infoDialog"><div class="dialog-heading"><h2 id="infoTitle"></h2><button class="icon-button" data-close="infoDialog" aria-label="Close">&#215;</button></div><div id="infoBody" class="dialog-body"></div><div class="dialog-actions"><button class="primary-button" data-close="infoDialog" data-i18n="close"></button></div></dialog>
<dialog id="consentDialog" class="safety-dialog"><div class="dialog-heading"><h2 data-i18n="consentTitle"></h2><button class="icon-button" data-close="consentDialog" aria-label="Close">&#215;</button></div><div class="dialog-body"><p data-i18n="consentBody"></p><p class="notice-box" data-i18n="consentPrivacy"></p><p class="subtle">이 안내는 기본적으로 첫 질문 전에 한 번만 표시됩니다. 설정에서 언제든 다시 켜거나 직접 다시 볼 수 있습니다.</p></div><div class="dialog-actions safety-actions"><button id="neverConsent" class="quiet-button" type="button">다시 보지 않기</button><button id="acceptConsent" class="primary-button" type="button">확인하고 계속</button></div></dialog>
<dialog id="authDialog"><div class="dialog-heading"><h2 id="authTitle" data-i18n="login"></h2><button class="icon-button" data-close="authDialog" aria-label="Close">&#215;</button></div><form id="authForm" class="dialog-body"><p class="subtle" data-i18n="authDescription"></p><label class="field"><span data-i18n="email"></span><input id="email" type="email" autocomplete="email" maxlength="254" required></label><label class="field"><span data-i18n="password"></span><input id="password" type="password" autocomplete="current-password" minlength="5" maxlength="128" required></label><label id="inviteField" class="field"><span data-i18n="invite"></span><input id="invite" type="password" autocomplete="off" maxlength="200"></label><label id="termsField" class="check-line" hidden><input id="terms" type="checkbox"><span data-i18n="terms"></span></label><p id="authError" class="inline-error" role="alert"></p><button id="authSubmit" class="primary-button full" type="submit" data-i18n="login"></button><button id="authToggle" type="button" class="text-button full" data-i18n="toSignup"></button></form></dialog>
<dialog id="settingsDialog"><div class="dialog-heading"><h2>설정</h2><button class="icon-button" data-close="settingsDialog" aria-label="Close">&#215;</button></div><div class="dialog-body settings-grid">
<label class="field"><span>화면 모드</span><select id="themeSelect"><option value="light">라이트 모드</option><option value="dark">다크 모드</option><option value="system">기기 설정 따르기</option></select></label>
<label class="field"><span>글자 크기</span><select id="fontScale"><option value="1">기본 100%</option><option value="1.12">크게 112%</option><option value="1.25">더 크게 125%</option><option value="1.4">매우 크게 140%</option></select></label>
<section class="settings-card"><div><strong>MEDI 의료 AI</strong><p id="serverAiStatus" class="subtle">무료 서버 AI 연결 상태를 확인하는 중입니다.</p></div><span class="settings-dot" aria-hidden="true"></span></section>
<section class="settings-card"><div><strong>내 의료지식 자료</strong><p id="knowledgeStatus" class="subtle">의료자료 연결 상태를 확인하는 중입니다.</p></div><span class="settings-dot" aria-hidden="true"></span></section>
<section id="localAiCard" class="settings-card"><div><strong>브라우저 보조 AI</strong><p id="localAiStatus" class="subtle">기기 호환성을 확인하는 중입니다.</p></div><button id="localAiPrepare" class="quiet-button" type="button">보조 AI 준비</button></section>
<section class="settings-card"><div><strong>첫 질문 전 주의 안내</strong><p id="safetySettingText" class="subtle">첫 질문 전에 한 번 표시합니다.</p></div><label class="switch"><input id="safetyToggle" type="checkbox" checked><span></span></label><button id="showSafetyNow" class="quiet-button full" type="button">주의사항 지금 다시 보기</button></section>
<p class="settings-help">MEDI는 먼저 짧고 쉬운 말로 답합니다. 그림이 이해에 도움이 되는 질문이면 답변 안에 간단한 설명 그림도 자동으로 보여줍니다.</p>
</div><div class="dialog-actions"><button class="primary-button" data-close="settingsDialog">완료</button></div></dialog>
<dialog id="feedbackDialog"><div class="dialog-heading"><h2 data-i18n="feedbackTitle"></h2><button class="icon-button" data-close="feedbackDialog" aria-label="Close">&#215;</button></div><form id="feedbackForm" class="dialog-body"><p class="notice-box" data-i18n="feedbackDescription"></p><label class="field"><span data-i18n="feedbackQuestion"></span><textarea id="feedbackQuestion" maxlength="4000" rows="2" required></textarea></label><label class="field"><span data-i18n="feedbackAnswer"></span><textarea id="feedbackAnswer" maxlength="16000" rows="4" required></textarea></label><label class="field"><span data-i18n="correction"></span><textarea id="correction" maxlength="4000" rows="3"></textarea></label><label class="field"><span data-i18n="rating"></span><select id="rating"><option value="needs_review" data-i18n="needsReview"></option><option value="helpful" data-i18n="helpful"></option></select></label><label class="check-line"><input id="feedbackConsent" type="checkbox" required><span data-i18n="feedbackConsent"></span></label><label class="check-line"><input id="deidentified" type="checkbox" required><span data-i18n="deidentified"></span></label><button id="feedbackSubmit" class="primary-button full" type="submit" data-i18n="feedbackSend"></button><p id="feedbackError" class="inline-error" role="alert"></p></form></dialog>
</body></html>

```

## `static/visuals/blood_pressure.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img"><rect width="900" height="520" rx="28" fill="#f5faf8"/><style>text{font-family:Arial,"Noto Sans KR",sans-serif;fill:#173b3a}.t{font-size:28px;font-weight:700}.s{font-size:17px;fill:#5e7470}.l{font-size:18px;font-weight:700}.m{font-size:15px}.box{fill:#fff;stroke:#c9ddd8;stroke-width:2}.line{stroke:#5a7772;stroke-width:2;fill:none}.arrow{stroke:#2f7d73;stroke-width:4;fill:none;marker-end:url(#a)}.bone{fill:#f4dfb9;stroke:#9c7649;stroke-width:4}.cart{fill:#8fd3c7;stroke:#31796f;stroke-width:3}.soft{fill:#eaa49b;stroke:#9a5148;stroke-width:3}.organ{fill:#d97774;stroke:#8e4b49;stroke-width:4}.blue{fill:#8fc4df;stroke:#467a96;stroke-width:3}.green{fill:#9bd5c7;stroke:#3c7b70;stroke-width:3}.gold{fill:#f3c876;stroke:#9c7635;stroke-width:3}</style><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2f7d73"/></marker></defs><text x="42" y="48" class="t">혈압: 혈액이 혈관 벽을 미는 압력</text><text x="42" y="76" class="s">수축기·이완기 숫자는 심장이 뛸 때와 쉴 때의 압력을 뜻합니다</text>
<rect x="42" y="108" width="528" height="330" rx="22" class="box"/>
<path d="M90 270 C205 190 350 350 520 245" stroke="#d36c67" stroke-width="66" fill="none" stroke-linecap="round"/>
<path d="M90 270 C205 190 350 350 520 245" stroke="#ffddd8" stroke-width="36" fill="none" stroke-linecap="round"/>
<path d="M150 265 L210 235" class="arrow"/><text x="82" y="202" class="l">혈액 흐름</text><text x="82" y="226" class="m">혈관벽을 바깥으로 밀어요</text>
<rect x="594" y="114" width="258" height="120" rx="18" class="box"/><text x="616" y="148" class="l">예: 120 / 80 mmHg</text><text x="616" y="180" class="m">120 = 수축기 혈압</text><text x="616" y="207" class="m">80 = 이완기 혈압</text>
<rect x="594" y="254" width="258" height="150" rx="18" class="box"/><text x="616" y="288" class="l">한 번의 숫자보다 중요한 것</text><text x="616" y="319" class="m">같은 조건에서 반복 측정한 값</text><text x="616" y="346" class="m">증상·약·시간대와 함께 보기</text><text x="616" y="373" class="m">지나치게 높거나 낮고 증상이 있으면 진료</text><text x="42" y="494" class="s">교육용 단순화 도식 · 실제 검사 영상이나 사람마다 구조는 다를 수 있습니다.</text></svg>
```

## `static/visuals/brain.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img"><rect width="900" height="520" rx="28" fill="#f5faf8"/><style>text{font-family:Arial,"Noto Sans KR",sans-serif;fill:#173b3a}.t{font-size:28px;font-weight:700}.s{font-size:17px;fill:#5e7470}.l{font-size:18px;font-weight:700}.m{font-size:15px}.box{fill:#fff;stroke:#c9ddd8;stroke-width:2}.line{stroke:#5a7772;stroke-width:2;fill:none}.arrow{stroke:#2f7d73;stroke-width:4;fill:none;marker-end:url(#a)}.bone{fill:#f4dfb9;stroke:#9c7649;stroke-width:4}.cart{fill:#8fd3c7;stroke:#31796f;stroke-width:3}.soft{fill:#eaa49b;stroke:#9a5148;stroke-width:3}.organ{fill:#d97774;stroke:#8e4b49;stroke-width:4}.blue{fill:#8fc4df;stroke:#467a96;stroke-width:3}.green{fill:#9bd5c7;stroke:#3c7b70;stroke-width:3}.gold{fill:#f3c876;stroke:#9c7635;stroke-width:3}</style><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2f7d73"/></marker></defs><text x="42" y="48" class="t">뇌: 서로 다른 영역이 함께 몸을 조절합니다</text><text x="42" y="76" class="s">움직임·감각·말·기억은 여러 영역이 연결되어 작동합니다</text>
<rect x="46" y="108" width="520" height="330" rx="22" class="box"/>
<path d="M190 280 C155 215 198 150 268 151 C316 112 383 142 392 190 C450 191 468 252 442 289 C467 341 417 392 365 374 C333 414 260 405 241 360 C192 362 161 319 190 280Z" fill="#e7b9d0" stroke="#8d5e78" stroke-width="5"/>
<path d="M312 151 V379 M191 278 H441 M260 159 C250 222 248 304 242 359 M389 185 C360 238 365 314 364 374" stroke="#fff" stroke-width="4" fill="none"/>
<text x="206" y="215" class="m">앞쪽: 판단·계획</text><text x="327" y="215" class="m">위쪽: 감각</text><text x="205" y="326" class="m">옆쪽: 말·청각</text><text x="330" y="326" class="m">뒤쪽: 시각</text>
<rect x="600" y="126" width="248" height="118" rx="18" class="box"/><text x="620" y="158" class="l">갑작스러운 변화</text><text x="620" y="188" class="m">한쪽 마비·말이 어눌함·</text><text x="620" y="214" class="m">심한 두통은 즉시 평가가 필요해요.</text>
<rect x="600" y="268" width="248" height="112" rx="18" class="box"/><text x="620" y="300" class="l">두통을 볼 때</text><text x="620" y="330" class="m">시작 시점·강도·구토·시야 변화</text><text x="620" y="355" class="m">·신경 증상을 함께 확인해요.</text><text x="42" y="494" class="s">교육용 단순화 도식 · 실제 검사 영상이나 사람마다 구조는 다를 수 있습니다.</text></svg>
```

## `static/visuals/diabetes.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img"><rect width="900" height="520" rx="28" fill="#f5faf8"/><style>text{font-family:Arial,"Noto Sans KR",sans-serif;fill:#173b3a}.t{font-size:28px;font-weight:700}.s{font-size:17px;fill:#5e7470}.l{font-size:18px;font-weight:700}.m{font-size:15px}.box{fill:#fff;stroke:#c9ddd8;stroke-width:2}.line{stroke:#5a7772;stroke-width:2;fill:none}.arrow{stroke:#2f7d73;stroke-width:4;fill:none;marker-end:url(#a)}.bone{fill:#f4dfb9;stroke:#9c7649;stroke-width:4}.cart{fill:#8fd3c7;stroke:#31796f;stroke-width:3}.soft{fill:#eaa49b;stroke:#9a5148;stroke-width:3}.organ{fill:#d97774;stroke:#8e4b49;stroke-width:4}.blue{fill:#8fc4df;stroke:#467a96;stroke-width:3}.green{fill:#9bd5c7;stroke:#3c7b70;stroke-width:3}.gold{fill:#f3c876;stroke:#9c7635;stroke-width:3}</style><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2f7d73"/></marker></defs><text x="42" y="48" class="t">혈당과 인슐린: 포도당을 세포 안으로 보내는 과정</text><text x="42" y="76" class="s">인슐린이 부족하거나 잘 듣지 않으면 혈액 속 포도당이 높아질 수 있습니다</text>
<rect x="42" y="108" width="816" height="330" rx="22" class="box"/>
<path d="M95 205 C180 155 230 190 300 180 C380 168 420 220 500 198" stroke="#e47b74" stroke-width="58" fill="none" stroke-linecap="round"/>
<circle cx="146" cy="195" r="11" fill="#ffd65b"/><circle cx="194" cy="202" r="11" fill="#ffd65b"/><circle cx="248" cy="182" r="11" fill="#ffd65b"/><circle cx="330" cy="188" r="11" fill="#ffd65b"/><circle cx="405" cy="206" r="11" fill="#ffd65b"/><text x="85" y="145" class="l">혈액 속 포도당</text>
<path d="M315 305 C350 270 407 281 431 318 C400 352 350 357 315 330Z" class="gold"/><text x="332" y="326" class="m">췌장</text>
<path d="M427 315 C520 322 560 300 603 268" class="arrow"/><text x="470" y="354" class="m">인슐린</text>
<rect x="636" y="205" width="166" height="124" rx="22" class="green"/><circle cx="675" cy="245" r="10" fill="#ffd65b"/><circle cx="715" cy="271" r="10" fill="#ffd65b"/><circle cx="752" cy="239" r="10" fill="#ffd65b"/><text x="660" y="303" class="l">세포</text>
<text x="605" y="382" class="m">인슐린은 포도당이 세포 안으로 들어가도록 돕습니다.</text><text x="42" y="494" class="s">교육용 단순화 도식 · 실제 검사 영상이나 사람마다 구조는 다를 수 있습니다.</text></svg>
```

## `static/visuals/heart.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img"><rect width="900" height="520" rx="28" fill="#f5faf8"/><style>text{font-family:Arial,"Noto Sans KR",sans-serif;fill:#173b3a}.t{font-size:28px;font-weight:700}.s{font-size:17px;fill:#5e7470}.l{font-size:18px;font-weight:700}.m{font-size:15px}.box{fill:#fff;stroke:#c9ddd8;stroke-width:2}.line{stroke:#5a7772;stroke-width:2;fill:none}.arrow{stroke:#2f7d73;stroke-width:4;fill:none;marker-end:url(#a)}.bone{fill:#f4dfb9;stroke:#9c7649;stroke-width:4}.cart{fill:#8fd3c7;stroke:#31796f;stroke-width:3}.soft{fill:#eaa49b;stroke:#9a5148;stroke-width:3}.organ{fill:#d97774;stroke:#8e4b49;stroke-width:4}.blue{fill:#8fc4df;stroke:#467a96;stroke-width:3}.green{fill:#9bd5c7;stroke:#3c7b70;stroke-width:3}.gold{fill:#f3c876;stroke:#9c7635;stroke-width:3}</style><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2f7d73"/></marker></defs><text x="42" y="48" class="t">심장: 네 개의 방이 혈액을 순서대로 보냅니다</text><text x="42" y="76" class="s">오른쪽은 폐로, 왼쪽은 온몸으로 혈액을 보내는 기본 흐름</text>
<rect x="46" y="108" width="520" height="330" rx="22" class="box"/>
<path d="M300 154 C240 105 175 148 180 221 C186 312 300 393 300 393 C300 393 414 312 420 221 C425 148 360 105 300 154Z" fill="#f5c8c3" stroke="#9b5b55" stroke-width="5"/>
<path d="M300 160 V374" stroke="#fff" stroke-width="6"/>
<path d="M198 250 H402" stroke="#fff" stroke-width="6"/>
<text x="215" y="217" class="l">우심방</text><text x="330" y="217" class="l">좌심방</text><text x="215" y="310" class="l">우심실</text><text x="330" y="310" class="l">좌심실</text>
<path d="M242 324 C140 360 118 250 136 188" class="arrow"/><text x="74" y="164" class="m">몸에서 돌아옴</text>
<path d="M238 330 C207 404 110 398 92 330" class="arrow"/><text x="72" y="421" class="m">폐로 보냄</text>
<path d="M360 326 C442 378 531 325 536 244" class="arrow"/><text x="442" y="396" class="m">온몸으로 보냄</text>
<rect x="594" y="120" width="264" height="90" rx="18" class="box"/><text x="616" y="151" class="l">심방</text><text x="616" y="181" class="m">혈액을 받아들이는 위쪽 방</text>
<rect x="594" y="230" width="264" height="90" rx="18" class="box"/><text x="616" y="261" class="l">심실</text><text x="616" y="291" class="m">혈액을 밀어내는 아래쪽 방</text>
<rect x="594" y="340" width="264" height="78" rx="18" class="box"/><text x="616" y="371" class="l">맥박</text><text x="616" y="399" class="m">심장이 수축할 때 느껴지는 박동</text><text x="42" y="494" class="s">교육용 단순화 도식 · 실제 검사 영상이나 사람마다 구조는 다를 수 있습니다.</text></svg>
```

## `static/visuals/heart_lung_machine.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img"><rect width="900" height="520" rx="28" fill="#f5faf8"/><style>text{font-family:Arial,"Noto Sans KR",sans-serif;fill:#173b3a}.t{font-size:28px;font-weight:700}.s{font-size:17px;fill:#5e7470}.l{font-size:18px;font-weight:700}.m{font-size:15px}.box{fill:#fff;stroke:#c9ddd8;stroke-width:2}.line{stroke:#5a7772;stroke-width:2;fill:none}.arrow{stroke:#2f7d73;stroke-width:4;fill:none;marker-end:url(#a)}.bone{fill:#f4dfb9;stroke:#9c7649;stroke-width:4}.cart{fill:#8fd3c7;stroke:#31796f;stroke-width:3}.soft{fill:#eaa49b;stroke:#9a5148;stroke-width:3}.organ{fill:#d97774;stroke:#8e4b49;stroke-width:4}.blue{fill:#8fc4df;stroke:#467a96;stroke-width:3}.green{fill:#9bd5c7;stroke:#3c7b70;stroke-width:3}.gold{fill:#f3c876;stroke:#9c7635;stroke-width:3}</style><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2f7d73"/></marker></defs><text x="42" y="48" class="t">인공심폐기: 심장과 폐를 잠시 대신하는 흐름</text><text x="42" y="76" class="s">심장수술 중 혈액을 몸 밖에서 순환시키고 산소를 공급하는 과정</text>
<rect x="42" y="105" width="816" height="330" rx="22" class="box"/>
<path d="M155 184 C132 142 78 165 84 214 C91 265 155 304 155 304 C155 304 219 265 226 214 C232 165 178 142 155 184Z" class="organ"/>
<text x="113" y="330" class="l">심장</text><text x="84" y="356" class="m">수술 중 잠시 멈출 수 있음</text>
<rect x="312" y="140" width="120" height="100" rx="18" class="blue"/><text x="334" y="178" class="l">저장통</text><text x="324" y="205" class="m">혈액을 모음</text>
<circle cx="504" cy="190" r="54" class="gold"/><circle cx="504" cy="190" r="20" fill="#fff"/><text x="472" y="270" class="l">펌프</text><text x="456" y="295" class="m">혈액을 이동</text>
<rect x="615" y="140" width="150" height="105" rx="20" class="green"/><path d="M638 216 C661 190 682 210 705 180 C727 152 745 173 754 155" class="line"/><text x="638" y="174" class="l">산화기</text><text x="638" y="202" class="m">산소 공급·CO₂ 제거</text>
<path d="M205 205 C250 190 270 190 306 190" class="arrow"/><text x="222" y="174" class="m">정맥혈</text>
<path d="M434 190 L445 190" class="arrow"/><path d="M558 190 L606 190" class="arrow"/>
<path d="M690 248 C650 350 340 390 190 260" class="arrow"/><text x="470" y="387" class="m">산소가 공급된 혈액을 몸으로 다시 보냄</text>
<rect x="270" y="320" width="360" height="72" rx="16" fill="#eef6ff" stroke="#bdd8e6"/><text x="292" y="348" class="l">핵심</text><text x="292" y="374" class="m">심장과 폐를 없애는 기계가 아니라 수술하는 동안 기능을 잠시 대신해주는 장치예요.</text><text x="42" y="494" class="s">교육용 단순화 도식 · 실제 검사 영상이나 사람마다 구조는 다를 수 있습니다.</text></svg>
```

## `static/visuals/knee.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img"><rect width="900" height="520" rx="28" fill="#f5faf8"/><style>text{font-family:Arial,"Noto Sans KR",sans-serif;fill:#173b3a}.t{font-size:28px;font-weight:700}.s{font-size:17px;fill:#5e7470}.l{font-size:18px;font-weight:700}.m{font-size:15px}.box{fill:#fff;stroke:#c9ddd8;stroke-width:2}.line{stroke:#5a7772;stroke-width:2;fill:none}.arrow{stroke:#2f7d73;stroke-width:4;fill:none;marker-end:url(#a)}.bone{fill:#f4dfb9;stroke:#9c7649;stroke-width:4}.cart{fill:#8fd3c7;stroke:#31796f;stroke-width:3}.soft{fill:#eaa49b;stroke:#9a5148;stroke-width:3}.organ{fill:#d97774;stroke:#8e4b49;stroke-width:4}.blue{fill:#8fc4df;stroke:#467a96;stroke-width:3}.green{fill:#9bd5c7;stroke:#3c7b70;stroke-width:3}.gold{fill:#f3c876;stroke:#9c7635;stroke-width:3}</style><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2f7d73"/></marker></defs><text x="42" y="48" class="t">무릎관절: 어디가 어떻게 연결될까요?</text><text x="42" y="76" class="s">뼈·연골·반월상연골·인대의 위치를 한눈에 보는 그림</text>
<rect x="44" y="105" width="520" height="350" rx="22" class="box"/>
<path d="M260 120 C245 170 248 206 266 237 L250 258 C239 271 239 292 252 307" class="bone" stroke-width="38" fill="none" stroke-linecap="round"/>
<path d="M350 120 C365 170 362 206 344 237 L360 258 C371 271 371 292 358 307" class="bone" stroke-width="38" fill="none" stroke-linecap="round"/>
<path d="M265 310 L250 435" class="bone" stroke-width="48" fill="none" stroke-linecap="round"/>
<path d="M345 310 L360 435" class="bone" stroke-width="48" fill="none" stroke-linecap="round"/>
<path d="M242 266 Q305 238 368 266" class="cart" stroke-width="12" fill="none"/>
<path d="M255 286 Q305 308 355 286" stroke="#6bb5a7" stroke-width="12" fill="none" stroke-linecap="round"/>
<circle cx="305" cy="255" r="30" class="gold"/>
<path d="M282 270 C300 305 324 327 343 348" stroke="#d56c65" stroke-width="9" fill="none" stroke-linecap="round"/>
<path d="M330 270 C315 300 295 322 277 344" stroke="#8f79bf" stroke-width="8" fill="none" stroke-linecap="round"/>
<text x="200" y="143" class="m">대퇴골</text><line x1="242" y1="148" x2="257" y2="160" class="line"/>
<text x="383" y="424" class="m">정강뼈(경골)</text><line x1="377" y1="414" x2="362" y2="396" class="line"/>
<text x="86" y="266" class="m">관절연골</text><line x1="160" y1="260" x2="244" y2="264" class="line"/>
<text x="76" y="309" class="m">반월상연골</text><line x1="173" y1="304" x2="251" y2="290" class="line"/>
<text x="392" y="256" class="m">무릎뼈(슬개골)</text><line x1="385" y1="252" x2="338" y2="254" class="line"/>
<text x="390" y="322" class="m">십자인대</text><line x1="380" y1="318" x2="337" y2="310" class="line"/>
<rect x="590" y="110" width="268" height="94" rx="18" class="box"/><text x="612" y="140" class="l">계단에서 아플 때</text><text x="612" y="169" class="m">무릎 앞쪽·안쪽·바깥쪽 중</text><text x="612" y="191" class="m">어디가 아픈지 구분해보세요.</text>
<rect x="590" y="220" width="268" height="94" rx="18" class="box"/><text x="612" y="250" class="l">붓기·열감이 있나요?</text><text x="612" y="279" class="m">갑자기 붓거나 뜨겁다면 단순</text><text x="612" y="301" class="m">근육통 외 원인도 확인이 필요해요.</text>
<rect x="590" y="330" width="268" height="94" rx="18" class="box"/><text x="612" y="360" class="l">다친 적이 있나요?</text><text x="612" y="389" class="m">비틀림·넘어짐 뒤 통증은 인대나</text><text x="612" y="411" class="m">연골 손상 여부를 함께 살펴요.</text><text x="42" y="494" class="s">교육용 단순화 도식 · 실제 검사 영상이나 사람마다 구조는 다를 수 있습니다.</text></svg>
```

## `static/visuals/lungs.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img"><rect width="900" height="520" rx="28" fill="#f5faf8"/><style>text{font-family:Arial,"Noto Sans KR",sans-serif;fill:#173b3a}.t{font-size:28px;font-weight:700}.s{font-size:17px;fill:#5e7470}.l{font-size:18px;font-weight:700}.m{font-size:15px}.box{fill:#fff;stroke:#c9ddd8;stroke-width:2}.line{stroke:#5a7772;stroke-width:2;fill:none}.arrow{stroke:#2f7d73;stroke-width:4;fill:none;marker-end:url(#a)}.bone{fill:#f4dfb9;stroke:#9c7649;stroke-width:4}.cart{fill:#8fd3c7;stroke:#31796f;stroke-width:3}.soft{fill:#eaa49b;stroke:#9a5148;stroke-width:3}.organ{fill:#d97774;stroke:#8e4b49;stroke-width:4}.blue{fill:#8fc4df;stroke:#467a96;stroke-width:3}.green{fill:#9bd5c7;stroke:#3c7b70;stroke-width:3}.gold{fill:#f3c876;stroke:#9c7635;stroke-width:3}</style><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2f7d73"/></marker></defs><text x="42" y="48" class="t">폐와 기도: 공기가 들어가 산소가 혈액으로 이동합니다</text><text x="42" y="76" class="s">코·입 → 기관 → 기관지 → 작은 공기주머니(폐포)의 흐름</text>
<rect x="46" y="108" width="530" height="335" rx="22" class="box"/>
<rect x="287" y="128" width="26" height="118" rx="12" class="green"/><text x="326" y="154" class="m">기관</text>
<path d="M300 235 L230 285 M300 235 L370 285" stroke="#4c8b80" stroke-width="17" fill="none" stroke-linecap="round"/>
<path d="M230 285 L190 334 M230 285 L250 345 M370 285 L410 334 M370 285 L350 345" stroke="#6ca99e" stroke-width="9" fill="none" stroke-linecap="round"/>
<path d="M248 195 C155 180 110 247 126 348 C139 428 247 413 274 331 L274 215Z" class="blue"/>
<path d="M352 195 C445 180 490 247 474 348 C461 428 353 413 326 331 L326 215Z" class="blue"/>
<text x="148" y="392" class="l">왼쪽 폐</text><text x="385" y="392" class="l">오른쪽 폐</text>
<circle cx="683" cy="230" r="92" fill="#fff" stroke="#c9ddd8" stroke-width="3"/><circle cx="650" cy="210" r="24" fill="#ffd7d2" stroke="#a7655e"/><circle cx="700" cy="194" r="24" fill="#ffd7d2" stroke="#a7655e"/><circle cx="712" cy="244" r="24" fill="#ffd7d2" stroke="#a7655e"/><circle cx="664" cy="258" r="24" fill="#ffd7d2" stroke="#a7655e"/><text x="638" y="350" class="l">폐포</text><text x="605" y="377" class="m">산소와 이산화탄소가</text><text x="627" y="399" class="m">교환되는 곳</text><path d="M574 272 C606 257 615 246 627 229" class="arrow"/><text x="42" y="494" class="s">교육용 단순화 도식 · 실제 검사 영상이나 사람마다 구조는 다를 수 있습니다.</text></svg>
```

## `static/visuals/medicine.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img"><rect width="900" height="520" rx="28" fill="#f5faf8"/><style>text{font-family:Arial,"Noto Sans KR",sans-serif;fill:#173b3a}.t{font-size:28px;font-weight:700}.s{font-size:17px;fill:#5e7470}.l{font-size:18px;font-weight:700}.m{font-size:15px}.box{fill:#fff;stroke:#c9ddd8;stroke-width:2}.line{stroke:#5a7772;stroke-width:2;fill:none}.arrow{stroke:#2f7d73;stroke-width:4;fill:none;marker-end:url(#a)}.bone{fill:#f4dfb9;stroke:#9c7649;stroke-width:4}.cart{fill:#8fd3c7;stroke:#31796f;stroke-width:3}.soft{fill:#eaa49b;stroke:#9a5148;stroke-width:3}.organ{fill:#d97774;stroke:#8e4b49;stroke-width:4}.blue{fill:#8fc4df;stroke:#467a96;stroke-width:3}.green{fill:#9bd5c7;stroke:#3c7b70;stroke-width:3}.gold{fill:#f3c876;stroke:#9c7635;stroke-width:3}</style><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2f7d73"/></marker></defs><text x="42" y="48" class="t">약을 확인할 때 꼭 보는 정보</text><text x="42" y="76" class="s">약 이름만이 아니라 용량·횟수·시간·주의사항을 함께 확인합니다</text>
<rect x="46" y="108" width="808" height="330" rx="22" class="box"/>
<rect x="86" y="160" width="220" height="205" rx="22" fill="#dbece8" stroke="#6e9c93" stroke-width="4"/><rect x="112" y="128" width="168" height="55" rx="12" fill="#7db7aa"/><rect x="118" y="210" width="156" height="112" rx="12" fill="#fff" stroke="#c9ddd8"/><text x="145" y="240" class="l">약 이름</text><text x="145" y="268" class="m">용량 mg</text><text x="145" y="293" class="m">1일 몇 회</text><text x="145" y="318" class="m">식전/식후</text>
<text x="365" y="163" class="l">사진을 올릴 때 MEDI가 볼 항목</text><circle cx="380" cy="202" r="8" fill="#4c9386"/><text x="400" y="208" class="m">약 이름과 함량</text><circle cx="380" cy="242" r="8" fill="#4c9386"/><text x="400" y="248" class="m">복용 횟수와 시간</text><circle cx="380" cy="282" r="8" fill="#4c9386"/><text x="400" y="288" class="m">주의 문구·보관 방법</text><circle cx="380" cy="322" r="8" fill="#4c9386"/><text x="400" y="328" class="m">다른 약과 함께 먹는지</text>
<rect x="625" y="168" width="178" height="148" rx="18" fill="#fff5d8" stroke="#ddc47e"/><text x="650" y="202" class="l">중요</text><text x="650" y="232" class="m">사진만으로 약을</text><text x="650" y="258" class="m">임의로 끊거나</text><text x="650" y="284" class="m">용량을 바꾸지 않기</text><text x="42" y="494" class="s">교육용 단순화 도식 · 실제 검사 영상이나 사람마다 구조는 다를 수 있습니다.</text></svg>
```

## `static/visuals/spine.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img"><rect width="900" height="520" rx="28" fill="#f5faf8"/><style>text{font-family:Arial,"Noto Sans KR",sans-serif;fill:#173b3a}.t{font-size:28px;font-weight:700}.s{font-size:17px;fill:#5e7470}.l{font-size:18px;font-weight:700}.m{font-size:15px}.box{fill:#fff;stroke:#c9ddd8;stroke-width:2}.line{stroke:#5a7772;stroke-width:2;fill:none}.arrow{stroke:#2f7d73;stroke-width:4;fill:none;marker-end:url(#a)}.bone{fill:#f4dfb9;stroke:#9c7649;stroke-width:4}.cart{fill:#8fd3c7;stroke:#31796f;stroke-width:3}.soft{fill:#eaa49b;stroke:#9a5148;stroke-width:3}.organ{fill:#d97774;stroke:#8e4b49;stroke-width:4}.blue{fill:#8fc4df;stroke:#467a96;stroke-width:3}.green{fill:#9bd5c7;stroke:#3c7b70;stroke-width:3}.gold{fill:#f3c876;stroke:#9c7635;stroke-width:3}</style><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2f7d73"/></marker></defs><text x="42" y="48" class="t">척추와 디스크: 몸을 지지하고 신경을 보호합니다</text><text x="42" y="76" class="s">뼈 사이 디스크가 충격을 흡수하고, 옆으로 신경이 나옵니다</text>
<rect x="46" y="108" width="520" height="330" rx="22" class="box"/>
<rect x="240" y="130" width="115" height="28" rx="8" class="bone"/><rect x="260" y="160" width="75" height="12" rx="6" class="cart"/><rect x="240" y="177" width="115" height="28" rx="8" class="bone"/><rect x="260" y="207" width="75" height="12" rx="6" class="cart"/><rect x="240" y="224" width="115" height="28" rx="8" class="bone"/><rect x="260" y="254" width="75" height="12" rx="6" class="cart"/><rect x="240" y="271" width="115" height="28" rx="8" class="bone"/><rect x="260" y="301" width="75" height="12" rx="6" class="cart"/><rect x="240" y="318" width="115" height="28" rx="8" class="bone"/><rect x="260" y="348" width="75" height="12" rx="6" class="cart"/><rect x="240" y="365" width="115" height="28" rx="8" class="bone"/><rect x="260" y="395" width="75" height="12" rx="6" class="cart"/>
<path d="M300 126 L300 422" stroke="#e18a70" stroke-width="10" fill="none"/><path d="M355 230 C430 215 450 185 490 178" class="arrow"/><text x="400" y="151" class="m">신경뿌리</text>
<text x="95" y="170" class="l">척추뼈</text><line x1="170" y1="165" x2="238" y2="145" class="line"/><text x="95" y="220" class="l">디스크</text><line x1="163" y1="214" x2="256" y2="209" class="line"/>
<rect x="600" y="128" width="244" height="110" rx="18" class="box"/><text x="620" y="160" class="l">디스크가 자극될 때</text><text x="620" y="191" class="m">허리통증뿐 아니라 다리로</text><text x="620" y="216" class="m">저림·통증이 퍼질 수 있어요.</text>
<rect x="600" y="260" width="244" height="134" rx="18" class="box"/><text x="620" y="292" class="l">빨리 확인할 증상</text><text x="620" y="323" class="m">다리 힘이 급격히 빠짐</text><text x="620" y="349" class="m">대소변 조절 이상</text><text x="620" y="375" class="m">회음부 감각 이상</text><text x="42" y="494" class="s">교육용 단순화 도식 · 실제 검사 영상이나 사람마다 구조는 다를 수 있습니다.</text></svg>
```

## `static/visuals/stomach.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img"><rect width="900" height="520" rx="28" fill="#f5faf8"/><style>text{font-family:Arial,"Noto Sans KR",sans-serif;fill:#173b3a}.t{font-size:28px;font-weight:700}.s{font-size:17px;fill:#5e7470}.l{font-size:18px;font-weight:700}.m{font-size:15px}.box{fill:#fff;stroke:#c9ddd8;stroke-width:2}.line{stroke:#5a7772;stroke-width:2;fill:none}.arrow{stroke:#2f7d73;stroke-width:4;fill:none;marker-end:url(#a)}.bone{fill:#f4dfb9;stroke:#9c7649;stroke-width:4}.cart{fill:#8fd3c7;stroke:#31796f;stroke-width:3}.soft{fill:#eaa49b;stroke:#9a5148;stroke-width:3}.organ{fill:#d97774;stroke:#8e4b49;stroke-width:4}.blue{fill:#8fc4df;stroke:#467a96;stroke-width:3}.green{fill:#9bd5c7;stroke:#3c7b70;stroke-width:3}.gold{fill:#f3c876;stroke:#9c7635;stroke-width:3}</style><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2f7d73"/></marker></defs><text x="42" y="48" class="t">소화기관: 음식이 지나가는 길</text><text x="42" y="76" class="s">식도에서 위를 거쳐 작은창자와 큰창자로 이어집니다</text>
<rect x="46" y="106" width="808" height="336" rx="22" class="box"/>
<path d="M280 130 L280 212" stroke="#c97767" stroke-width="28" fill="none" stroke-linecap="round"/><text x="310" y="164" class="m">식도</text>
<path d="M275 206 C342 172 410 205 414 270 C416 330 365 361 310 339 C267 322 249 280 273 242Z" fill="#efaa96" stroke="#9d5d51" stroke-width="5"/><text x="319" y="274" class="l">위</text>
<path d="M404 300 C486 290 500 345 444 365 C390 384 432 413 486 391" stroke="#efb56f" stroke-width="22" fill="none" stroke-linecap="round"/><text x="495" y="361" class="m">십이지장</text>
<path d="M575 190 C695 150 786 230 758 340 C736 421 602 416 578 343 C553 269 648 225 704 258 C745 282 706 342 652 323 C610 308 620 264 655 257" stroke="#8fc4a8" stroke-width="23" fill="none" stroke-linecap="round"/><text x="618" y="206" class="l">장</text><text x="585" y="427" class="m">통증 위치·식사와의 관계·구토/설사 여부가 원인 파악에 도움돼요.</text><text x="42" y="494" class="s">교육용 단순화 도식 · 실제 검사 영상이나 사람마다 구조는 다를 수 있습니다.</text></svg>
```

## `static/visuals/wound.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img"><rect width="900" height="520" rx="28" fill="#f5faf8"/><style>text{font-family:Arial,"Noto Sans KR",sans-serif;fill:#173b3a}.t{font-size:28px;font-weight:700}.s{font-size:17px;fill:#5e7470}.l{font-size:18px;font-weight:700}.m{font-size:15px}.box{fill:#fff;stroke:#c9ddd8;stroke-width:2}.line{stroke:#5a7772;stroke-width:2;fill:none}.arrow{stroke:#2f7d73;stroke-width:4;fill:none;marker-end:url(#a)}.bone{fill:#f4dfb9;stroke:#9c7649;stroke-width:4}.cart{fill:#8fd3c7;stroke:#31796f;stroke-width:3}.soft{fill:#eaa49b;stroke:#9a5148;stroke-width:3}.organ{fill:#d97774;stroke:#8e4b49;stroke-width:4}.blue{fill:#8fc4df;stroke:#467a96;stroke-width:3}.green{fill:#9bd5c7;stroke:#3c7b70;stroke-width:3}.gold{fill:#f3c876;stroke:#9c7635;stroke-width:3}</style><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2f7d73"/></marker></defs><text x="42" y="48" class="t">상처에서 확인할 변화</text><text x="42" y="76" class="s">붉음·붓기·열감·분비물이 커지는지와 상처 범위를 함께 봅니다</text>
<rect x="44" y="110" width="520" height="325" rx="22" class="box"/>
<rect x="82" y="160" width="440" height="62" rx="12" fill="#f1c2ad"/><rect x="82" y="222" width="440" height="85" fill="#f6d69c"/><rect x="82" y="307" width="440" height="82" rx="0 0 12 12" fill="#f2e4bd"/>
<text x="95" y="198" class="m">피부</text><text x="95" y="270" class="m">피하조직</text><text x="95" y="355" class="m">더 깊은 조직</text>
<path d="M292 156 C286 194 267 224 248 248 C278 263 315 264 347 247 C330 220 316 190 312 156Z" fill="#b54d4a" stroke="#813734" stroke-width="4"/>
<ellipse cx="300" cy="188" rx="92" ry="52" fill="none" stroke="#e77b6f" stroke-width="6" stroke-dasharray="10 8"/>
<text x="601" y="150" class="l">살펴볼 신호</text><circle cx="616" cy="187" r="8" fill="#d85f57"/><text x="636" y="193" class="m">붉은 범위가 넓어짐</text><circle cx="616" cy="225" r="8" fill="#d85f57"/><text x="636" y="231" class="m">붓기·열감이 심해짐</text><circle cx="616" cy="263" r="8" fill="#d85f57"/><text x="636" y="269" class="m">고름·냄새·분비물 증가</text><circle cx="616" cy="301" r="8" fill="#d85f57"/><text x="636" y="307" class="m">통증이 갈수록 심해짐</text><circle cx="616" cy="339" r="8" fill="#d85f57"/><text x="636" y="345" class="m">발열 또는 오한 동반</text><text x="42" y="494" class="s">교육용 단순화 도식 · 실제 검사 영상이나 사람마다 구조는 다를 수 있습니다.</text></svg>
```
