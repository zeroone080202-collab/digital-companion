import json
from pathlib import Path
from uuid import uuid4
import httpx,pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.config import Settings
from app.cloud import CloudStore,CloudError
from app.provider import generate,ProviderError
from app.schemas import ChatRequest
from app.policy import fixed_answer
from cryptography.fernet import Fernet

H={'X-Medi-Client':'web'}
def cfg(tmp_path,**kw):
 defaults={'deployment':'local','database':tmp_path/'no-db','api_key':'','supabase_url':'','supabase_key':'','encryption_key':'','allowed_hosts':('testserver','localhost')}
 return Settings(**{**defaults,**kw})
def message(**kw):return {'request_id':str(uuid4()),'message':'What is asthma?','consent':True,**kw}

def test_local_chat_and_replay(tmp_path):
 with TestClient(create_app(cfg(tmp_path))) as c:
  p=message();r=c.post('/api/chat',headers=H,json=p);assert r.status_code==200;d=r.json();assert d['provider']=='retrieval_demo' and not d['learning_applied']
  assert c.post('/api/chat',headers=H,json=p).json()==d
  p['message']='Different question';assert c.post('/api/chat',headers=H,json=p).status_code==409

def test_scope_and_radiology(tmp_path):
 with TestClient(create_app(cfg(tmp_path))) as c:
  r=c.post('/api/chat',headers=H,json=message(message='\uac8c\uc784 \ucf54\ub4dc \uc8fc\uc138\uc694'));assert not r.json()['answer']['in_scope']
  r=c.post('/api/chat',headers=H,json=message(images=[{'data_url':'invalid','kind':'radiology'}]));assert r.status_code==200 and r.json()['provider']=='guardrail'
  r=c.post('/api/chat',headers=H,json=message(message='I cannot breathe',images=[{'data_url':'invalid','kind':'photo'}]));assert r.json()['answer']['urgency']=='emergency'

def test_guardrails_before_provider(tmp_path):
 async def should_not_run(*a):raise AssertionError('Should not call the paid API')
 with TestClient(create_app(cfg(tmp_path,api_key='fake'),generator=should_not_run)) as c:
  assert c.post('/api/chat',headers=H,json=message(message='I cannot breathe')).json()['provider']=='guardrail'

def test_security_headers(tmp_path):
 with TestClient(create_app(cfg(tmp_path))) as c:
  r=c.get('/');assert r.status_code==200 and 'default-src' in r.headers['Content-Security-Policy'];assert 'unsafe-inline' not in r.headers['Content-Security-Policy']
  assert c.get('/api/config').headers['cache-control']=='no-store'
  assert c.post('/api/chat',json=message()).status_code==403
  assert c.post('/api/chat',headers={**H,'Origin':'https://attacker.example'},json=message()).status_code==403
  assert c.get('/api/health',headers={'Host':'attacker.example'}).status_code==400
  assert c.get('/static/../.env').status_code==404

def test_consent_and_validation(tmp_path):
 with TestClient(create_app(cfg(tmp_path))) as c:
  assert c.post('/api/chat',headers=H,json=message(consent=False)).status_code==400
  r=c.post('/api/chat',headers=H,json=message(message='secret-value'*1000));assert r.status_code==422;assert 'secret-value' not in r.text
  assert c.post('/api/chat',headers=H,json=message(images=[{'data_url':'bad','kind':'photo'}])).status_code==400

def test_body_limit(tmp_path):
 with TestClient(create_app(cfg(tmp_path,max_body_bytes=100))) as c:
  assert c.post('/api/chat',headers=H,content='x'*101).status_code==413

def test_limiter(tmp_path):
 with TestClient(create_app(cfg(tmp_path,requests_per_minute=2))) as c:
  assert c.post('/api/chat',headers=H,json=message()).status_code==200
  assert c.post('/api/chat',headers=H,json=message()).status_code==200
  assert c.post('/api/chat',headers=H,json=message()).status_code==429

