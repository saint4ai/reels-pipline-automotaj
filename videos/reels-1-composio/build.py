#!/usr/bin/env python3
# ---------------------------------------------------------------------------
#  build.py — сборщик композиции
#  onAI Academy · @saint4ai · https://onai.academy
#  storyboard.json + transcript.json → index.html
#  Стиль: белый лист (minimal) + оранжевый маркер (whiteboard), раскладка pip.
#  Источники: .claude/skills/talking-head-recut/references/ и разбор референса 0902.mp4.
#  origin=onai-rpa-2026-09  spec=three-laws/v1
# ---------------------------------------------------------------------------
from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SB = json.loads((ROOT / "storyboard.json").read_text(encoding="utf-8-sig"))
WORDS = json.loads((ROOT / "transcript.json").read_text(encoding="utf-8-sig"))
DUR = SB["composition"]["durationSeconds"]

EMPH = {"composio", "бесплатной", "вайбкодинге", "instagram", "tiktok", "reels", "клод", "клоду"}
STOP = {"и", "в", "на", "с", "к", "у", "а", "но", "или", "что", "это", "вот", "как", "мой",
        "моем", "он", "вам", "вы", "по", "ней", "за", "то", "же", "все", "этот", "эту", "этого"}


def norm(t: str) -> str:
    return re.sub(r"[^0-9a-zа-яё]", "", t.lower())


def group_words(words):
    groups, cur = [], []
    for w in words:
        if w["start"] >= DUR:
            break
        if cur:
            gap = w["start"] - cur[-1]["end"]
            span = w["end"] - cur[0]["start"]
            if len(cur) >= 4 or gap > 0.36 or span > 1.7:
                groups.append(cur)
                cur = []
        cur.append(w)
        if len(cur) >= 2 and str(w["text"]).rstrip().endswith((".", "!", "?")):
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    return groups


def register(word: str, is_key: bool) -> str:
    """Три регистра из референса: обычный · чёрный капс · оранжевый курсив."""
    n = norm(word)
    if n in EMPH:
        return "cw cw--emph"
    if is_key:
        return "cw cw--key"
    return "cw"


def clip_windows():
    return [(c["at"], c["at"] + c["dur"]) for c in SB["clips"]]


def caption_markup(groups):
    blocks, tl = [], []
    wins = clip_windows()
    for i, g in enumerate(groups, 1):
        s, e = g[0]["start"], g[-1]["end"]
        last = -1
        for k in range(len(g) - 1, -1, -1):
            if norm(g[k]["text"]) not in STOP and len(norm(g[k]["text"])) > 2:
                last = k
                break
        covered = any(a - 0.3 <= s <= b for a, b in wins)
        align = ("left", "right", "left")[i % 3]
        if covered:
            top = (952, 1004, 906)[i % 3]
            scale = ""
        else:
            top = (392, 336, 448)[i % 3]
            scale = " big"
        over = " over" if s >= 46.5 else ""
        spans = "".join(
            f'<span class="{register(str(w["text"]), k == last)}">{html.escape(str(w["text"]))}</span>'
            for k, w in enumerate(g)
        )
        label = html.escape(" ".join(str(x["text"]) for x in g), quote=True)
        blocks.append(
            f'      <div id="cap-{i:02d}" class="clip caption{over}{scale}" data-align="{align}" '
            f'style="top:{top}px" data-start="{s:.2f}" data-duration="{max(e - s, 0.22):.3f}" '
            f'data-track-index="8" aria-label="{label}">{spans}</div>'
        )
        tl.append(
            f'    tl.fromTo("#cap-{i:02d}",{{opacity:0,y:16}},'
            f'{{opacity:1,y:0,duration:.16,ease:"power3.out",immediateRender:false}},{s:.2f});'
        )
    return "\n".join(blocks), "\n".join(tl)


def media_markup():
    parts, tl = [], []
    for c in SB["clips"]:
        if c["at"] >= DUR:
            continue
        sid, src, at, dur = c["id"], c["file"], c["at"], min(c["dur"], DUR - c["at"])
        bx = c["box"]
        st = f'left:{bx["x"] + 22}px;top:{bx["y"] + 22}px;width:{bx["w"] - 44}px;height:{bx["h"] - 44}px'
        gl = f'left:{bx["x"] + 2}px;top:{bx["y"] + 2}px;width:{bx["w"] - 4}px;height:{bx["h"] - 4}px'
        parts.append(
            f'      <div id="glow-{sid}" class="clip glow" style="{gl}" data-start="{at:.2f}" '
            f'data-duration="{dur:.2f}" data-track-index="3"></div>'
        )
        parts.append(
            f'      <video id="{sid}" class="clip shot" style="{st};object-fit:{c.get("fit","cover")}" '
            f'data-start="{at:.2f}" data-duration="{dur:.2f}" data-track-index="4" src="{src}" '
            f'muted playsinline preload="auto"></video>'
        )
        tl.append(f'    tl.fromTo("#glow-{sid}",{{opacity:0}},{{opacity:.9,duration:.3}},{at:.2f});')
        tl.append(
            f'    tl.fromTo("#{sid}",{{opacity:0,y:26,scale:.97}},'
            f'{{opacity:1,y:0,scale:1,duration:.42,ease:"power3.out"}},{at:.2f});'
        )

    if DUR > 47.0:
        tl.append('    tl.to("#spk",{x:-74,y:-1198,width:1080,height:1920,borderRadius:0,'
                  'duration:.5,ease:"power2.inOut"},46.50);')
    return "\n".join(parts), "\n".join(tl)


def mark_timeline():
    tl = []
    for at in [x for x in (11.6, 22.4, 35.2, 44.2) if x + 2.6 < DUR]:
        tl.append(
            f'    tl.fromTo("#mark",{{opacity:0,scale:.6,rotate:-24}},'
            f'{{opacity:1,scale:1,rotate:0,duration:.44,ease:"back.out(1.6)"}},{at:.2f});'
        )
        tl.append(f'    tl.to("#mark",{{opacity:0,scale:.86,duration:.34}},{at + 2.2:.2f});')
        tl.append(f'    tl.set("#mark",{{opacity:0}},{at + 2.6:.2f});')
    return "\n".join(tl)


def main() -> None:
    groups = group_words(WORDS)
    cap_html, cap_tl = caption_markup(groups)
    media_html, media_tl = media_markup()
    tpl = (ROOT / "index.template").read_text(encoding="utf-8")
    out = (
        tpl.replace("<!--MEDIA-->", media_html)
        .replace("<!--CAPTIONS-->", cap_html)
        .replace("//TL_MEDIA", media_tl)
        .replace("//TL_MARK", mark_timeline())
        .replace("//TL_CAPS", cap_tl)
        .replace("{{DUR}}", f"{DUR:.6f}")
        .replace("{{ID}}", SB["composition"]["id"])
    )
    (ROOT / "index.html").write_text(out, encoding="utf-8")
    print(f"index.html: {len(out)} байт · {len(groups)} групп · {len(SB['clips'])} врезок")


if __name__ == "__main__":
    main()
