# MEDI v0.10 전체 파일 복사·붙여넣기용

## app/config.py

```python
"""MEDI runtime configuration — Gemini free-tier focused build.

All secrets stay in environment variables. This build intentionally removes
OpenAI/Groq as required dependencies so the app can run with a single Gemini
API key from Google AI Studio.
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

    # Gemini free API. Older values such as MEDI_AI_PROVIDER=auto are accepted
    # for compatibility and still resolve to Gemini when GEMINI_API_KEY exists.
    ai_provider: str = field(default_factory=lambda: os.getenv('MEDI_AI_PROVIDER', 'gemini').strip().lower())
    ai_request_retries: int = field(default_factory=lambda: integer('MEDI_AI_RETRIES', 2, 0, 3))
    gemini_api_key: str = field(default_factory=lambda: os.getenv('GEMINI_API_KEY', '').strip())
    gemini_model: str = field(default_factory=lambda: os.getenv('GEMINI_MODEL', 'gemini-2.5-flash').strip())

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
        return ('gemini',) if self.gemini_api_key else ()

    @property
    def provider_failover(self) -> bool:
        # Kept for compatibility with the frontend/config response. This build
        # intentionally uses Gemini only, so there is no second server provider.
        return False

    @property
    def free_server_ai(self) -> str | None:
        return 'gemini' if self.gemini_api_key and self.ai_provider != 'browser' else None

    @property
    def image_ai_available(self) -> bool:
        return bool(self.gemini_api_key and self.ai_provider != 'browser')

    def validate(self):
        if self.deployment not in {'local', 'public'}:
            raise RuntimeError('Invalid DEPLOYMENT_MODE')
        # Keep compatibility with older Render env values instead of crashing.
        if self.ai_provider not in {'auto', 'gemini', 'browser', 'groq'}:
            raise RuntimeError('MEDI_AI_PROVIDER must be gemini, auto, browser, or groq')
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

## app/main.py

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
from app.policy import emergency_signal, fixed_answer, DISCLAIMER
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
        model=(cfg.gemini_model if backend=='gemini' else None)
        return {'app':'MEDI','version':'0.10.0','public':cfg.public,'accounts':cfg.has_accounts,
                'ai_mode':'gemini_server' if (cfg.configured_backends and cfg.ai_provider!='browser') else 'gemini_not_configured',
                'ai_backend':backend,'ai_backends':list(cfg.configured_backends),
                'ai_connected':bool(cfg.configured_backends and cfg.ai_provider!='browser'),'ai_model':model,
                'local_model':None,
                'knowledge':app.state.stats,'knowledge_enabled':not cfg.public or cfg.dataset_rights_confirmed,
                'dataset_rights_confirmed':cfg.dataset_rights_confirmed,
                'invite_required':False,'guest_chat':True,'max_image_mb':5,'max_images':2,
                'learning':'consented_feedback_then_human_review','radiology_enabled':bool(cfg.image_ai_available),
                'image_understanding_enabled':bool(cfg.image_ai_available and cfg.ai_provider!='browser'),
                'provider_failover':cfg.provider_failover,'ai_retries':cfg.ai_request_retries,
                'operator_contact':cfg.operator_contact}

    @app.get('/api/ai/status')
    async def ai_status():
        connected=bool(cfg.gemini_api_key and cfg.ai_provider!='browser')
        return {
            'provider':'gemini',
            'configured':connected,
            'model':cfg.gemini_model if connected else None,
            'image_understanding_enabled':connected,
            'required_environment':['GEMINI_API_KEY','GEMINI_MODEL','MEDI_AI_PROVIDER'],
            'recommended_values':{
                'MEDI_AI_PROVIDER':'gemini',
                'GEMINI_MODEL':'gemini-2.5-flash',
            },
        }
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
            else:
                # Re-encode images in memory before any external multimodal call.
                # EXIF/ICC metadata is removed and the original bytes are not stored.
                clean_images=[]
                for image in data.images:
                    clean_url,info=await asyncio.to_thread(sanitize_image,image.data_url,cfg.max_image_bytes)
                    image_info.append(info)
                    clean_images.append(image.model_copy(update={'data_url':clean_url}))
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

                # Every ordinary medical answer is generated for the current
                # question by Gemini. MEDI retrieval is supporting evidence, not a
                # canned-answer fallback. If Gemini is not configured or fails, we
                # return a clear connection error instead of pretending that search
                # snippets are an AI answer.
                if not cfg.gemini_api_key or cfg.ai_provider=='browser':
                    raise HTTPException(503,'gemini_not_configured')
                try:
                    gen=generator or provider_generate
                    produced=await gen(data,sources,cfg)
                    if isinstance(produced, ProviderResult):
                        answer=produced.answer;provider=produced.provider;model=produced.model
                    elif isinstance(produced, MedicalAnswer):
                        answer=produced;provider='gemini_free';model=cfg.gemini_model
                    else:
                        raise ProviderError('gemini_output','Gemini 응답 형식이 올바르지 않습니다.')
                except ProviderError as exc:
                    # Surface the actual Gemini problem to the UI. No browser LLM
                    # and no saved-template answer is substituted here.
                    raise HTTPException(502,exc.code) from exc

            result={'id':str(data.request_id),'answer':answer.model_dump(),'sources':sources,
                    'provider':provider,'model':model,'provider_warning':provider_warning,
                    'image_processing':image_info,'image_bytes_stored':False,'quota':None,
                    'saved':False,'learning_applied':False,
                    'local_ai_allowed':False,
                    'image_analysis_ok':bool(data.images and provider=='gemini_free'),
                    'retryable':False,
                    'knowledge_used':bool(sources)}
            results[key]=(time.monotonic(),digest,result)
            return result
        finally:
            active.discard(key);active_users.discard(uid)

    @app.post('/api/conversations/{cid}/turns/local')
    async def save_local_turn(cid:UUID,data:LocalTurnSave,request:Request):
        user,token=await identity(request)
        if data.response.get('provider') not in {'guardrail','gemini_free'}:
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

## app/provider.py

```python
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
    if settings.ai_provider == 'browser':
        raise ProviderError('gemini_disabled', 'MEDI_AI_PROVIDER가 browser로 설정되어 있습니다. gemini로 바꿔 주세요.')

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

