"""Audit YOLO image archives without executing/extracting anything or training.

Checks exact duplicates and filename families, NOT patient-level independence.
"""
from collections import Counter,defaultdict
from pathlib import Path,PurePosixPath
import argparse,hashlib,json,re,zipfile,math

def audit(path,out):
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    splits=Counter();classes=Counter();hashes=defaultdict(set);families=defaultdict(set);rows=[];invalid=[];metadata={}
    with zipfile.ZipFile(path) as z:
        if len(z.infolist())>500000:raise ValueError('Too many ZIP entries')
        for i in z.infolist():
            if i.is_dir():continue
            name=i.filename.replace('\\','/')
            if '..' in PurePosixPath(name).parts:raise ValueError('Unsafe ZIP path')
            if i.file_size>30*1024*1024:raise ValueError('Oversized member; inspect separately')
            split=next((s for s in name.split('/') if s in {'train','valid','val','test'}),'unknown')
            suffix=Path(name).suffix.lower()
            if suffix in {'.jpg','.jpeg','.png','.webp'}:
                b=z.read(i);digest=hashlib.sha256(b).hexdigest();family=re.split(r'\.rf\.',Path(name).name)[0];family=re.sub(r'_jpg|_png|_jpeg','',family)
                splits[split]+=1;hashes[digest].add(split);families[family].add(split)
                rows.append({'path':name,'split':split,'sha256':digest,'family':family})
            elif '/labels/' in name and suffix=='.txt':
                for line in z.read(i).decode('utf-8').splitlines():
                    try:
                        v=line.split();cid=int(v[0]);coords=list(map(float,v[1:]));classes[str(cid)]+=1
                        if cid<0 or len(coords)!=4 or not all(math.isfinite(x) and 0<=x<=1 for x in coords) or coords[2]<=0 or coords[3]<=0:invalid.append(name)
                    except (ValueError,IndexError):invalid.append(name)
            elif suffix in {'.yaml','.yml'} or Path(name).name.lower().startswith('readme'):
                metadata[name]=z.read(i).decode('utf-8',errors='replace')
    report={'image_counts':dict(splits),'labels_by_class':dict(classes),'invalid_label_files':sorted(set(invalid)),
      'exact_cross_split_hashes':sum(len(s)>1 for s in hashes.values()),'filename_family_cross_split':sum(len(s)>1 for s in families.values()),
      'readmes':metadata,'notes':['Filename-family overlap is a risk indicator, not proof of patient identity.','Patient-level independence cannot be verified without a patient grouping key.','Imaging model NOT trained.']}
    (out/'imaging_audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    (out/'imaging_manifest.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in rows),encoding='utf-8')
    return report
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('input',type=Path);p.add_argument('--out',type=Path,default=Path('reports/imaging-next'));a=p.parse_args();print(json.dumps(audit(a.input,a.out),ensure_ascii=False,indent=2))
