"""Supabase Auth + PostgREST, always using the signed-in user's JWT.

No service-role credential is used by the web app. RLS is also required.
Ciphertext protects DB contents at rest; this is NOT end-to-end encryption.
"""
import json
from uuid import UUID
import httpx
from cryptography.fernet import Fernet, InvalidToken
from app.config import Settings

class CloudError(RuntimeError):
    def __init__(self, code, status=503):
        self.code=code; self.status=status
        super().__init__(code)

class CloudStore:
    def __init__(self, settings: Settings, transport=None):
        self.settings=settings
        self.cipher=Fernet(settings.encryption_key.encode())
        self.client=httpx.AsyncClient(base_url=settings.supabase_url, timeout=15, transport=transport,
                                     follow_redirects=False)
    async def close(self): await self.client.aclose()
    def seal(self, obj):
        return self.cipher.encrypt(json.dumps(obj,ensure_ascii=False).encode()).decode()
    def unseal(self, value):
        try: return json.loads(self.cipher.decrypt(value.encode()))
        except (InvalidToken,ValueError) as e: raise CloudError('encryption_key_mismatch') from e
    async def call(self, method, path, token=None, body=None, params=None):
        headers={'apikey':self.settings.supabase_key,'Content-Type':'application/json'}
        if token: headers['Authorization']='Bearer '+token
        if method in {'POST','PATCH','DELETE'}: headers['Prefer']='return=representation'
        try:
            r=await self.client.request(method,path,headers=headers,json=body,params=params)
        except httpx.HTTPError as e: raise CloudError('cloud_unavailable') from e
        if r.status_code>=400:
            # Never leak SQL errors, passwords, API keys, or submitted medical content.
            if r.status_code==401: raise CloudError('login_required',401)
            if r.status_code==429: raise CloudError('rate_limited',429)
            if '/auth/' in path and r.status_code in {400,422,403}:
                raise CloudError('auth_failed_check_email_and_password',400)
            try: code=r.json().get('message','')
            except ValueError: code=''
            if 'MEDI_MEMBERSHIP' in code: raise CloudError('membership_required',403)
            if 'MEDI_INVITE' in code: raise CloudError('invalid_invite',403)
            if 'MEDI_QUOTA' in code: raise CloudError('daily_limit',429)
            if 'MEDI_STORAGE' in code: raise CloudError('storage_limit',409)
            raise CloudError('cloud_request_failed',503)
        if not r.content: return None
        try: return r.json()
        except ValueError as e: raise CloudError('cloud_invalid_response') from e
    async def login(self,email,password):
        return await self.call('POST','/auth/v1/token',params={'grant_type':'password'},body={'email':email,'password':password})
    async def signup(self,email,password):
        return await self.call('POST','/auth/v1/signup',body={'email':email,'password':password})
    async def refresh(self,refresh):
        return await self.call('POST','/auth/v1/token',params={'grant_type':'refresh_token'},body={'refresh_token':refresh})
    async def user(self,token):
        u=await self.call('GET','/auth/v1/user',token)
        try: UUID(u['id'])
        except (ValueError,KeyError,TypeError) as e: raise CloudError('login_required',401) from e
        return {'id':u['id'],'email':u.get('email','')}
    async def membership(self,token):
        return await self.call('POST','/rest/v1/rpc/medi_has_membership',token,body={})
    async def join(self,token,code):
        return await self.call('POST','/rest/v1/rpc/medi_join_beta',token,body={'invite_code':code})
    async def logout(self,token): await self.call('POST','/auth/v1/logout',token,params={'scope':'local'})
    async def reserve_call(self,token): return await self.call('POST','/rest/v1/rpc/medi_reserve_call',token,body={})
    async def conversations(self,token):
        rows=await self.call('GET','/rest/v1/medi_conversations',token,
            params={'select':'id,title_cipher,created_at','order':'created_at.desc','limit':'60'})
        return [{'id':r['id'],'title':self.unseal(r['title_cipher'])['title'],'created_at':r['created_at']} for r in rows]
    async def require_conversation(self,token,cid):
        rows=await self.call('GET','/rest/v1/medi_conversations',token,params={'id':'eq.'+str(UUID(cid)),'select':'id','limit':'1'})
        if not rows: raise CloudError('conversation_not_found',404)
    async def new_conversation(self,token,uid,cid,title):
        await self.call('POST','/rest/v1/medi_conversations',token,
                        body={'id':cid,'user_id':uid,'title_cipher':self.seal({'title':title[:70]})})
    async def turns(self,token,cid,limit=80):
        await self.require_conversation(token,cid)
        rows=await self.call('GET','/rest/v1/medi_turns',token,
            params={'conversation_id':'eq.'+str(UUID(cid)),'select':'id,payload_cipher,created_at','order':'created_at.desc','limit':str(limit)})
        return [{'id':r['id'],**self.unseal(r['payload_cipher'])} for r in reversed(rows)]
    async def save_turn(self,token,uid,cid,tid,payload):
        await self.call('POST','/rest/v1/medi_turns',token,
            body={'id':tid,'user_id':uid,'conversation_id':cid,'payload_cipher':self.seal(payload)})
    async def delete_conversation(self,token,cid):
        await self.require_conversation(token,cid)
        await self.call('DELETE','/rest/v1/medi_conversations',token,params={'id':'eq.'+str(UUID(cid))})
    async def feedback(self,token,uid,fid,payload):
        await self.call('POST','/rest/v1/medi_feedback',token,
            body={'id':fid,'user_id':uid,'payload_cipher':self.seal(payload),'consent_version':'research-feedback-v1'})
    async def list_feedback(self,token):
        rows=await self.call('GET','/rest/v1/medi_feedback',token,params={'select':'id,created_at','order':'created_at.desc','limit':'100'})
        return rows
    async def delete_feedback(self,token,fid):
        await self.call('DELETE','/rest/v1/medi_feedback',token,params={'id':'eq.'+str(UUID(fid))})
    async def delete_account(self,token):
        await self.call('POST','/rest/v1/rpc/medi_delete_my_account',token,body={})
