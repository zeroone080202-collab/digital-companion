"""Restore an immutable knowledge snapshot during build, never from user URLs."""
from contextlib import closing
from pathlib import Path
import argparse,gzip,hashlib,json,os,sqlite3,tempfile

def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()

def restore(bundle,database,force=False):
    bundle=Path(bundle).resolve();database=Path(database)
    m=json.loads((bundle/'manifest.json').read_text())
    if m.get('format')!=1 or m.get('codec')!='gzip' or not 0<m['uncompressed_bytes']<8*1024**3:raise ValueError('Invalid manifest')
    if database.exists() and not force:
        if sha(database)==m['sha256']:return 'already restored'
        raise ValueError('Database differs from bundle. Preserve/repack new imports, or explicitly use --force.')
    database.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(dir=database.parent) as tmp:
        tmp=Path(tmp);gz=tmp/'bundle.gz';db=tmp/'knowledge.sqlite'
        with gz.open('wb') as dest:
            for part in m['parts']:
                source=(bundle/part['name']).resolve()
                if source.parent!=bundle or source.is_symlink():raise ValueError('Unsafe part path')
                if source.stat().st_size!=part['bytes'] or sha(source)!=part['sha256']:raise ValueError('Part is missing or corrupted: '+part['name'])
                with source.open('rb') as f:
                    for b in iter(lambda:f.read(1024*1024),b''):dest.write(b)
        n=0;h=hashlib.sha256()
        with gzip.open(gz,'rb') as src,db.open('wb') as out:
            for b in iter(lambda:src.read(1024*1024),b''):
                n+=len(b)
                if n>m['uncompressed_bytes']:raise ValueError('Uncompressed limit exceeded')
                h.update(b);out.write(b)
        if n!=m['uncompressed_bytes'] or h.hexdigest()!=m['sha256']:raise ValueError('Database checksum mismatch')
        with closing(sqlite3.connect(db)) as con:
            if con.execute('PRAGMA quick_check').fetchone()[0]!='ok':raise ValueError('SQLite integrity check failed')
        os.replace(db,database)
    return 'restored and verified'
if __name__=='__main__':
    r=Path(__file__).resolve().parents[1];p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--bundle',type=Path,default=r/'knowledge_bundle');p.add_argument('--db',type=Path,default=r/'data/knowledge.sqlite');p.add_argument('--force',action='store_true')
    a=p.parse_args();print(restore(a.bundle,a.db,a.force))
