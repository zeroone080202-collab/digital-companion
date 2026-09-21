"""Offline, human-reviewed feedback workflow. Never runs on Render automatically.

export: copy consented pending feedback to an operator-only workstation.
promote: recheck consent existence and emit reviewed knowledge candidates.
No model is trained and no live index is changed by this script.
"""
import argparse,json,os,re,hashlib
from pathlib import Path
from datetime import datetime,timezone
import httpx
from cryptography.fernet import Fernet
from dotenv import load_dotenv

PII=re.compile(r'\b\d{6}[- ]?[1-4]\d{6}\b|\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}')

def remote_rows():
    load_dotenv(override=False)
    url=os.environ['SUPABASE_URL'].rstrip('/')
    secret=os.environ['REVIEW_SUPABASE_SERVICE_KEY']
    if not url.startswith('https://'):raise ValueError('HTTPS required')
    cipher=Fernet(os.environ['DATA_ENCRYPTION_KEY'].encode())
    headers={'apikey':secret}
    if secret.startswith('eyJ'):headers['Authorization']='Bearer '+secret
    rows=[]
    with httpx.Client(base_url=url,headers=headers,timeout=30,follow_redirects=False) as client:
        for offset in range(0,100000,500):
            r=client.get('/rest/v1/medi_feedback',params={'select':'id,payload_cipher,consent_version,created_at','order':'created_at.asc,id.asc','limit':'500','offset':str(offset)})
            r.raise_for_status();batch=r.json()
            for row in batch:
                payload=json.loads(cipher.decrypt(row.pop('payload_cipher').encode()))
                if row['consent_version']=='research-feedback-v1' and payload.get('consent') is True and payload.get('deidentified_ack') is True:
                    rows.append({**row,'payload':payload})
            if len(batch)<500:return rows
    raise RuntimeError('Export too large; implement cursor-based paging before continuing')

def promote(reviewed,live_ids):
    out=[]
    for row in reviewed:
        if row.get('decision')!='approved':continue
        if row.get('id') not in live_ids:raise ValueError('Feedback withdrawn or not accessible: '+str(row.get('id')))
        for field in ['reviewer','reviewed_at','evidence_reference','reviewed_question','reviewed_answer']:
            if not isinstance(row.get(field),str) or not row[field].strip():raise ValueError('Missing human review field: '+field)
        if row.get('medical_reviewed') is not True or row.get('privacy_reviewed') is not True:raise ValueError('Medical and privacy review required')
        if PII.search(row['reviewed_question']+' '+row['reviewed_answer']):raise ValueError('Possible identifiers remain; inspect manually')
        # Do not reuse users' raw answers as ground truth; require a corrected answer.
        digest=hashlib.sha256(row['reviewed_question'].strip().encode()).hexdigest()
        heldout=int(digest[:8],16)%5==0
        out.append({'id':'review-'+row['id'],'title':row['reviewed_question'],
          'content':row['reviewed_question']+'\n\n'+row['reviewed_answer']+'\n\nEvidence: '+row['evidence_reference'],
          'source':'Operator reviewed feedback; verify original evidence','year':row['reviewed_at'][:4],
          'split':'validation' if heldout else 'train',
          'reviewer':row['reviewer'],'feedback_id':row['id']})
    return out

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='cmd',required=True)
    e=sub.add_parser('export');e.add_argument('--out',type=Path,required=True)
    a=sub.add_parser('promote');a.add_argument('--reviewed',type=Path,required=True);a.add_argument('--out',type=Path,required=True);a.add_argument('--attest-human-review',action='store_true',required=True)
    args=p.parse_args();rows=remote_rows()
    if args.cmd=='export':
        export=[{**r,'decision':'pending','reviewer':'','reviewed_at':'','medical_reviewed':False,'privacy_reviewed':False,
                 'evidence_reference':'','reviewed_question':'','reviewed_answer':''} for r in rows]
        args.out.write_text(json.dumps(export,ensure_ascii=False,indent=2),encoding='utf-8')
        try:args.out.chmod(0o600)
        except OSError:pass
        print(f'Exported {len(export)} pending items. Contains confidential content; do not commit.')
    else:
        reviewed=json.loads(args.reviewed.read_text(encoding='utf-8'));out=promote(reviewed,{r['id'] for r in rows})
        args.out.write_text(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in out),encoding='utf-8')
        print(f'Created {len(out)} candidates with a deterministic held-out split. Live index/model unchanged.')
