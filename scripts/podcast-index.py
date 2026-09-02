#!/usr/bin/env python3
"""Опись серии подкаст-отрывков: сводит JSON-описи и реально нарезанные файлы в INDEX.md.
   python3 scripts/podcast-index.py videos/podcast-clips reference/clips-index.json reference/clips-index-2.json"""
import json, sys, os, re, glob
out_dir=sys.argv[1]; items=[]
for f in sys.argv[2:]:
    for c in json.load(open(f,encoding='utf-8')):
        c['_src']=os.path.basename(f); items.append(c)
files={}
for p in glob.glob(os.path.join(out_dir,'*','*.mp4')):
    m=re.match(r'(\d+) — (.+?)( \(16x9\))?\.mp4$',os.path.basename(p))
    if m: files[(int(m.group(1)),m.group(2))]=os.path.relpath(p,out_dir)
def safe(n): return re.sub(r'\s+',' ',re.sub(r'[/\\:*?"<>|]','',n)).strip()[:70]
rows=[]
for c in sorted(items,key=lambda x:-x['score']):
    if c.get('excluded'): continue
    key=(int(c['score']),safe(c['title'])); f=files.get(key)
    rows.append((c['score'],c.get('speaker','?'),c['start_sec'],c['end_sec'],c['title'],c.get('hook_line',''),c.get('kind',''),f,c['_src']))
def tc(s): return f"{int(s)//60:02d}:{int(s)%60:02d}"
lines=["# Серия подкаст-отрывков — опись","",
"Источник: `Downloads/Dilorom podcast.mp4` (3840×2160, 75 мин). Вертикаль 1080×1920 — кроп по спикеру (Александр центр,",
"Николай слева, Дилором справа), диалоги — 16:9. Балл 0–100: крючок, самодостаточность, конкретность, эмоция, законченность.",
"Тема договора и суда исключена: уже использована в пилоте. Атрибуция спикеров во второй волне восстановлена по контексту —",
"перед публикацией проверить на слух фрагменты с пометкой «диалог» и пары 1911/2042 с.","",
"| Балл | Кто | Таймкод | Заголовок | Хук | Тип | Файл |","|---:|---|---|---|---|---|---|"]
for r in rows:
    lines.append(f"| {r[0]} | {r[1]} | {tc(r[2])}–{tc(r[3])} | {r[4]} | {r[5][:90]} | {r[6]} | {('`'+r[7]+'`') if r[7] else '—'} |")
cut=sum(1 for r in rows if r[7])
lines+=["",f"Нарезано файлов: {cut} из {len(rows)} кандидатов (нарезаются только с баллом ≥ 60). Опись: `reference/clips-index.json`, `clips-index-2.json`."]
open(os.path.join(out_dir,'INDEX.md'),'w',encoding='utf-8').write('\n'.join(lines)+'\n')
print('INDEX.md:',len(rows),'кандидатов,',cut,'файлов')
