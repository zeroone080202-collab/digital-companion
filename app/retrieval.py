"""Local bilingual lexical retrieval. Scores are NOT clinical confidence.

FTS5 indexes Korean character bigrams and Latin words; there is no paid
embedding call or outbound transmission during ingestion or retrieval.
"""
from contextlib import closing
import hashlib
import re
import sqlite3
from pathlib import Path

STOP = {'what','which','when','does','have','with','this','that','tell','about','please','would','could','and','the','for','are','how','can',
        '\uc54c\ub824','\uc8fc\uc138\uc694','\uc124\uba85','\ud574\uc918','\uad81\uae08','\ub300\ud574','\uc54c\ub824\uc918','\uc54c\ub824\uc8fc\uc138\uc694','\ubb34\uc5c7','\uc5b4\ub5a4','\uadf8\uac70','\uc774\uac74','\ubb50\uc57c','\uc27d\uac8c','\uc758\ud559\uc801\uc73c\ub85c','\uac00\uc694','\uc778\uac00\uc694'}
ALIASES = {
 '\uace8\uc808':['fracture'], '\ub2f9\ub1e8':['diabetes'], '\uace0\ud608\uc555':['hypertension'],
 '\ub450\ud1b5':['headache'], '\ucc9c\uc2dd':['asthma'], '\uc2ec\uadfc\uacbd\uc0c9':['myocardial infarction'],
 'fracture':['\uace8\uc808'], 'diabetes':['\ub2f9\ub1e8'], 'hypertension':['\uace0\ud608\uc555'],
 'asthma':['\ucc9c\uc2dd'], 'headache':['\ub450\ud1b5']}

def tokens(text: str, query: bool = False) -> list[str]:
    words = re.findall(r'[a-zA-Z][a-zA-Z0-9-]*|[\uac00-\ud7a3]+|\d+(?:\.\d+)?', text.lower())
    out = []
    for w in words:
        if query and w in STOP:
            continue
        if re.fullmatch(r'[\uac00-\ud7a3]+', w):
            if len(w) == 1:
                continue
            # Prefixes keep Hangul bigrams distinct from whole-word tokens.
            out.extend('k' + w[i:i+2] for i in range(len(w)-1))
        elif len(w) > 1:
            out.append(w)
    return out

def open_db(path: Path, readonly: bool = False) -> sqlite3.Connection:
    if readonly:
        con = sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True, timeout=10)
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        con = sqlite3.connect(path, timeout=30)
    con.row_factory = sqlite3.Row
    return con

def create_schema(con: sqlite3.Connection):
    con.executescript('''
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS chunks (
      rowid INTEGER PRIMARY KEY, chunk_id TEXT UNIQUE NOT NULL,
      dataset_id TEXT NOT NULL, source_key TEXT NOT NULL, record_id TEXT,
      source_type TEXT NOT NULL, split TEXT NOT NULL, language TEXT,
      title TEXT NOT NULL, source_label TEXT, year TEXT,
      body TEXT NOT NULL, content_hash TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS ix_chunk_dataset ON chunks(dataset_id);
    CREATE INDEX IF NOT EXISTS ix_chunk_hash ON chunks(content_hash,source_type,split);
    CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(terms, content='');
    CREATE TABLE IF NOT EXISTS imports (
      dataset_id TEXT PRIMARY KEY, name TEXT, sha256 TEXT, completed_at TEXT, report TEXT);
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    ''')
    con.commit()

class KnowledgeStore:
    def __init__(self, path: Path):
        self.path = path

    def stats(self) -> dict:
        if not self.path.exists():
            return {'chunks':0,'documents':0,'datasets':0,'by_type':{},'available':False}
        with closing(open_db(self.path, True)) as con:
            return {'chunks':con.execute('SELECT count(*) FROM chunks').fetchone()[0],
                    'documents':con.execute("SELECT count(DISTINCT dataset_id || ':' || source_key) FROM chunks").fetchone()[0],
                    'datasets':con.execute('SELECT count(*) FROM imports').fetchone()[0],
                    'by_type':dict(con.execute('SELECT source_type,count(*) FROM chunks GROUP BY source_type')),
                    'available':True}

    def search(self, query: str, *, study: bool = False, limit: int = 5) -> list[dict]:
        if not self.path.exists():
            return []
        base = list(dict.fromkeys(tokens(query, query=True)))[:32]
        if not base:
            return []
        extra = []
        for key, values in ALIASES.items():
            if key in query.lower():
                for v in values:
                    extra.extend(tokens(v))
        wanted = list(dict.fromkeys(base + extra))[:44]
        expression = ' OR '.join('"' + t.replace('"','') + '"' for t in wanted)
        type_filter = '' if study else " AND c.source_type != 'qa'"
        with closing(open_db(self.path, True)) as con:
            rows = con.execute(f'''
                SELECT c.*, bm25(search_index) AS rank FROM search_index
                JOIN chunks c ON c.rowid=search_index.rowid
                WHERE search_index MATCH ? AND c.split='train' {type_filter}
                ORDER BY rank LIMIT 100''', (expression,)).fetchall()
        scored = []
        qset = set(base)
        for row in rows:
            r = dict(row)
            tset = set(tokens(r['title'] + ' ' + r['body']))
            coverage = len(qset & tset) / len(qset)
            if coverage < (0.12 if len(qset)>6 else 0.24):
                continue
            # Prefer textual references in health mode; diverse documents later.
            r['_score'] = coverage * 4 + min(abs(r['rank']), 30) / 30
            if study and r['source_type'] == 'qa':
                r['_score'] += 0.1
            scored.append(r)
        scored.sort(key=lambda r:r['_score'], reverse=True)
        selected=[]; seen=set()
        for r in scored:
            group=(r['dataset_id'],r['source_key'])
            if group in seen:
                continue
            seen.add(group)
            selected.append({
                'id':f'S{len(selected)+1}', 'chunk_id':r['chunk_id'],
                'title':r['title'], 'source_label':r['source_label'],
                'year':r['year'], 'source_type':r['source_type'],
                'source_file':r['source_key'], 'record_id':r['record_id'],
                'excerpt':r['body'], 'split':r['split'],
                'review_status':'unreviewed_uploaded_data'})
            if len(selected)>=limit:
                break
        return selected
