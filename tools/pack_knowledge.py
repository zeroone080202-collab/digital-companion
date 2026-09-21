"""Create bounded gzip shards for a private repository, with SHA256 integrity."""
from contextlib import closing
from pathlib import Path
import argparse, gzip, hashlib, json, sqlite3, tempfile

def sha(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

def pack(database, destination, part_mb=20):
    database=Path(database);destination=Path(destination);destination.mkdir(parents=True,exist_ok=True)
    # Back up through SQLite so an active WAL cannot be silently omitted.
    with tempfile.TemporaryDirectory() as tmp:
        snapshot=Path(tmp)/'snapshot.sqlite';compressed=Path(tmp)/'snapshot.gz'
        with closing(sqlite3.connect(database)) as src, closing(sqlite3.connect(snapshot)) as dst: src.backup(dst)
        with snapshot.open('rb') as src, compressed.open('wb') as target:
            with gzip.GzipFile(fileobj=target,mode='wb',filename='',compresslevel=6,mtime=0) as z:
                for b in iter(lambda:src.read(1024*1024),b''):z.write(b)
        manifest={'format':1,'codec':'gzip','uncompressed_bytes':snapshot.stat().st_size,'sha256':sha(snapshot),'parts':[]}
        with compressed.open('rb') as src:
            i=0
            while b:=src.read(part_mb*1024*1024):
                name=f'knowledge.{i:03d}.bin';p=destination/name;p.write_bytes(b)
                manifest['parts'].append({'name':name,'bytes':len(b),'sha256':sha(p)});i+=1
        (destination/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
        keep={x['name'] for x in manifest['parts']}
        for old in destination.glob('knowledge.*.bin'):
            if old.name not in keep:old.unlink()
        return manifest
if __name__=='__main__':
    root=Path(__file__).resolve().parents[1];p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--db',type=Path,default=root/'data/knowledge.sqlite');p.add_argument('--out',type=Path,default=root/'knowledge_bundle');p.add_argument('--part-mb',type=int,default=20)
    a=p.parse_args()
    if not 1<=a.part_mb<=80:p.error('Use 1 to 80 MiB per part')
    print(json.dumps(pack(a.db,a.out,a.part_mb),indent=2))