class FakeCloud:
 def __init__(self,settings):self.convos={};self.feedbacks={};self.reserve=0
 async def close(self):pass
 async def user(self,t):
  if t not in {'alice','bob'}:raise CloudError('login_required',401)
  return {'id':t,'email':t+'@example.com'}
 async def membership(self,t):return True
 async def reserve_call(self,t):self.reserve+=1;return {'user_calls':self.reserve}
 async def new_conversation(self,t,u,c,title):self.convos[c]={'owner':t,'turns':[]}
 async def require_conversation(self,t,c):
  if c not in self.convos or self.convos[c]['owner']!=t:raise CloudError('conversation_not_found',404)
 async def turns(self,t,c,limit=80):await self.require_conversation(t,c);return self.convos[c]['turns'][-limit:]
 async def save_turn(self,t,u,c,tid,p):await self.require_conversation(t,c);self.convos[c]['turns'].append({'id':tid,**p})
 async def conversations(self,t):return [{'id':k,'title':'saved'} for k,v in self.convos.items() if v['owner']==t]
 async def delete_conversation(self,t,c):await self.require_conversation(t,c);del self.convos[c]
 async def feedback(self,t,u,f,p):self.feedbacks[f]={'owner':t,'payload':p}
 async def list_feedback(self,t):return [{'id':f} for f,r in self.feedbacks.items() if r['owner']==t]
 async def delete_feedback(self,t,f):
  if f in self.feedbacks and self.feedbacks[f]['owner']==t:del self.feedbacks[f]
 async def delete_account(self,t):
  self.convos={k:v for k,v in self.convos.items() if v['owner']!=t};self.feedbacks={k:v for k,v in self.feedbacks.items() if v['owner']!=t}
 async def logout(self,t):pass

def test_account_isolation_and_persistence_contract(tmp_path):
 conf=cfg(tmp_path,supabase_url='https://test.supabase.co',supabase_key='anon',encryption_key=Fernet.generate_key().decode())
 with TestClient(create_app(conf,cloud_factory=FakeCloud)) as c:
  assert c.post('/api/chat',headers=H,json=message()).status_code==200
  c.cookies.set('medi_access','alice');cid=c.post('/api/conversations',headers=H,json={'title':'Test'}).json()['id']
  p=message(conversation_id=cid);r=c.post('/api/chat',headers=H,json=p);assert r.json()['saved'];assert len(c.get('/api/conversations/'+cid).json()['turns'])==1
  c.cookies.set('medi_access','bob');assert c.get('/api/conversations/'+cid).status_code==404
  assert c.delete('/api/conversations/'+cid,headers=H).status_code==404
  assert c.post('/api/chat',headers=H,json=message(conversation_id=cid)).status_code==404
  c.cookies.set('medi_access','alice');assert c.delete('/api/conversations/'+cid,headers=H).status_code==200

def test_feedback_consent_identifiers(tmp_path):
 conf=cfg(tmp_path,supabase_url='https://test.supabase.co',supabase_key='anon',encryption_key=Fernet.generate_key().decode())
 with TestClient(create_app(conf,cloud_factory=FakeCloud)) as c:
  c.cookies.set('medi_access','alice');p={'turn_id':str(uuid4()),'question':'asthma','answer':'test','rating':'needs_review','consent':False,'deidentified_ack':False}
  assert c.post('/api/feedback',headers=H,json=p).status_code==400
  p.update(consent=True,deidentified_ack=True,question='person@example.com');assert c.post('/api/feedback',headers=H,json=p).status_code==400
  p['question']='asthma';r=c.post('/api/feedback',headers=H,json=p);assert r.status_code==200;assert not r.json()['automatically_trained']
  assert len(c.get('/api/feedback').json()['feedback'])==1
  fid=r.json()['id'];assert c.delete('/api/feedback/'+fid,headers=H).status_code==200
  assert not c.get('/api/feedback').json()['feedback']

