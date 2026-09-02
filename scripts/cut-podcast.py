#!/usr/bin/env python3
"""Нарезка подкаста по описи фрагментов. Имя файла = балл + заголовок.
   python3 scripts/cut-podcast.py <index.json> <out-dir> [--min 60] [--src path]
Вертикаль 1080×1920 режется кропом по месту спикера в 4K-кадре (3840×2160):
николай — слева, александр — центр, дилором — справа; диалог — 16:9 целиком."""
import json, re, subprocess, sys, os, argparse
ap=argparse.ArgumentParser(); ap.add_argument('index'); ap.add_argument('out'); ap.add_argument('--min',type=int,default=60)
ap.add_argument('--src',default='/mnt/c/Users/smmmc/Downloads/Dilorom podcast.mp4'); ap.add_argument('--only',default='')
a=ap.parse_args()
CROP={'александр':'crop=1215:2160:1312:0','николай':'crop=1215:2160:40:0','дилором':'crop=1215:2160:2585:0'}
def safe(n): return re.sub(r'\s+',' ',re.sub(r'[/\\:*?"<>|]','',n)).strip()[:70]
items=[c for c in json.load(open(a.index,encoding='utf-8')) if c.get('score',0)>=a.min]
if a.only: items=[c for c in items if a.only in c.get('title','')]
done=[]
for c in sorted(items,key=lambda x:-x['score']):
    sp=c.get('speaker','диалог'); vertical=sp in CROP
    folder=os.path.join(a.out,'alexander' if sp=='александр' else 'general'); os.makedirs(folder,exist_ok=True)
    fname=f"{int(c['score']):02d} — {safe(c['title'])}{'' if vertical else ' (16x9)'}.mp4"; out=os.path.join(folder,fname)
    if os.path.exists(out): print('  есть  ',fname); continue
    start,end=float(c['start_sec']),float(c['end_sec']); dur=round(end-start,2)
    vf=(CROP[sp]+',scale=1080:1920:flags=lanczos') if vertical else 'scale=1920:1080:flags=lanczos'
    cmd=['ffmpeg','-y','-v','error','-ss',str(start),'-i',a.src,'-t',str(dur),'-vf',vf,'-c:v','libx264','-preset','medium','-crf','18',
         '-pix_fmt','yuv420p','-g','30','-c:a','aac','-b:a','192k','-movflags','+faststart',out]
    subprocess.run(cmd,check=True); done.append(out); print(f"  {int(c['score']):3d}  {dur:5.1f}с  {fname}")
print('нарезано',len(done))
