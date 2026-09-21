"""Размывает приватное в записи экрана со «съезжающей» камерой (автоприближение Screen Studio).

Образцы вырезаются из кадров, где элемент виден целиком; на каждом кадре ищется лучшее совпадение
в нескольких масштабах (кадр уменьшен вдвое ради скорости), найденная область размывается.
Отчёт по кадрам печатается, чтобы проверить, что ничего не пропущено.
    python blur_private.py <вход.mp4> <выход.mp4> <образцы.json>
"""
import json, sys
import cv2, numpy as np

src, dst, spec = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3], encoding='utf-8'))
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS)
frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
H, W = frames[0].shape[:2]
tpls = []
for s in spec:
    f = frames[round(s['at'] * fps)]
    x, y, w, h = s['rect']
    g = cv2.cvtColor(f[y:y + h, x:x + w], cv2.COLOR_BGR2GRAY)
    tpls.append({**s, 'img': cv2.resize(g, None, fx=0.5, fy=0.5)})
scales = np.arange(0.55, 1.95, 0.08)
report = []
for i, f in enumerate(frames):
    t = i / fps
    small = cv2.cvtColor(cv2.resize(f, None, fx=0.5, fy=0.5), cv2.COLOR_BGR2GRAY)
    hits = []
    for tp in tpls:
        if not (tp['from'] <= t <= tp['to']): continue
        # Один образец может встретиться в кадре несколько раз (почта вверху страницы и под кнопкой): ищем до max раз,
        # найденное место гасим в поисковой копии, чтобы следующий поиск нашёл другое.
        for n in range(tp.get('max', 1)):
            best = (0, None, None)
            for sc in scales:
                ti = cv2.resize(tp['img'], None, fx=sc, fy=sc)
                if ti.shape[0] >= small.shape[0] or ti.shape[1] >= small.shape[1] or ti.shape[0] < 6: continue
                r = cv2.matchTemplate(small, ti, cv2.TM_CCOEFF_NORMED)
                _, mv, _, ml = cv2.minMaxLoc(r)
                if mv > best[0]: best = (mv, ml, ti.shape)
            mv, ml, shp = best
            if mv < tp.get('thr', 0.6):
                if n == 0: hits.append(f"{tp['name']}:ПРОПУСК {mv:.2f}")
                break
            pad = tp.get('pad', 10)
            x0, y0 = max(0, ml[0] * 2 - pad), max(0, ml[1] * 2 - pad)
            x1, y1 = min(W, (ml[0] + shp[1]) * 2 + pad), min(H, (ml[1] + shp[0]) * 2 + pad)
            roi = f[y0:y1, x0:x1]
            k = max(31, (min(roi.shape[:2]) // 2) | 1)
            f[y0:y1, x0:x1] = cv2.GaussianBlur(roi, (k, k), 0)
            small[ml[1]:ml[1] + shp[0], ml[0]:ml[0] + shp[1]] = int(small.mean())
            hits.append(f"{tp['name']}#{n + 1}:{mv:.2f}")
    report.append(f'{t:5.2f} ' + ' '.join(hits))
out = cv2.VideoWriter(dst, cv2.VideoWriter_fourcc(*'mp4v'), fps, (W, H))
for f in frames: out.write(f)
out.release()
print('\n'.join(r for r in report if r.strip()[5:]))
