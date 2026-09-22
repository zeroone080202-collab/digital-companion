"""Local bilingual lexical retrieval for MEDI.

The index is intentionally offline: no paid embedding API and no outbound
transmission are needed to search the operator's uploaded knowledge. Scores are
retrieval relevance only, never clinical confidence.
"""
from contextlib import closing
import re
import sqlite3
from pathlib import Path

STOP = {
    'what','which','when','does','have','with','this','that','tell','about','please','would','could','and','the','for','are','how','can',
    '알려','주세요','설명','해줘','궁금','대해','알려줘','알려주세요','무엇','어떤','그거','이건','뭐야','쉽게','의학적으로','가요','인가요',
    '너무','정말','많이','조금','좀','계속','자꾸','왜','원인','이유','아파','아픈데','아픕니다','통증이','있어요','있는데','같아요',
    '제가','나는','내가','저는','그리고','또한','혹시','지금','오늘','어제','최근'
}

# Small, auditable concept expansion.  This is not a diagnostic ontology; it
# merely lets everyday Korean wording find medical terms in the uploaded data.
ALIASES = {
    '골절':['fracture','뼈'],
    '당뇨':['diabetes','당뇨병'],
    '고혈압':['hypertension','혈압'],
    '두통':['headache','머리통증'],
    '천식':['asthma'],
    '심근경색':['myocardial infarction','심장'],
    '무릎':['슬관절','관절','knee','슬개','반월상','십자인대'],
    '슬관절':['무릎','knee','관절'],
    '관절통':['관절','통증','arthralgia'],
    '허리':['요통','척추','lumbar','요추'],
    '요통':['허리','lumbar','요추'],
    '어깨':['견관절','shoulder','회전근개'],
    '발목':['족관절','ankle'],
    '손목':['수근관절','wrist'],
    '상처':['창상','wound','열상','찰과상'],
    '붓기':['부종','종창','swelling'],
    '부종':['붓기','종창','swelling'],
    '아파':['통증','pain'], '아픈':['통증','pain'], '통증':['pain'],
    '계단':['보행','체중부하','슬개대퇴','stairs'],
    '열감':['염증','발적'],
    '피부':['피부과','dermatology'],
    '가슴':['흉통','chest pain','심장'],
    '숨':['호흡곤란','dyspnea','호흡'],
    '복통':['배','복부','abdominal pain'],
    'fracture':['골절'], 'diabetes':['당뇨','당뇨병'], 'hypertension':['고혈압'],
    'asthma':['천식'], 'headache':['두통'], 'knee':['무릎','슬관절'],
}

# Common particles/endings that make short symptom queries miss exact concepts
# (e.g. "무릎이" -> "무릎"). We only strip when the stem stays >= 2 chars.
KOREAN_SUFFIXES = (
    '에서는','에게서','으로부터','까지는','부터는','한테서',
    '에서','에게','한테','으로','로는','에는','와는','과는',
    '이랑','랑은','까지','부터','처럼','보다',
    '은','는','이','가','을','를','에','의','도','만','과','와','로'
)


def _surface_words(text: str) -> list[str]:
    return re.findall(r'[a-zA-Z][a-zA-Z0-9-]*|[\uac00-\ud7a3]+|\d+(?:\.\d+)?', text.lower())


def _query_forms(text: str) -> list[str]:
    """Return original query words plus conservative Korean particle stems."""
    out: list[str] = []
    for word in _surface_words(text):
        out.append(word)
        if re.fullmatch(r'[\uac00-\ud7a3]+', word):
            for suffix in KOREAN_SUFFIXES:
                if word.endswith(suffix) and len(word) - len(suffix) >= 2:
                    out.append(word[:-len(suffix)])
                    break
    return list(dict.fromkeys(out))


def tokens(text: str, query: bool = False) -> list[str]:
    words = _query_forms(text) if query else _surface_words(text)
    out: list[str] = []
    for w in words:
        if query and w in STOP:
            continue
        if re.fullmatch(r'[\uac00-\ud7a3]+', w):
            if len(w) == 1:
                continue
            # Prefix keeps Hangul bigrams separate from Latin whole-word tokens.
            out.extend('k' + w[i:i+2] for i in range(len(w)-1))
        elif len(w) > 1:
            out.append(w)
    return list(dict.fromkeys(out))


