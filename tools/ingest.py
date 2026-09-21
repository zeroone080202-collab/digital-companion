"""Bounded, resumable-by-transaction ingestion of nested ZIP/JSON/JSONL/TXT.

Validation/test records never enter the live index. Imports are idempotent
by archive SHA256. No extraction, network request, embedding call, or model
training happens here. A full file import commits atomically.
"""
from __future__ import annotations
import argparse
from collections import Counter
from datetime import datetime, timezone
from contextlib import closing
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import sqlite3
import sys
import tempfile
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.retrieval import open_db, create_schema, tokens

MAX_TEXT_BYTES=64*1024*1024
MAX_NESTED_BYTES=1024*1024*1024
MAX_TOTAL_BYTES=8*1024*1024*1024
MAX_MEMBERS=1_000_000

class ImportLimitError(ValueError): pass

def file_digest(path: Path) -> str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

def valid_name(name: str) -> str:
    # Leading '/' occurs in the supplied source archive; read it as a logical
    # name only. Nothing from this path is ever extracted to the filesystem.
    clean=name.replace('\\','/').lstrip('/')
    if '..' in PurePosixPath(clean).parts or re.match(r'^[A-Za-z]:',clean) or '\x00' in clean:
        raise ImportLimitError('Unsafe ZIP member path')
    return clean

def iter_files(path: Path):
    budget={'bytes':0,'members':0}
    def archive(z, prefix='', depth=0):
        if depth>4: raise ImportLimitError('Nested ZIP depth exceeds 4')
        for item in z.infolist():
            if item.is_dir(): continue
            name=valid_name(item.filename)
            budget['members']+=1
            if budget['members']>MAX_MEMBERS: raise ImportLimitError('Too many members')
            if item.flag_bits & 1: raise ImportLimitError('Encrypted ZIP is unsupported')
            if (item.external_attr >> 16) & 0o170000 == 0o120000: continue
            key=prefix+name
            suffix=Path(name).suffix.lower()
            if suffix=='.zip':
                if item.file_size>MAX_NESTED_BYTES: raise ImportLimitError('Nested ZIP too large')
                with z.open(item) as src, tempfile.SpooledTemporaryFile(max_size=16*1024*1024) as tmp:
                    total=0
                    for block in iter(lambda:src.read(1024*1024),b''):
                        total+=len(block); budget['bytes']+=len(block)
                        if total>MAX_NESTED_BYTES or budget['bytes']>MAX_TOTAL_BYTES:
                            raise ImportLimitError('Uncompressed archive limit exceeded')
                        tmp.write(block)
                    tmp.seek(0)
                    with zipfile.ZipFile(tmp) as child:
                        yield from archive(child,key+'!/',depth+1)
            elif suffix in {'.json','.jsonl','.txt','.md'}:
                if item.file_size>MAX_TEXT_BYTES: raise ImportLimitError('Split text records into smaller JSONL shards')
                with z.open(item) as src: b=src.read(MAX_TEXT_BYTES+1)
                budget['bytes']+=len(b)
                if len(b)>MAX_TEXT_BYTES or budget['bytes']>MAX_TOTAL_BYTES:
                    raise ImportLimitError('Text import limit exceeded')
                yield key,b
    if path.suffix.lower()=='.zip':
        with zipfile.ZipFile(path) as z: yield from archive(z)
    else:
        if path.stat().st_size>MAX_TEXT_BYTES: raise ImportLimitError('Text file too large; shard it first')
        yield path.name,path.read_bytes()

def split_for(key: str, obj: dict) -> str:
    low=key.lower().replace('\\','/')
    explicit=str(obj.get('split','')).lower()
    if explicit in {'validation','valid','val','test','evaluation'}: return 'validation' if explicit!='test' else 'test'
    parts=re.split(r'[/!]',low)
    if any(p in {'validation','valid','val','test','evaluation'} for p in parts):
        return 'test' if 'test' in parts else 'validation'
    if any(p.startswith(('vl_','vs_')) for p in parts): return 'validation'
    return 'train'

def decode_records(key, raw):
    text=raw.decode('utf-8-sig')
    suffix=Path(key).suffix.lower()
    if suffix=='.jsonl':
        for i,line in enumerate(text.splitlines(),1):
            if line.strip(): yield str(i),json.loads(line)
    elif suffix=='.json':
        obj=json.loads(text)
        if isinstance(obj,list):
            for i,x in enumerate(obj): yield str(i),x
        elif isinstance(obj,dict) and isinstance(obj.get('records'),list):
            for i,x in enumerate(obj['records']): yield str(i),x
        else: yield '',obj
    else:
        yield '',{'content':text,'source_spec':Path(key).name}

def normalize_record(obj: dict, key: str):
    if not isinstance(obj,dict): return None
    if isinstance(obj.get('question'),str) and isinstance(obj.get('answer'),str):
        body='[\ud559\uc2b5\uc6a9 \ubb38\ud56d]\n'+obj['question'].strip()+'\n\n[\ub370\uc774\ud130\uc14b \uc815\ub2f5]\n'+obj['answer'].strip()
        kind='qa'; title=obj['question'].strip().replace('\n',' ')[:110]
        label='\uc5c5\ub85c\ub4dc \ud559\uc2b5 QA'; rid=obj.get('qa_id',obj.get('id',''))
    else:
        body=obj.get('content',obj.get('text',obj.get('body','')))
        if not isinstance(body,str) or len(body.strip())<20: return None
        body=body.strip(); kind='reference'
        title=str(obj.get('title') or body.split('\n')[0][:100])
        label=str(obj.get('source_spec',obj.get('source','\uc5c5\ub85c\ub4dc \uc790\ub8cc')))
        rid=obj.get('c_id',obj.get('id',''))
    year=str(obj.get('creation_year',obj.get('year','')))
    if year.lower() in {'null','none'}: year=''
    return {'body':body,'source_type':kind,'title':title,'source_label':label[:180],
            'record_id':str(rid),'year':year[:40],
            'language':'ko' if len(re.findall(r'[\uac00-\ud7a3]',body))>len(body)*.08 else 'en',
            'split':split_for(key,obj)}

