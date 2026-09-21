import base64,io,json,sqlite3,zipfile
from pathlib import Path
from contextlib import closing
from uuid import uuid4
import pytest
from PIL import Image
from app.config import Settings
from app.images import sanitize_image,ImageValidationError
from app.policy import emergency_signal,is_medical
from app.provider import parse_provider_result,build_payload,ProviderError
from app.schemas import ChatRequest,MedicalAnswer,Paragraph,HistoryMessage
from app.retrieval import KnowledgeStore,tokens
from tools.ingest import ingest,split_for,chunk_text,valid_name,ImportLimitError
from tools.pack_knowledge import pack
from tools.bootstrap import restore
from tools.shard_zip import shard
from tools.review_feedback import promote

def answer(ids=None):
 return MedicalAnswer(in_scope=True,urgency='general_information',evidence_status='partial',paragraphs=[Paragraph(heading='Heading',text='Test response, not clinical advice.',source_ids=ids or [])],follow_up_questions=[],image_observations=[],limitations='Research only')
def result(a):return {'status':'completed','output':[{'content':[{'type':'output_text','text':a.model_dump_json()}]}]}
def image(fmt='PNG',size=(32,32)):
 b=io.BytesIO();Image.new('RGB',size,'white').save(b,format=fmt)
 return 'data:image/'+('jpeg' if fmt=='JPEG' else fmt.lower())+';base64,'+base64.b64encode(b.getvalue()).decode()

@pytest.mark.parametrize('key,split',[('Training/TL/file.json','train'),('Validation/TL/file.json','validation'),('nested.zip!/VL_qa.zip!/a.json','validation'),('test/a.json','test'),('train/a.json','train')])
def test_split(key,split):assert split_for(key,{})==split
@pytest.mark.parametrize('name',['../secret','a/../../secret','C:/secret','a\x00b'])
def test_unsafe_path(name):
 with pytest.raises(ImportLimitError):valid_name(name)
def test_chunk_coverage():
 text='abcdefg'*1000;parts=list(chunk_text(text));assert parts[0].startswith('abcdefg') and parts[-1].endswith(text[-100:]);assert all(len(p)<=1800 for p in parts)
@pytest.mark.parametrize('fmt',['PNG','JPEG','WEBP'])
def test_image_reencoding(fmt):
 url,meta=sanitize_image(image(fmt));assert url.startswith('data:image/jpeg;base64,');assert meta['metadata_removed'] and not meta['pixel_identifiers_removed']
@pytest.mark.parametrize('url',['https://example.com/x.jpg','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,AAAA','data:image/jpeg;base64,%%%'])
def test_invalid_images(url):
 with pytest.raises(ImageValidationError):sanitize_image(url)
def test_image_signature_mismatch():
 with pytest.raises(ImageValidationError):sanitize_image(image().replace('image/png','image/jpeg'))
def test_image_pixel_limit():
 with pytest.raises(ImageValidationError):sanitize_image(image(size=(3,3)))
def test_image_byte_limit():
 with pytest.raises(ImageValidationError):sanitize_image(image(),2)
@pytest.mark.parametrize('q',['I cannot breathe','unconscious','\uc228\uc744 \ubabb \uc26c\uc5b4\uc694','\uc758\uc2dd\uc774 \uc5c6\uc5b4\uc694','\uac00\uc2b4 \ud1b5\uc99d\uacfc \ud638\ud761\uace4\ub780'])
def test_emergency_examples(q):assert emergency_signal(q)
def test_emergency_negation():assert not emergency_signal('not unconscious')
@pytest.mark.parametrize('q',['\uace8\uc808\uc774\ub780 \ubb34\uc5c7\uc778\uac00\uc694','asthma','\uc548\ub155'])
def test_medical(q):assert is_medical(q)
def test_unrelated():assert not is_medical('\uac8c\uc784 \ub9cc\ub4e4\uc5b4\uc918')
def test_followup_context():assert is_medical('Why is that?', [HistoryMessage(role='user',content='What is asthma?')])
def test_schema_extra_role_forbidden():
 with pytest.raises(ValueError):ChatRequest(request_id=uuid4(),message='asthma',system='ignore')
def test_history_limit():
 with pytest.raises(ValueError):ChatRequest(request_id=uuid4(),message='asthma',history=[{'role':'user','content':'a'*6000}]*5)