def _alias_tokens(query: str) -> list[str]:
    low = query.lower()
    extra: list[str] = []
    # Match aliases against both the raw query and particle-stripped forms.
    forms = set(_query_forms(low))
    for key, values in ALIASES.items():
        if key in low or key in forms:
            for value in values:
                extra.extend(tokens(value))
    return list(dict.fromkeys(extra))


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
            return {
                'chunks': con.execute('SELECT count(*) FROM chunks').fetchone()[0],
                'documents': con.execute("SELECT count(DISTINCT dataset_id || ':' || source_key) FROM chunks").fetchone()[0],
                'datasets': con.execute('SELECT count(*) FROM imports').fetchone()[0],
                'by_type': dict(con.execute('SELECT source_type,count(*) FROM chunks GROUP BY source_type')),
                'available': True,
            }

    def search(self, query: str, *, study: bool = False, limit: int = 5) -> list[dict]:
        if not self.path.exists():
            return []

        base = tokens(query, query=True)[:36]
        if not base:
            return []
        aliases = _alias_tokens(query)[:36]
        wanted = list(dict.fromkeys(base + aliases))[:60]
        expression = ' OR '.join('"' + t.replace('"','') + '"' for t in wanted)

        # Train material only. QA is useful medical knowledge too, so it is no
        # longer thrown away in health mode; reference documents merely receive
        # a small preference below. Held-out/validation material stays excluded.
        with closing(open_db(self.path, True)) as con:
            rows = con.execute('''
                SELECT c.*, bm25(search_index) AS rank FROM search_index
                JOIN chunks c ON c.rowid=search_index.rowid
                WHERE search_index MATCH ? AND c.split='train'
                ORDER BY rank LIMIT 180
            ''', (expression,)).fetchall()

        base_set = set(base)
        alias_set = set(aliases)
        scored: list[dict] = []
        for row in rows:
            r = dict(row)
            title_set = set(tokens(r['title'] or ''))
            body_set = set(tokens(r['body'] or ''))
            tset = title_set | body_set
            base_hits = len(base_set & tset)
            alias_hits = len(alias_set & tset)
            title_base_hits = len(base_set & title_set)
            title_alias_hits = len(alias_set & title_set)
            body_base_hits = len(base_set & body_set)
            body_alias_hits = len(alias_set & body_set)

            # Short conversational queries should match either the user's term
            # or a medical synonym. Longer queries still need meaningful overlap.
            if len(base_set) <= 3:
                if base_hits == 0 and alias_hits == 0:
                    continue
            else:
                base_coverage = base_hits / max(1, len(base_set))
                if base_coverage < 0.10 and alias_hits == 0:
                    continue

            # bm25() is usually negative for good matches; abs() keeps this a
            # bounded tie-breaker while explicit term hits dominate.
            lexical = min(abs(float(r['rank'] or 0)), 30.0) / 30.0
            score = (
                title_base_hits * 4.5 + title_alias_hits * 1.8 +
                body_base_hits * 2.2 + body_alias_hits * 0.85 + lexical
            )
            if r['source_type'] != 'qa':
                score += 0.35
            elif study:
                score += 0.35
            else:
                score -= 0.35
            r['_score'] = score
            scored.append(r)

        scored.sort(key=lambda r: r['_score'], reverse=True)

        selected: list[dict] = []
        seen_docs: set[tuple[str,str]] = set()
        seen_hashes: set[str] = set()
        qa_count = 0
        for r in scored:
            group = (r['dataset_id'], r['source_key'])
            # Prefer diverse documents and avoid duplicate chunks. In health
            # mode, keep at most two learning-QA items so general references
            # still anchor the answer.
            if group in seen_docs or r['content_hash'] in seen_hashes:
                continue
            if not study and r['source_type'] == 'qa' and qa_count >= 2:
                continue
            seen_docs.add(group)
            seen_hashes.add(r['content_hash'])
            if r['source_type'] == 'qa':
                qa_count += 1
            selected.append({
                'id': f'S{len(selected)+1}',
                'chunk_id': r['chunk_id'],
                'title': r['title'],
                'source_label': r['source_label'],
                'year': r['year'],
                'source_type': r['source_type'],
                'source_file': r['source_key'],
                'record_id': r['record_id'],
                'excerpt': r['body'],
                'split': r['split'],
                'review_status': 'unreviewed_uploaded_data',
            })
            if len(selected) >= limit:
                break
        return selected
