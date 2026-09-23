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
                'ai_mode':'gemini_server' if (cfg.configured_backends) else 'gemini_not_configured',
                'ai_backend':backend,'ai_backends':list(cfg.configured_backends),
                'ai_connected':bool(cfg.configured_backends),'ai_model':model,
                'local_model':None,
                'knowledge':app.state.stats,'knowledge_enabled':not cfg.public or cfg.dataset_rights_confirmed,
                'dataset_rights_confirmed':cfg.dataset_rights_confirmed,
                'invite_required':False,'guest_chat':True,'max_image_mb':5,'max_images':2,
                'learning':'consented_feedback_then_human_review','radiology_enabled':bool(cfg.image_ai_available),
                'image_understanding_enabled':bool(cfg.image_ai_available),
                'provider_failover':cfg.provider_failover,'ai_retries':cfg.ai_request_retries,
                'operator_contact':cfg.operator_contact}

    @app.get('/api/ai/status')
    async def ai_status():
        connected=bool(cfg.gemini_api_key)
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
                if data.images and cfg.image_ai_available:
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
