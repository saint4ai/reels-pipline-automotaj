#!/usr/bin/env python3
"""Чистые окна переходов: индекс по manifest, нарезка тримов, перенос готовых.

    python3 scripts/transitions.py index            # окна из manifest: id, источник, стиль, есть ли трим
    python3 scripts/transitions.py adopt            # перенять готовые тримы из vibecoding/public/transitions
    python3 scripts/transitions.py cut <window-id>… # нарезать трим ffmpeg: без звука, 1080x1920, 30 fps

Трим = reference/transitions/trims/<window-id>.mp4. Сториборд ссылается на window-id, не на источник.
Права на исходники остаются unverified-user-supplied, пока Александр не подтвердит (manifest.provenance).
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
MAN = REPO / "reference/transitions/manifest.json"
TRIMS = REPO / "reference/transitions/trims"
ADOPT_FROM = REPO / "videos/vibecoding-stack-2026-img7333/public/transitions"
# из README того проекта: файл → (id источника, начало окна в секундах)
ADOPT_MAP = {
    "glare-chapter.mp4": ("light-glare-nmntzh", 1.466667),
    "optical-click-a.mp4": ("click-flash-a-dadaew", 4.791667),
    "film-burn-error.mp4": ("film-burn-demo", 9.55),
    "optical-click-b.mp4": ("click-flash-b-dadaew", 5.666667),
}


def load():
    return json.loads(MAN.read_text(encoding="utf-8-sig"))


def windows():
    out = []
    for t in load()["transitions"]:
        for w in t.get("approvedWindows", []):
            wid = w.get("id") or f"{t['id']}-{w['start']:.2f}"
            out.append({"id": wid, "source": t["id"], "path": t["canonicalPath"], "start": w["start"], "end": w["end"],
                        "speed": w.get("speedMultiplier", 1.0), "target": w.get("targetDuration"),
                        "approval": w.get("approval", ""), "style": w.get("style", ""), "opacity": w.get("opacity"),
                        "blend": w.get("blendMode", ""), "native": f"{t['media']['video']['width']}x{t['media']['video']['height']}"})
    return out


def cmd_index():
    TRIMS.mkdir(parents=True, exist_ok=True)
    rows = windows()
    for r in rows:
        f = TRIMS / f"{r['id']}.mp4"
        r["trim"] = str(f.relative_to(REPO)) if f.exists() else None
        r["status"] = "trim-ready" if f.exists() else "no-trim"
        s = str(r["style"]).lower()
        r["flash"] = "white flash" in s or "pure white" in s
    (TRIMS / "index.json").write_text(json.dumps({"schemaVersion": 1, "note": "id окна → трим. Права: см. manifest.provenance",
                                                  "windows": rows}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"ОКНА {len(rows)}, тримов {sum(1 for r in rows if r['trim'])}  → {TRIMS.relative_to(REPO)}/index.json")
    for r in rows:
        mark = "✓" if r["trim"] else "·"
        fl = " FLASH" if r["flash"] else ""
        print(f"  {mark} {r['id']:<28} {r['source']:<22} {r['start']:>6.2f}–{r['end']:<6.2f} ×{r['speed']:<4} {str(r['approval'])[:9]:<9} {r['style'][:34]}{fl}")


def cmd_adopt():
    TRIMS.mkdir(parents=True, exist_ok=True)
    rows = windows()
    for fname, (src, start) in ADOPT_MAP.items():
        f = ADOPT_FROM / fname
        if not f.exists():
            print(f"  · {fname}: нет на диске")
            continue
        match = [r for r in rows if r["source"] == src and abs(r["start"] - start) < 0.02]
        if not match:
            print(f"  ? {fname}: окно {src}@{start} не найдено в manifest")
            continue
        dst = TRIMS / f"{match[0]['id']}.mp4"
        if not dst.exists():
            shutil.copy2(f, dst)
        print(f"  ✓ {fname} → {dst.relative_to(REPO)}")
    print("  marker-scribble.mp4 не переносится: покадровое QA нашло чужой текст в кадре (README vibecoding)")
    cmd_index()


def cmd_cut(*ids):
    rows = {r["id"]: r for r in windows()}
    TRIMS.mkdir(parents=True, exist_ok=True)
    for wid in ids:
        r = rows.get(wid)
        if not r:
            print(f"  ? {wid}: нет в manifest")
            continue
        src = REPO / "reference/transitions" / r["path"]
        dst = TRIMS / f"{wid}.mp4"
        vf = f"setpts=PTS/{r['speed']},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30"
        cmd = ["nice", "-n", "10", "ffmpeg", "-v", "error", "-y", "-ss", f"{r['start']:.6f}", "-to", f"{r['end']:.6f}",
               "-i", str(src), "-an", "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "16",
               "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)]
        rc = subprocess.run(cmd, capture_output=True, text=True)
        print(f"  {'✓' if rc.returncode == 0 else '✗'} {wid} → {dst.relative_to(REPO)}" + (f"  {rc.stderr.strip()[:120]}" if rc.returncode else ""))
    cmd_index()


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a or a[0] not in ("index", "adopt", "cut"):
        print(__doc__.strip()); sys.exit(1)
    {"index": cmd_index, "adopt": cmd_adopt, "cut": cmd_cut}[a[0]](*a[1:])