```

## app/schemas.py

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

## static/app.js

```javascript
'use strict';
const T={
 skip:'\uc9c8\ubb38 \uc785\ub825\uc73c\ub85c \uac74\ub108\ub6f0\uae30',newChat:'\uc0c8 \ub300\ud654',history:'\ub098\uc758 \ub300\ud654',loading:'\uc5f0\uacb0 \ud655\uc778 \uc911',knowledgeLabel:'\uc5f0\uacb0\ub41c \uc758\ud559\uc9c0\uc2dd',dataCaution:'\uc784\uc0c1 \uac80\ud1a0 \uc804 \uc5c5\ub85c\ub4dc \uc790\ub8cc',privacy:'\uac1c\uc778\uc815\ubcf4\uc640 \ud559\uc2b5 \uc548\ub0b4',localSession:'\uac8c\uc2a4\ud2b8 \uc0ac\uc6a9',temporary:'\ub85c\uadf8\uc778 \uc5c6\uc774 \ubc14\ub85c \uc0ac\uc6a9 \uac00\ub2a5',export:'\ub300\ud654 \ub0b4\ubcf4\ub0b4\uae30',welcomeTitle:'의료가 궁금할 때, 편하게 물어보세요.',welcomeDescription:'증상, 질병, 검사, 수술, 약, 의료기기까지 어려운 의학 내용을 쉽게 설명해드려요. 사진을 올리거나 붙여넣어 물어볼 수도 있어요.',cardKnowledge:'증상이 궁금할 때',cardKnowledgeDesc:'아픈 곳과 증상을 말하면 가능한 이유를 쉽게 정리',cardImage:'사진으로 물어보기',cardImageDesc:'검사 결과, 상처 사진, X-ray 등 이미지를 올려 질문',cardStudy:'의학용어 쉽게 알아보기',cardStudyDesc:'인공심폐기 같은 낯선 용어도 일상적인 말로 설명',welcomeNote:'\uc5f0\uad6c\u00b7\ud559\uc2b5\uc6a9 \ubca0\ud0c0\uc785\ub2c8\ub2e4. \uc9c4\ub2e8\uc774\ub098 \ucc98\ubc29\uc744 \uc81c\uacf5\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.',pending:'처리하고 있습니다.',questionLabel:'\uc758\ub8cc\u00b7\uac74\uac15 \uc9c8\ubb38',questionPlaceholder:'예: 인공심폐기가 뭐야? / 무릎이 아픈데 왜 그럴까? 사진은 붙여넣어도 돼요.',attach:'\uc774\ubbf8\uc9c0 \ucca8\ubd80 (JPG, PNG, WebP)',image:'\uc774\ubbf8\uc9c0',mode:'\ub300\ud654 \ubaa8\ub4dc',health:'\uac74\uac15\uc9c0\uc2dd',study:'\uc758\ud559 \ud559\uc2b5',send:'\ubcf4\ub0b4\uae30',stop:'\uc911\ub2e8',saveChat:'\uc774 \ub300\ud654\ub97c \ub0b4 \uacc4\uc815\uc5d0 \uc800\uc7a5',processingInfo:'안전·개인정보 안내',disclaimer:'MEDI\ub294 \uc9c4\ub2e8\u00b7\ucc98\ubc29\u00b7\uc601\uc0c1 \ud310\ub3c5\uc744 \ub300\uccb4\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \uc751\uae09\uc0c1\ud669\uc740 \ucc57\ubd07\uc774 \uc544\ub2cc 119\ub85c \uc5f0\ub77d\ud558\uc138\uc694.',close:'\ub2eb\uae30',consentTitle:'MEDI 이용 전 확인해주세요',consentBody:'질문과 최근 대화는 관련 의료자료를 찾기 위해 MEDI 서버로 전송됩니다. Gemini가 연결된 경우 질문·검색된 의료자료 일부와 첨부 이미지의 메타데이터를 제거한 사본이 답변 생성을 위해 Google Gemini API에 전송될 수 있습니다. 원본 이미지는 대화기록에 저장하지 않습니다.',consentPrivacy:'실명, 주민번호, 연락처, 병원 등록번호 등 개인을 식별할 수 있는 정보는 입력하지 마세요. 사진·검사결과지에도 이름, 환자번호, 생년월일 등이 보이지 않도록 가려주세요. 심한 흉통, 호흡곤란, 의식저하, 마비, 멈추지 않는 출혈 등 긴급한 증상은 MEDI 답변을 기다리지 말고 119 또는 응급의료기관을 이용하세요.',consentCheck:'안내 내용을 확인했습니다.',cancel:'\ucde8\uc18c',agree:'확인하고 계속',login:'\ub85c\uadf8\uc778',signup:'\ud68c\uc6d0\uac00\uc785',authDescription:'\ub85c\uadf8\uc778\ud558\uc9c0 \uc54a\uc544\ub3c4 \ubc14\ub85c \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \ud68c\uc6d0\uac00\uc785\u00b7\ub85c\uadf8\uc778\ud558\uba74 \uc800\uc7a5\uc744 \uc120\ud0dd\ud55c \ub300\ud654 \uae30\ub85d\uc744 \ub0b4 \uacc4\uc815\uc5d0 \ub0a8\uae38 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',email:'\uc774\uba54\uc77c',password:'\ube44\ubc00\ubc88\ud638 (5\uc790 \uc774\uc0c1)',invite:'\ucd08\ub300\ucf54\ub4dc (\uc6b4\uc601\uc790\uac00 \uc81c\ud55c\ud55c \uacbd\uc6b0\uc5d0\ub9cc)',terms:'\uc758\ub8cc \uc11c\ube44\uc2a4\uac00 \uc544\ub2cc \uc5f0\uad6c\uc6a9 \ub3c4\uad6c\uc784\uc744 \uc774\ud574\ud558\uba70, \ube44\uc2dd\ubcc4 \uc815\ubcf4\ub85c\ub9cc \uc2dc\ud5d8\ud569\ub2c8\ub2e4.',toSignup:'\uc544\uc9c1 \uacc4\uc815\uc774 \uc5c6\uc73c\uc2e0\uac00\uc694? \ud68c\uc6d0\uac00\uc785',toLogin:'\uc774\ubbf8 \uacc4\uc815\uc774 \uc788\uc73c\uc2e0\uac00\uc694? \ub85c\uadf8\uc778',feedbackTitle:'\ub354 \ub098\uc740 \ub2f5\ubcc0\uc744 \uc704\ud55c \ud53c\ub4dc\ubc31',feedbackDescription:'\ud53c\ub4dc\ubc31\uc740 \uc989\uc2dc \ud559\uc2b5\ub418\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \ub3d9\uc758\ud55c \ub0b4\uc6a9\ub9cc \uc6b4\uc601\uc790\uc758 \uac80\ud1a0 \ub300\uae30\uc5f4\uc5d0 \ubcf4\ub0b4\uba70, \uc758\ud559\u00b7\uac1c\uc778\uc815\ubcf4 \uac80\ud1a0 \ud6c4 \uc218\ub3d9\uc73c\ub85c \ubc18\uc601\ud569\ub2c8\ub2e4. \uc544\ub798 \ub0b4\uc6a9\uc5d0\uc11c \uac1c\uc778\uc815\ubcf4\ub97c \uc0ad\uc81c\ud558\uc138\uc694.',feedbackQuestion:'\uac80\ud1a0\uc6a9 \uc9c8\ubb38 (\uc218\uc815 \uac00\ub2a5)',feedbackAnswer:'\uac80\ud1a0\uc6a9 \ub2f5\ubcc0 (\uc218\uc815 \uac00\ub2a5)',correction:'\uc218\uc815 \uc758\uacac\u00b7\ucc38\uace0 \uadfc\uac70',rating:'\ud3c9\uac00',needsReview:'\uac80\ud1a0\uac00 \ud544\uc694\ud574\uc694',helpful:'\ub3c4\uc6c0\uc774 \ub410\uc5b4\uc694',feedbackConsent:'\uc704 \ud53c\ub4dc\ubc31\uc744 \uc6b4\uc601\uc790\uac00 \uc77d\uace0 \uc11c\ube44\uc2a4 \uac1c\uc120\uc5d0 \uac80\ud1a0\ud558\ub294 \ub370 \ubcc4\ub3c4\ub85c \ub3d9\uc758\ud569\ub2c8\ub2e4.',deidentified:'\uc9c8\ubb38\u00b7\ub2f5\ubcc0\u00b7\uc218\uc815 \uc758\uacac\uc5d0\uc11c \uc2dd\ubcc4 \uac00\ub2a5\ud55c \uac1c\uc778\uc815\ubcf4\ub97c \uc81c\uac70\ud588\uc2b5\ub2c8\ub2e4.',feedbackSend:'\uac80\ud1a0 \ub300\uae30\uc5f4\uc5d0 \ubcf4\ub0b4\uae30',promptKnowledge:'무릎이 아픈데 어떤 원인이 있을 수 있어?',promptStudy:'인공심폐기가 뭐야? 일반인이 이해하기 쉽게 설명해줘.',promptImage:'이 이미지에서 보이는 내용을 일반인이 이해하기 쉽게 설명해줘.',emptyHistory:'\uc800\uc7a5\ud55c \ub300\ud654\uac00 \uc5ec\uae30\uc5d0 \ud45c\uc2dc\ub429\ub2c8\ub2e4.',demo:'MEDI',connected:'MEDI 의료 AI',demoNotice:'MEDI는 연결된 의료지식 자료를 우선 활용합니다.',rightsNotice:'\uc790\ub8cc \uc774\uc6a9\uad8c\ud55c\uc744 \uc6b4\uc601\uc790\uac00 \ud655\uc778\ud558\uae30 \uc804\uae4c\uc9c0 \uc678\ubd80 \uc11c\ube44\uc2a4\uc5d0\uc11c\ub294 \uc790\ub8cc \uac80\uc0c9\uc774 \ube44\ud65c\uc131\ud654\ub429\ub2c8\ub2e4.',noAccounts:'\ub85c\uceec \uccb4\ud5d8\uc5d0\uc11c\ub294 \uacc4\uc815 \uc800\uc7a5\uc744 \uc0ac\uc6a9\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. Supabase\ub97c \uc5f0\uacb0\ud558\uba74 \ud68c\uc6d0 \uae30\ub2a5\uc744 \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',loginNeeded:'\ub300\ud654 \uc800\uc7a5 \uae30\ub2a5\uc740 \ub85c\uadf8\uc778 \ud6c4 \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',copy:'\ubcf5\uc0ac',copied:'\ub2f5\ubcc0\uc744 \ubcf5\uc0ac\ud588\uc2b5\ub2c8\ub2e4.',feedback:'\ud53c\ub4dc\ubc31',references:'\ucc38\uace0\ud55c \uc5c5\ub85c\ub4dc \uc790\ub8cc',referenceWarning:'\ucd9c\ucc98\uba85\u00b7\uc5f0\ub3c4\ub294 \ub370\uc774\ud130\uc14b \ud45c\uae30\uc785\ub2c8\ub2e4. \uc6d0\ubb38\u00b7\ucd5c\uc2e0\uc131\u00b7\uc758\ud559\uc801 \uc815\ud655\uc131\uc740 \ubcc4\ub3c4 \uac80\ud1a0\uac00 \ud544\uc694\ud569\ub2c8\ub2e4.',observations:'이미지에서 보이는 점',notSaved:'\uc800\uc7a5\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \uc774 \ub300\ud654\ub97c \ub0b4\ubcf4\ub0b8 \ub4a4 \uc774\ub3d9\ud574 \uc8fc\uc138\uc694.',imageLimit:'\uc774\ubbf8\uc9c0\ub294 \ud55c \ubc88\uc5d0 2\uc7a5, \uac01 5MB\uae4c\uc9c0\uc785\ub2c8\ub2e4.',imageType:'JPG, PNG, WebP \uc774\ubbf8\uc9c0\ub9cc \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',report:'\uac80\uc0ac\uc9c0\u00b7\ud310\ub3c5\ubb38',photo:'\ud53c\ubd80 \ub4f1 \uc678\ubd80 \uc0ac\uc9c4',radiology:'의료영상',delete:'\uc0ad\uc81c',logout:'\ub85c\uadf8\uc544\uc6c3',deleteAccount:'\uacc4\uc815\uacfc \uc800\uc7a5 \ub0b4\uc6a9 \uc0ad\uc81c',deleteConfirm:'\uc774 \ub300\ud654\ub97c \uc0ad\uc81c\ud560\uae4c\uc694? \ubcf5\uad6c\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.',accountConfirm:'\uacc4\uc815\u00b7\ub300\ud654\u00b7\ubcf4\uad00 \uc911\uc778 \ud53c\ub4dc\ubc31\uc744 \uc0ad\uc81c\ud569\ub2c8\ub2e4. \uacc4\uc18d\ud558\ub824\uba74 DELETE MY ACCOUNT\ub97c \uc785\ub825\ud558\uc138\uc694.',stopped:'처리를 중단했습니다.',unsavedConfirm:'\uc800\uc7a5\ub418\uc9c0 \uc54a\uc740 \ub300\ud654\uac00 \uc788\uc2b5\ub2c8\ub2e4. \ub0b4\ubcf4\ub0b4\uae30 \uc5c6\uc774 \uc774\ub3d9\ud560\uae4c\uc694?',checkEmail:'\uc778\uc99d \uba54\uc77c\uc744 \ud655\uc778\ud55c \ub4a4 \ub2e4\uc2dc \ub85c\uadf8\uc778\ud574 \uc8fc\uc138\uc694.',feedbackSuccess:'\uac80\ud1a0 \ub300\uae30\uc5f4\uc5d0 \uc800\uc7a5\ud588\uc2b5\ub2c8\ub2e4. \uc790\ub3d9\uc73c\ub85c \ud559\uc2b5\ub418\uc9c0\ub294 \uc54a\uc2b5\ub2c8\ub2e4.',feedbackLocal:'\ub85c\uceec \uac80\ud1a0 \ud6c4\ubcf4 \ud30c\uc77c\uc744 \ub9cc\ub4e4\uc5c8\uc2b5\ub2c8\ub2e4. \uc11c\ubc84\uc5d0\ub294 \ubcf4\ub0b4\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.',saved:'\uacc4\uc815\uc5d0 \uc800\uc7a5\ub428',temporaryChat:'\uc784\uc2dc \ub300\ud654',emptyExport:'\ub0b4\ubcf4\ub0bc \ub300\ud654\uac00 \uc544\uc9c1 \uc5c6\uc2b5\ub2c8\ub2e4.'
};
const ERR={login_required:T.loginNeeded,invalid_invite:'\ucd08\ub300\ucf54\ub4dc\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.',membership_required:'\ucc98\uc74c \ub85c\uadf8\uc778\ud560 \ub54c \uc720\ud6a8\ud55c \ucd08\ub300\ucf54\ub4dc\ub97c \uc785\ub825\ud574 \uc8fc\uc138\uc694.',rate_limited:'\uc694\uccad\uc774 \ub9ce\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.',daily_limit:'\uc624\ub298\uc758 \uc5f0\uad6c\uc6a9 AI \uc0ac\uc6a9 \ud55c\ub3c4\uc5d0 \ub3c4\ub2ec\ud588\uc2b5\ub2c8\ub2e4.',storage_limit:'\uc800\uc7a5 \ud55c\ub3c4\uc5d0 \ub3c4\ub2ec\ud588\uc2b5\ub2c8\ub2e4. \ubd88\ud544\uc694\ud55c \ub300\ud654\ub97c \uc0ad\uc81c\ud574 \uc8fc\uc138\uc694.',server_busy:'\uc11c\ubc84\uac00 \ub2e4\ub978 \uc694\uccad\uc744 \ucc98\ub9ac \uc911\uc785\ub2c8\ub2e4. \uc790\ub3d9 \uc7ac\uc804\uc1a1\ud558\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.',auth_failed_check_email_and_password:'\uc774\uba54\uc77c\u00b7\ube44\ubc00\ubc88\ud638\u00b7\uc774\uba54\uc77c \uc778\uc99d \uc5ec\ubd80\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.',cloud_unavailable:'\uacc4\uc815 \uc800\uc7a5\uc18c\uc5d0 \uc5f0\uacb0\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.',cloud_request_failed:'\uc800\uc7a5\uc18c \uc124\uc815\uc744 \uc6b4\uc601\uc790\uac00 \ud655\uc778\ud574\uc57c \ud569\ub2c8\ub2e4.',identifiers_detected:'\ud53c\ub4dc\ubc31\uc5d0 \uc5f0\ub77d\ucc98 \ub4f1 \uac1c\uc778\uc815\ubcf4\ub85c \ubcf4\uc774\ub294 \ubb38\uad6c\uac00 \uc788\uc2b5\ub2c8\ub2e4. \uc81c\uac70\ud574 \uc8fc\uc138\uc694.',invalid_image:'\uc774\ubbf8\uc9c0 \ud615\uc2dd\u00b7\ud06c\uae30\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694. 5MB, 1,200\ub9cc \ud654\uc18c \uc774\ud558\uc785\ub2c8\ub2e4.',conversation_full:'\uc774 \ub300\ud654\uac00 \uae38\uc5b4\uc838 \uc0c8 \ub300\ud654\ub97c \uc2dc\uc791\ud574\uc57c \ud569\ub2c8\ub2e4.',invalid_request:'\uc785\ub825 \ud56d\ubaa9\uc758 \ud615\uc2dd\uacfc \uae38\uc774\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.',request_in_progress:'\ub3d9\uc77c\ud55c \uc694\uccad\uc744 \uc774\ubbf8 \ucc98\ub9ac \uc911\uc785\ub2c8\ub2e4.',terms_required:'\uc5f0\uad6c\uc6a9 \uc774\uc6a9 \uc548\ub0b4\uc5d0 \ub3d9\uc758\ud574 \uc8fc\uc138\uc694.',gemini_not_configured:'Gemini 무료 API가 아직 연결되지 않았습니다. Render Environment에 GEMINI_API_KEY를 추가한 뒤 다시 배포해 주세요.',gemini_network:'Gemini 서버 연결이 잠시 불안정합니다. 잠시 후 다시 보내 주세요.',gemini_limit:'Gemini 무료 사용 한도에 잠시 도달했습니다. 한도가 풀린 뒤 다시 시도해 주세요.',gemini_key:'Gemini API 키가 올바르지 않거나 권한이 없습니다. AI Studio에서 새 API 키를 확인해 주세요.',gemini_model:'Gemini 모델 설정을 확인해 주세요. GEMINI_MODEL=gemini-2.5-flash를 권장합니다.',gemini_upstream:'Gemini가 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',gemini_output:'Gemini 답변을 MEDI 형식으로 변환하지 못했습니다. 같은 질문을 다시 보내 주세요.'};
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
function updateLocalAIStatus(){if($('localAiCard'))$('localAiCard').hidden=true;}
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
 if(c.ai_connected){
  $('connection').textContent='MEDI 의료 AI';
  $('connection').title='Gemini 무료 API · '+(c.ai_model||'');
 }else{
  $('connection').textContent='Gemini 연결 필요';
  $('connection').title='Render에 GEMINI_API_KEY를 추가하면 새 답변과 이미지 분석이 활성화됩니다.';
 }
 $('docCount').textContent=(c.knowledge.documents||0).toLocaleString()+'건';
 $('chunkCount').textContent=(c.knowledge.chunks||0).toLocaleString()+'개 검색 조각';
 const notes=[];
 if(!c.knowledge_enabled)notes.push('업로드한 MEDI 의료자료 검색이 현재 비활성화되어 있습니다. 자료 이용권한을 확인한 경우 Render의 DATASET_RIGHTS_CONFIRMED=true로 설정해야 의료자료가 답변에 사용됩니다.');
 $('systemNotice').textContent=notes.join(' ');$('systemNotice').hidden=!notes.length;
 if($('serverAiStatus')){
  if(c.ai_connected){
   const names=(c.ai_backends||[]).map(x=>x==='gemini'?'Gemini':x);
   const backup=names.length>1?' · 자동 예비 연결 '+names.slice(1).join(', '):'';
   const n=c.ai_backend==='gemini'?'Gemini 무료 서버 AI':'무료 서버 AI';
   $('serverAiStatus').textContent=`${n} 연결 설정됨 · ${c.ai_model||''}${backup}`;
  }else $('serverAiStatus').textContent='Gemini 무료 AI 미연결 · Render에 GEMINI_API_KEY를 추가하면 PC·휴대폰에서 답변과 이미지 분석이 가능합니다.';
 }
 if($('knowledgeStatus'))$('knowledgeStatus').textContent=c.knowledge_enabled?`MEDI 의료자료 활성 · ${(c.knowledge.documents||0).toLocaleString()}건`:'MEDI 의료자료 비활성 · DATASET_RIGHTS_CONFIRMED 확인 필요';
 if($('localAiCard'))$('localAiCard').hidden=true;
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
 {keys:['무릎','슬관절','슬개','반월상','십자인대','knee'],src:'/static/visuals/knee_detail.png',title:'무릎은 이런 구조예요',caption:'대퇴골·정강뼈·무릎뼈·연골·반월상연골·십자인대의 위치를 함께 표시했어요.'},
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
 // A diagram is supplemental, never automatic decoration. Show one only when
 // the user explicitly asks to see/understand structure, location, flow or a diagram.
 const visualIntent=['그림','도식','구조','위치','해부','생김새','어떻게 생','흐름','작동 원리','원리 그림','그려','보여줘','어디에'];
 if(!visualIntent.some(k=>text.includes(k)))return null;
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
  if(state.cid&&state.user){
   try{await api('/api/conversations/'+state.cid+'/turns/local',{method:'POST',body:JSON.stringify({request_id:id,question,mode:t.mode,had_images:!!images.length,response:r})});r.saved=true;}
   catch(saveErr){r.saved=false;r.save_warning='answer_not_saved_export_before_leaving';}
  }
  t.response=r;renderTurn(t);$('question').value='';clearImages();updateInput();scrollBottom();if(state.cid)historyList();
 }catch(err){if(mounted){t.error=failure(err);renderTurn(t);}toast(failure(err));if(err.code==='login_required'){state.user=null;openAuth();}}
 finally{clearTimeout(timer);state.controller=null;setBusy(false);setPendingText(T.pending);}
};
$('stopButton').onclick=()=>{if(state.controller)state.controller.abort();else toast('현재 처리 중인 요청이 없습니다.');};
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