def test_cloud_encrypt_and_user_jwt(tmp_path):
 import asyncio
 async def go():
  requests=[]
  def handler(req):requests.append(req);return httpx.Response(200,json=[])
  st=CloudStore(cfg(tmp_path,supabase_url='https://test.supabase.co',supabase_key='public-key',encryption_key=Fernet.generate_key().decode()),transport=httpx.MockTransport(handler))
  ciphertext=st.seal({'question':'private-asthma'});assert 'private-asthma' not in ciphertext;assert st.unseal(ciphertext)['question']=='private-asthma'
  await st.conversations('user-token');assert requests[0].headers['authorization']=='Bearer user-token';assert requests[0].headers['apikey']=='public-key';await st.close()
 asyncio.run(go())

@pytest.mark.parametrize('status,code',[(401,'api_key'),(403,'model_access'),(404,'model_access'),(429,'quota'),(500,'upstream')])
def test_upstream_errors(tmp_path,status,code):
 import asyncio
 async def go():
  with pytest.raises(ProviderError) as e:
   await generate(ChatRequest(request_id=uuid4(),message='asthma'),[],[],cfg(tmp_path,api_key='fake'),transport=httpx.MockTransport(lambda r:httpx.Response(status,json={})))
  assert e.value.code==code
 asyncio.run(go())


def test_provider_success_mocked_transport(tmp_path):
 import asyncio
 from app.schemas import MedicalAnswer,Paragraph
 expected=MedicalAnswer(in_scope=True,urgency='unknown',evidence_status='insufficient',paragraphs=[Paragraph(heading='Limitations',text='This is a transport fixture, not medical advice.',source_ids=[])],follow_up_questions=[],image_observations=[],limitations='Research fixture')
 def handler(req):
  data=json.loads(req.content)
  assert data['store'] is False and data['text']['format']['strict'] is True
  assert req.headers['authorization']=='Bearer fake'
  return httpx.Response(200,json={'status':'completed','output':[{'type':'message','content':[{'type':'output_text','text':expected.model_dump_json()}]}]})
 answer=asyncio.run(generate(ChatRequest(request_id=uuid4(),message='What is asthma?'),[],[],cfg(tmp_path,api_key='fake'),transport=httpx.MockTransport(handler)))
 assert answer==expected

def test_image_report_pipeline_mocked_generator(tmp_path):
 import base64,io
 from PIL import Image
 from app.schemas import MedicalAnswer,Paragraph
 b=io.BytesIO();Image.new('RGB',(40,40)).save(b,'PNG')
 calls=[]
 async def gen(request,sources,images,settings):
  assert images[0].startswith('data:image/jpeg;base64,');calls.append(request.message)
  return MedicalAnswer(in_scope=True,urgency='unknown',evidence_status='insufficient',paragraphs=[Paragraph(heading='Image test',text='Synthetic fixture; no clinical inference.',source_ids=[])],follow_up_questions=[],image_observations=['Synthetic test image only.'],limitations='Not clinical analysis.')
 with TestClient(create_app(cfg(tmp_path,api_key='fake'),generator=gen)) as c:
  p=message(images=[{'name':'private-name.png','data_url':'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode(),'kind':'report'}])
  r=c.post('/api/chat',headers=H,json=p);assert r.status_code==200
  assert r.json()['provider']=='openai' and r.json()['image_bytes_stored'] is False
  assert 'private-name.png' not in r.text and len(calls)==1
  assert c.post('/api/chat',headers=H,json=p).status_code==200 and len(calls)==1

def test_public_requires_membership(tmp_path):
 class NoMember(FakeCloud):
  async def membership(self,t):return False
 conf=cfg(tmp_path,deployment='public',invite_code='long-random-invite-code',supabase_url='https://test.supabase.co',supabase_key='anon',encryption_key=Fernet.generate_key().decode())
 with TestClient(create_app(conf,cloud_factory=NoMember)) as c:
  c.cookies.set('medi_access','alice')
  assert c.post('/api/chat',headers=H,json=message()).status_code==200
  assert c.get('/api/config').json()['knowledge_enabled'] is False
