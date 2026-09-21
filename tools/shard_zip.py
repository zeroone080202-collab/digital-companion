"""Repack a ZIP into independently valid ZIPs below an upload-size target.

This is NOT a .zip.001 split archive. Every output can be opened on its own.
Original data remains untouched; one huge member must be split separately.
"""
import argparse,hashlib,json,zipfile
from pathlib import Path

def shard(source,output,target_mb=180):
    source=Path(source);output=Path(output);output.mkdir(parents=True,exist_ok=True)
    if list(output.glob('dataset-part-*.zip')):raise ValueError('Choose an empty output directory')
    cap=target_mb*1024*1024;manifest=[];zout=None;size=0;count=0
    try:
        with zipfile.ZipFile(source) as zin:
            for i in zin.infolist():
                if i.is_dir():continue
                if '..' in Path(i.filename.replace('\\','/')).parts:raise ValueError('Unsafe input path')
                if i.file_size+len(i.filename.encode('utf-8'))*2+4096>cap:raise ValueError('One member exceeds the target: '+i.filename+'. Shard this inner file first.')
                cost=i.file_size+len(i.filename.encode('utf-8'))*2+4096
                if zout is None or size+cost>cap:
                    if zout:zout.close()
                    count+=1;p=output/f'dataset-part-{count:03d}.zip';manifest.append({'name':p.name});zout=zipfile.ZipFile(p,'w',compression=zipfile.ZIP_STORED);size=0
                name=i.filename.lstrip('/').replace('\\','/')
                with zin.open(i) as src,zout.open(name,'w') as dest:
                    for b in iter(lambda:src.read(1024*1024),b''):dest.write(b)
                size+=cost
    finally:
        if zout:zout.close()
    for item in manifest:
        p=output/item['name'];h=hashlib.sha256()
        with p.open('rb') as f:
            for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
        item.update(bytes=p.stat().st_size,sha256=h.hexdigest())
    (output/'parts-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',type=Path);p.add_argument('--out',type=Path,default=Path('upload-parts'));p.add_argument('--target-mb',type=int,default=180)
    a=p.parse_args()
    if not 1<=a.target_mb<=400:p.error('Choose 1 to 400 MiB')
    print(json.dumps(shard(a.source,a.out,a.target_mb),indent=2))