## static/app.css

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

## static/index.html

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark"><meta name="robots" content="noindex,nofollow">
<title>MEDI - Medical Research Companion</title>
<link rel="icon" href="/static/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="/static/app.css?v=1001">
<script src="/static/app.js?v=1001" defer></script>
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
<section class="settings-card"><div><strong>MEDI 의료 AI</strong><p id="serverAiStatus" class="subtle">Gemini 연결 상태를 확인하는 중입니다.</p></div><span class="settings-dot" aria-hidden="true"></span></section>
<section class="settings-card"><div><strong>내 의료지식 자료</strong><p id="knowledgeStatus" class="subtle">의료자료 연결 상태를 확인하는 중입니다.</p></div><span class="settings-dot" aria-hidden="true"></span></section>
<section class="settings-card"><div><strong>첫 질문 전 주의 안내</strong><p id="safetySettingText" class="subtle">첫 질문 전에 한 번 표시합니다.</p></div><label class="switch"><input id="safetyToggle" type="checkbox" checked><span></span></label><button id="showSafetyNow" class="quiet-button full" type="button">주의사항 지금 다시 보기</button></section>
<p class="settings-help">Gemini가 연결되면 질문의 뜻을 먼저 해석해 질문마다 새 답변을 만듭니다. MEDI 의료자료는 관련 있을 때 근거로 활용하고, 그림은 구조·위치·원리를 시각적으로 설명하는 데 실제로 도움이 될 때만 표시합니다.</p>
</div><div class="dialog-actions"><button class="primary-button" data-close="settingsDialog">완료</button></div></dialog>
<dialog id="feedbackDialog"><div class="dialog-heading"><h2 data-i18n="feedbackTitle"></h2><button class="icon-button" data-close="feedbackDialog" aria-label="Close">&#215;</button></div><form id="feedbackForm" class="dialog-body"><p class="notice-box" data-i18n="feedbackDescription"></p><label class="field"><span data-i18n="feedbackQuestion"></span><textarea id="feedbackQuestion" maxlength="4000" rows="2" required></textarea></label><label class="field"><span data-i18n="feedbackAnswer"></span><textarea id="feedbackAnswer" maxlength="16000" rows="4" required></textarea></label><label class="field"><span data-i18n="correction"></span><textarea id="correction" maxlength="4000" rows="3"></textarea></label><label class="field"><span data-i18n="rating"></span><select id="rating"><option value="needs_review" data-i18n="needsReview"></option><option value="helpful" data-i18n="helpful"></option></select></label><label class="check-line"><input id="feedbackConsent" type="checkbox" required><span data-i18n="feedbackConsent"></span></label><label class="check-line"><input id="deidentified" type="checkbox" required><span data-i18n="deidentified"></span></label><button id="feedbackSubmit" class="primary-button full" type="submit" data-i18n="feedbackSend"></button><p id="feedbackError" class="inline-error" role="alert"></p></form></dialog>
</body></html>

```

## render.yaml

```text
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
        value: gemini
      - key: MEDI_AI_RETRIES
        value: "2"
      - key: MEDI_AI_TIMEOUT
        value: "90"
      - key: GEMINI_MODEL
        value: gemini-2.5-flash
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

## env.example

```text
DEPLOYMENT_MODE=local
MEDI_AI_PROVIDER=gemini
MEDI_AI_RETRIES=2
MEDI_AI_TIMEOUT=90

# Google AI Studio free-tier API
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

# Accounts/history (required on public Render deployment)
SUPABASE_URL=
SUPABASE_ANON_KEY=
DATA_ENCRYPTION_KEY=
ALLOW_OPEN_SIGNUP=true

# Set true only after verifying that you may use the uploaded dataset in this service.
DATASET_RIGHTS_CONFIRMED=false
OPERATOR_CONTACT=
GUEST_DAILY_LIMIT=8

```
