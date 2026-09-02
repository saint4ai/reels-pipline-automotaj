#!/usr/bin/env python3
"""Спикер подкаста под окно 1080×960 (нижняя половина). Ищет склейки исходника, классифицирует планы,
режет общий план кропом 9:16 (голова вверху окна), крупный — кропом 9:8 вокруг лица, склеивает в один файл.
   python3 scripts/podcast-speaker.py --src <podcast.mp4> --start 2649.91 --dur 48.56 --out media/speaker-gop30.mp4 [--who александр] [--segs "0.1:c,7.53:w,..."]
Классификация без --segs: по размеру лица (OpenCV Haar), при отсутствии cv2 — по доле красного занавеса."""
import argparse, subprocess, re, os, json, tempfile, shutil
ap=argparse.ArgumentParser(); ap.add_argument('--src',required=True); ap.add_argument('--start',type=float,required=True); ap.add_argument('--dur',type=float,required=True)
ap.add_argument('--out',required=True); ap.add_argument('--who',default='александр'); ap.add_argument('--segs',default=''); ap.add_argument('--thr',type=float,default=0.12)
a=ap.parse_args()
COL={'александр':1312,'николай':40,'дилором':2585}   # левый край колонки 1215 px в 4K
cx=COL[a.who]+607                                     # центр колонки
def run(cmd): return subprocess.run(cmd,capture_output=True,text=True)
# 1. склейки
if a.segs:
    cuts=[(float(p.split(':')[0]),p.split(':')[1]) for p in a.segs.split(',')]
else:
    o=run(['ffmpeg','-v','info','-ss',str(a.start),'-t',str(a.dur),'-i',a.src,'-vf',f"crop=1215:2160:{COL[a.who]}:0,scale=270:480,select='gt(scene,{a.thr})',showinfo",'-f','null','-']).stderr
    ts=[round(float(x),2) for x in re.findall(r'pts_time:([0-9.]+)',o)]
    m=[]
    for t in ts:
        if not m or t-m[-1]>0.5: m.append(t)
    bounds=[0.0]+[t for t in m if 0.3<t<a.dur-0.3]+[a.dur]
    # классификация по кадру из середины сегмента
    kinds=[]
    try:
        import cv2, numpy as np
        casc=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_frontalface_default.xml')
        for i in range(len(bounds)-1):
            mid=a.start+(bounds[i]+bounds[i+1])/2; tmp=tempfile.mktemp(suffix='.jpg')
            run(['ffmpeg','-v','error','-y','-ss',str(mid),'-i',a.src,'-frames:v','1','-update','1','-vf',f"crop=1215:2160:{COL[a.who]}:0,scale=405:720",tmp])
            img=cv2.imread(tmp); g=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY); faces=casc.detectMultiScale(g,1.1,4)
            h=max([f[3] for f in faces],default=0)/720
            kinds.append('c' if h>0.28 else 'w'); os.remove(tmp)
    except Exception as e:
        for i in range(len(bounds)-1):
            mid=a.start+(bounds[i]+bounds[i+1])/2; tmp=tempfile.mktemp(suffix='.jpg')
            # яркость верхне-центральной зоны колонки: общий план — тёмный занавес (~22), крупный — лоб и волосы (40+); середина 60 против 95+
            raw=subprocess.run(['ffmpeg','-v','error','-ss',str(mid),'-i',a.src,'-frames:v','1','-vf',f"crop=1215:2160:{COL[a.who]}:0,scale=54:96",'-f','rawvideo','-pix_fmt','gray','-'],capture_output=True).stdout
            w,h=54,96
            def mean(x0,x1,y0,y1):
                v=[raw[y*w+x] for y in range(int(y0*h),int(y1*h)) for x in range(int(x0*w),int(x1*w))]; return sum(v)/max(1,len(v))
            top=mean(0.3,0.7,0.05,0.30); md=mean(0.3,0.7,0.35,0.60)
            kinds.append('c' if (top>32 or md>82) else 'w')
    cuts=list(zip(bounds[:-1],kinds))
    cuts_end=bounds[1:]
segs=[]
for i,(t,k) in enumerate(cuts):
    e=cuts[i+1][0] if i+1<len(cuts) else a.dur
    segs.append((t,e,k))
print('сегменты:',' '.join(f"{s:.2f}-{e:.2f}:{k}" for s,e,k in segs))
# 2. нарезка сегментов
tmpd=tempfile.mkdtemp(); parts=[]
for i,(s,e,k) in enumerate(segs):
    if e-s<0.04: continue
    if k=='w':   # общий план: колонка 9:16, окно 9:8 с головой у верха (смещение 0.28 высоты)
        vf=f"crop=1215:1080:{COL[a.who]}:{int(0.24*2160)},scale=1080:960:flags=lanczos"   # голова на 60+ px ниже плашки субтитров на шве
    else:        # крупный план: 9:8 вокруг лица по центру колонки
        x=max(0,min(3840-2430,cx-1215)); vf=f"crop=2430:2160:{x}:0,scale=1080:960:flags=lanczos"
    p=os.path.join(tmpd,f'seg{i:02d}.mp4'); parts.append(p)
    r=run(['ffmpeg','-v','error','-y','-ss',f"{a.start+s:.3f}",'-t',f"{e-s:.3f}",'-i',a.src,'-vf',vf,'-r','30','-an','-c:v','libx264','-preset','medium','-crf','16','-g','30','-pix_fmt','yuv420p',p])
    if r.returncode: print(r.stderr); raise SystemExit(1)
lst=os.path.join(tmpd,'list.txt'); open(lst,'w').write(''.join(f"file '{p}'\n" for p in parts))
r=run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',lst,'-c:v','libx264','-preset','medium','-crf','16','-g','30','-pix_fmt','yuv420p','-movflags','+faststart',a.out])
if r.returncode: print(r.stderr); raise SystemExit(1)
shutil.rmtree(tmpd)
d=run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',a.out]).stdout.strip()
print('готово',a.out,'длительность',d)
json.dump({'segments':[{'from':s,'to':e,'kind':k} for s,e,k in segs]},open(a.out+'.segments.json','w'),indent=1)