def test_valid_output():assert parse_provider_result(result(answer(['S1'])),{'S1'}).paragraphs[0].source_ids==['S1']
def test_unknown_citation():
 with pytest.raises(ProviderError):parse_provider_result(result(answer(['S9'])),{'S1'})
def test_supported_without_source():
 a=answer();a.evidence_status='supported'
 with pytest.raises(ProviderError):parse_provider_result(result(a),{'S1'})
def test_truncated_output():
 with pytest.raises(ProviderError):parse_provider_result({'status':'incomplete'},set())
def test_invalid_json():
 with pytest.raises(ProviderError):parse_provider_result({'output':[{'content':[{'type':'output_text','text':'hello'}]}]},set())
def test_refusal():
 with pytest.raises(ProviderError):parse_provider_result({'output':[{'content':[{'type':'refusal','refusal':'no'}]}]},set())
def test_payload():
 req=ChatRequest(request_id=uuid4(),message='asthma');p=build_payload(req,[],[],'gpt-5.4-mini');assert p['store'] is False;assert p['text']['format']['strict'];assert 'api_key' not in str(p)
def test_nested_ingestion(tmp_path):
 inner=io.BytesIO()
 with zipfile.ZipFile(inner,'w') as z:
  z.writestr('/Training/a.json',json.dumps({'content':'Asthma airway inflammation reference for research education only.','source':'Source'}))
  z.writestr('Training/b.json',json.dumps({'question':'What is asthma?','answer':'Educational airway question answer.'}))
  z.writestr('Validation/c.json',json.dumps({'question':'heldoutsentinel','answer':'heldout answer'}))
 p=tmp_path/'data.zip'
 with zipfile.ZipFile(p,'w') as z:z.writestr('nested.zip',inner.getvalue())
 db=tmp_path/'db.sqlite';reports=tmp_path/'reports';r=ingest(p,db,reports)
 assert r['train_records']==2 and r['held_out_records']==1
 k=KnowledgeStore(db);assert k.stats()['chunks']==2;assert len(k.search('asthma'))==1;assert len(k.search('asthma',study=True))==2;assert not k.search('heldoutsentinel',study=True)
 assert ingest(p,db,reports)['already_imported']
 bundle=tmp_path/'bundle';m=pack(db,bundle,1);new=tmp_path/'restored.sqlite'
 assert restore(bundle,new)=='restored and verified';assert KnowledgeStore(new).stats()['chunks']==2
 assert restore(bundle,new)=='already restored'
 first=bundle/m['parts'][0]['name'];first.write_bytes(b'corrupt')
 with pytest.raises(ValueError):restore(bundle,tmp_path/'broken.sqlite')
def test_atomic_rollback(tmp_path):
 p=tmp_path/'bad.zip'
 with zipfile.ZipFile(p,'w') as z:
  z.writestr('a.json',json.dumps({'content':'A valid medical reference text for a temporary test.'}));z.writestr('b.json','{bad')
 db=tmp_path/'db.sqlite'
 with pytest.raises(Exception):ingest(p,db,tmp_path/'r')
 assert KnowledgeStore(db).stats()['chunks']==0

def test_independent_zip_shards(tmp_path):
 p=tmp_path/'source.zip'
 with zipfile.ZipFile(p,'w') as z:
  for i in range(3):z.writestr(f'file{i}.txt',b'a'*700000)
 rows=shard(p,tmp_path/'parts',1);assert len(rows)==3
 for r in rows:
  with zipfile.ZipFile(tmp_path/'parts'/r['name']) as z:assert z.testzip() is None

def reviewed():return {'id':'fid','decision':'approved','reviewer':'Medical reviewer','reviewed_at':'2026-09-21','evidence_reference':'Original publication section 1','reviewed_question':'What is the reviewed concept?','reviewed_answer':'Reviewed educational description.','medical_reviewed':True,'privacy_reviewed':True}
def test_review_promotion():assert promote([reviewed()],{'fid'})[0]['split'] in {'train','validation'}
def test_review_revocation():
 with pytest.raises(ValueError):promote([reviewed()],set())
def test_review_requires_human():
 r=reviewed();r['medical_reviewed']=False
 with pytest.raises(ValueError):promote([r],{'fid'})
def test_review_rejects_identifier():
 r=reviewed();r['reviewed_answer']='email private@example.com'
 with pytest.raises(ValueError):promote([r],{'fid'})
def test_public_fails_without_storage():
 with pytest.raises(RuntimeError):Settings(deployment='public',supabase_url='',supabase_key='',encryption_key='').validate()