def chunk_text(text: str, size=1800, overlap=180):
    if size<=overlap: raise ValueError('Chunk size must exceed overlap')
    start=0
    while start<len(text):
        end=min(start+size,len(text))
        if end<len(text):
            # Do not discard text; prefer nearby sentence boundaries.
            boundary=max(text.rfind('\n',start+size//2,end),text.rfind('. ',start+size//2,end))
            if boundary>start: end=boundary+1
        piece=text[start:end].strip()
        if piece: yield piece
        if end>=len(text): break
        start=end-overlap


def ingest(path: Path, database: Path, report_dir: Path):
    path=path.resolve()
    digest=file_digest(path); did=digest[:24]
    report_dir.mkdir(parents=True,exist_ok=True)
    with closing(open_db(database)) as con:
        create_schema(con)
        existing=con.execute('SELECT report FROM imports WHERE dataset_id=?',(did,)).fetchone()
        if existing: return {'already_imported':True,**json.loads(existing['report'])}
        report={'archive':path.name,'sha256':digest,'dataset_id':did,'files':0,'records':0,
                'train_records':0,'held_out_records':0,'chunks_added':0,'duplicates_skipped':0,
                'unsupported_records':0,'errors':[], 'by_type':Counter(),'by_language':Counter(),
                'year_counts':Counter(),'held_out_used_in_search':False,
                'content_review':'Not clinically reviewed; original-source fidelity and rights unverified.'}
        con.execute('BEGIN IMMEDIATE')
        heldout_temp=report_dir/(did+'.heldout.jsonl.tmp')
        try:
            with heldout_temp.open('w',encoding='utf-8') as heldout:
                for key,b in iter_files(path):
                    report['files']+=1
                    try:
                        for idx,obj in decode_records(key,b):
                            r=normalize_record(obj,key)
                            if r is None:
                                report['unsupported_records']+=1; continue
                            report['records']+=1
                            if r['split']!='train':
                                report['held_out_records']+=1
                                heldout.write(json.dumps({'source':key,'record':obj},ensure_ascii=False)+'\n')
                                continue
                            report['train_records']+=1
                            report['by_type'][r['source_type']]+=1
                            report['by_language'][r['language']]+=1
                            report['year_counts'][r['year'] or 'unknown']+=1
                            source_key=key+('#'+idx if idx else '')
                            for j,body in enumerate(chunk_text(r['body'])):
                                bh=hashlib.sha256(body.encode()).hexdigest()
                                if con.execute('SELECT 1 FROM chunks WHERE content_hash=? AND source_type=? AND split=? LIMIT 1',(bh,r['source_type'],'train')).fetchone():
                                    report['duplicates_skipped']+=1; continue
                                cid=hashlib.sha256((did+source_key+str(j)+bh).encode()).hexdigest()[:28]
                                cur=con.execute('''INSERT INTO chunks(chunk_id,dataset_id,source_key,record_id,source_type,split,language,title,source_label,year,body,content_hash)
                                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?)''',
                                   (cid,did,source_key,r['record_id'],r['source_type'],'train',r['language'],r['title'],r['source_label'],r['year'],body,bh))
                                term_text=' '.join(tokens(r['title']+' '+body))
                                con.execute('INSERT INTO search_index(rowid,terms) VALUES(?,?)',(cur.lastrowid,term_text))
                                report['chunks_added']+=1
                    except (UnicodeDecodeError,json.JSONDecodeError) as e:
                        # Abort rather than silently indexing an incomplete file.
                        raise ValueError('Invalid data record at '+key) from e
                    if report['files']%10000==0:
                        print(json.dumps({'processed_files':report['files'],'chunks':report['chunks_added']}),flush=True)
            report['completed_at']=datetime.now(timezone.utc).isoformat()
            con.execute('INSERT INTO imports VALUES(?,?,?,?,?)',(did,path.name,digest,report['completed_at'],json.dumps(report,ensure_ascii=False)))
            con.commit()
            heldout_temp.replace(report_dir/(did+'.heldout.jsonl'))
            con.execute("INSERT INTO search_index(search_index) VALUES('optimize')")
            con.commit()
            con.execute('PRAGMA wal_checkpoint(TRUNCATE)')
        except BaseException:
            con.rollback(); heldout_temp.unlink(missing_ok=True); raise
    (report_dir/(did+'.import.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    return report

if __name__=='__main__':
    root=Path(__file__).resolve().parents[1]
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('inputs',nargs='+',type=Path)
    parser.add_argument('--db',type=Path,default=root/'data/knowledge.sqlite')
    parser.add_argument('--reports',type=Path,default=root/'reports')
    args=parser.parse_args()
    for path in args.inputs:
        if path.is_dir():
            files=sorted(p for p in path.rglob('*') if p.is_file() and p.suffix.lower() in {'.zip','.json','.jsonl','.txt','.md'})
        else: files=[path]
        for item in files:
            print(json.dumps(ingest(item,args.db,args.reports),ensure_ascii=False,indent=2))
