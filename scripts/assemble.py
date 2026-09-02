#!/usr/bin/env python3
"""Сборщик: storyboard.json (schema 7) → index.html + index.motion.json.

Инфраструктура (фон, окно спикера, субтитры, вставки, переходы, звук, таймлайн) собирается
детерминированно из данных. Смысловой объект ролика — рукописный: compositions/<name>.{html,css,js},
сборщик инлайнит его и отдаёт в JS объект SB (весь сториборд) и таймлайн tl с хелперами.

    python3 scripts/assemble.py videos/<project>

Правила DECISIONS зашиты: субтитры три слова, Gilroy 66, активное слово белое, соседние #6E6E6E,
акценты STIX Italic лаймом/оранжем; окно спикера меняет размер без зума (dip-swap), перемещение
того же размера — слайд; лайм #B6FF00.
"""
from __future__ import annotations

import html
import json
import re
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
TRIMS = REPO / "reference/transitions/trims"
FONTS = REPO / "fonts"


def j(p: Path):
    return json.loads(p.read_text(encoding="utf-8-sig"))


def esc(s) -> str:
    return html.escape(str(s), quote=True)


def norm(w: str) -> str:
    return re.sub(r"[^0-9a-zа-яё+$%]", "", w.lower().replace("ё", "е"))


# ------------------------------------------------------------------ субтитры

def group_words(words: list[dict], n: int, dur: float) -> list[dict]:
    groups: list[list[dict]] = []
    cur: list[dict] = []
    for w in words:
        t = w["text"].strip()
        if not t or norm(t) in ("э", "мм", "м", "ну"):
            continue
        if cur and (len(cur) >= n or w["start"] - cur[-1]["end"] > 0.6 or w["start"] - cur[0]["start"] > 2.4):
            groups.append(cur)
            cur = []
        cur.append(w)
        if len(cur) >= 2 and re.search(r"[.!?]$", t):
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    out = []
    dropped = 0
    for i, g in enumerate(groups):
        start = round(g[0]["start"], 3)
        if start >= dur - 0.15:          # речь длиннее композиции: группы за её пределами не попадают в DOM
            dropped += 1
            continue
        nxt = groups[i + 1][0]["start"] if i + 1 < len(groups) else dur
        end = round(min(nxt, g[-1]["end"] + 0.7, dur), 3)   # группа обрезается по началу следующей
        end = min(max(end, round(start + 0.3, 3)), dur)      # не короче 9 кадров, не за пределами, никогда не отрицательная
        if end - start <= 0:
            raise SystemExit(f"[BLOCKING] субтитр {i + 1} на {start} с получил длительность {end - start:.3f}: композиция короче речи")
        out.append({"id": f"cap-{len(out) + 1:02d}", "start": start, "end": end, "words": g})
    if dropped:
        print(f"  [ACTIONABLE] {dropped} групп субтитров за пределами композиции ({dur} с) отброшено — речь длиннее ролика?", file=sys.stderr)
    return out


def captions_html(groups, emph: dict, lane: dict, base_size: int = 66) -> str:
    parts = []
    for g in groups:
        label_len = sum(len(w["text"]) for w in g["words"]) + len(g["words"]) - 1
        est = label_len * base_size * 0.62                      # оценка ширины строки Gilroy 900
        size = base_size if est <= lane.get("w", 840) - 60 else max(46, int(base_size * (lane.get("w", 840) - 60) / est))
        spans = []
        for w in g["words"]:
            k = norm(w["text"])
            color = emph.get(k, "")
            cls = "cw" + (f" cw--emph cw--{color}" if color else "")
            spans.append(f'<span class="{cls}" data-ws="{w["start"]:.2f}" data-we="{w["end"]:.2f}">{esc(w["text"])}</span>')
        label = " ".join(w["text"] for w in g["words"])
        parts.append(
            f'<div id="{g["id"]}" class="clip caption" data-layout-allow-overlap data-start="{g["start"]:.2f}" '
            f'data-duration="{g["end"] - g["start"]:.3f}" data-track-index="8" aria-label="{esc(label)}">'
            f'<div class="cap-card" style="font-size:{size}px">{" ".join(spans)}</div></div>')
    return "\n".join(parts)


# ------------------------------------------------------------------ шрифты

def fonts_css(project: Path) -> str:
    dst = project / "assets/fonts"
    dst.mkdir(parents=True, exist_ok=True)
    for f in list(FONTS.glob("*.ttf")) + list(FONTS.glob("*.otf")) + list(FONTS.glob("*.woff2")) + list(FONTS.glob("LICENSE-*")):
        if not (dst / f.name).exists():
            shutil.copy2(f, dst / f.name)
    faces = []
    weights = {"Gilroy-Black.ttf": 900, "Gilroy-Heavy.ttf": 800, "Gilroy-Medium.ttf": 500, "Gilroy-Regular.ttf": 400}
    for name, wgt in weights.items():
        if (dst / name).exists():
            faces.append(f'@font-face{{font-family:"Gilroy";font-weight:{wgt};font-style:normal;src:url("assets/fonts/{name}") format("truetype")}}')
    for name in ("Benzin-ExtraBold.ttf", "Benzin-Bold.ttf"):
        if (dst / name).exists():
            faces.append(f'@font-face{{font-family:"Benzin";font-weight:800;src:url("assets/fonts/{name}") format("truetype")}}')
    for name in ("stix-two-text-cyrillic-700-italic.woff2", "stix-two-text-latin-700-italic.woff2"):
        if (dst / name).exists():
            faces.append(f'@font-face{{font-family:"STIX Two Text";font-weight:700;font-style:italic;src:url("assets/fonts/{name}") format("woff2")}}')
    return "\n".join(faces)


# ------------------------------------------------------------------ сборка

def build(project: Path) -> dict:
    sb = j(project / "storyboard.json")
    assert sb.get("schemaVersion", 0) >= 7, "нужен storyboard schemaVersion 7"
    comp = sb["composition"]
    D = float(comp["durationSeconds"])
    fps = int(comp.get("fps", 30))
    th = {"paper": "#F7F6F2", "paperMid": "#E5E4E2", "paperLo": "#C8C6C1", "ink": "#111214", "lime": "#B6FF00",
          "orange": "#FC5C02", "grey": "#6E6E6E", "gridPitch": 64, "gridOpacity": 0.06}
    th.update(sb.get("theme") or {})
    words = j(project / "transcript.json")
    words = [{"text": str(w["text"]), "start": float(w["start"]), "end": float(w.get("end", w["start"]))} for w in words]

    cap = sb.get("captions") or {}
    lane = cap.get("lane") or {"x": 120, "y": 904, "w": 840, "h": 112}
    n_words = int(cap.get("wordsPerGroup", 3))
    emph = {}
    for e in cap.get("emphasis") or []:
        if isinstance(e, dict):
            emph[norm(e["word"])] = e.get("color", "lime")
        else:
            emph[norm(e)] = "lime"
    groups = group_words(words, n_words, D)

    spk = sb["speakerWindow"]
    states = spk["states"]
    init = spk.get("initial") or next(iter(states))
    radius = int(spk.get("cornerRadius", 28))
    src_spk = sb["sources"]["speaker"]["file"]
    src_speech = (sb["sources"].get("speech") or {}).get("file")

    # вставки
    clips_html, clips_css, clips_js = [], [], []
    for c in sb.get("clips") or []:
        b = c["box"]
        cid = c["id"]
        r = int(c.get("radius", 0))
        fit = c.get("fit", "cover")
        pos = c.get("pos", "50% 50%")
        clips_css.append(f'#ins-{cid}{{left:{b["x"]}px;top:{b["y"]}px;width:{b["w"]}px;height:{b["h"]}px;border-radius:{r}px}}'
                         f'#ins-{cid} video{{object-fit:{fit};object-position:{pos}}}')
        clips_html.append(
            f'<div id="ins-{cid}" class="ins"><video id="{cid}" class="clip" data-start="{c["at"]:.2f}" data-duration="{c["dur"]:.3f}" '
            f'data-track-index="4" src="{esc(c["file"])}" muted playsinline preload="auto"></video></div>')
        enter = c.get("enter", "rise")
        at = float(c["at"])
        end = at + float(c["dur"])
        if enter == "rise":
            clips_js.append(f'tl.set("#ins-{cid}",{{autoAlpha:0,y:24}},0);'
                            f'tl.to("#ins-{cid}",{{autoAlpha:1,y:0,duration:.2,ease:"power3.out"}},{at:.3f});'
                            f'tl.to("#ins-{cid}",{{autoAlpha:0,duration:.12,ease:"power2.in"}},{max(at + .2, end - .12):.3f});'
                            f'tl.set("#ins-{cid}",{{autoAlpha:0}},{end:.3f});')
        elif enter == "cut":
            clips_js.append(f'tl.set("#ins-{cid}",{{autoAlpha:0}},0);tl.set("#ins-{cid}",{{autoAlpha:1}},{at:.3f});tl.set("#ins-{cid}",{{autoAlpha:0}},{end:.3f});')

    # переходы: тримы копируются в media/transitions
    tr_html, tr_js = [], []
    (project / "media/transitions").mkdir(parents=True, exist_ok=True)
    for i, t in enumerate(sb.get("transitions") or []):
        if t.get("hardCut") or not t.get("window"):
            continue
        win = t["window"]
        src = TRIMS / f"{win}.mp4"
        if not src.exists():
            raise SystemExit(f"[BLOCKING] трим {win} нет в {TRIMS} (python3 scripts/transitions.py cut {win})")
        dst = project / "media/transitions" / f"{win}.mp4"
        if not dst.exists():
            shutil.copy2(src, dst)
        frames = int(t.get("frames", 6))
        dur = frames / fps
        peak = float(t.get("opacity", 0.55))
        at = float(t["at"])
        tr_html.append(f'<div id="tr-{i}" class="tr"><video id="tr-{i}-media" class="clip tr-media" data-start="{at:.3f}" '
                       f'data-duration="{dur:.3f}" data-track-index="9" src="media/transitions/{win}.mp4" muted playsinline preload="auto"></video></div>')
        attack = min(.1, dur * .4)
        tr_js.append(f'tl.set("#tr-{i}",{{autoAlpha:0}},0);tl.to("#tr-{i}",{{autoAlpha:{peak},duration:{attack:.3f},ease:"power2.out"}},{at:.3f});'
                     f'tl.to("#tr-{i}",{{autoAlpha:0,duration:{max(.05, dur - attack):.3f},ease:"power2.in"}},{at + attack:.3f});'
                     f'tl.set("#tr-{i}",{{autoAlpha:0}},{at + dur:.3f});')

    # звук
    sfx_html = []
    for i, h in enumerate((sb.get("audio") or {}).get("hits") or []):
        f = h.get("file")
        if not f:
            continue
        sfx_html.append(f'<audio id="sfx-{i}" class="clip" data-start="{float(h["at"]):.3f}" data-duration="{float(h.get("dur", 0.6)):.3f}" '
                        f'data-track-index="11" data-volume="{float(h.get("volume", 0.5))}" src="{esc(f)}" preload="auto"></audio>')

    # спикер: начальное состояние и переезды
    def geo(name):
        s = states[name]
        return f'{{left:{s["x"]},top:{s["y"]},width:{s["w"]},height:{s["h"]}}}'
    def xy(name):
        s = states[name]
        return f'{{x:{s["x"]},y:{s["y"]},width:{s["w"]},height:{s["h"]}}}'
    lane_cy = float(lane.get("centerY", lane["y"] + lane["h"] / 2))
    def st_js(name, t):
        st = states[name]; out = []
        if "border" in st: out.append(f'tl.set("#spk",{{borderWidth:{int(st["border"])}}},{t:.3f});')
        if st.get("pos"): out.append(f'tl.set("#spk-video",{{objectPosition:"{st["pos"]}"}},{t:.3f});')
        return "".join(out)
    def cap_to(cy, t):
        return f'tl.to("#caption-stack",{{y:{float(cy) - lane_cy:.0f},duration:.28,ease:"power3.inOut"}},{max(0.0, t):.3f});'
    mv_sorted = sorted(((float(m["at"]), m["to"]) for m in spk.get("moves") or []), key=lambda p: p[0])
    def state_at(t):
        c = init
        for at_, to_ in mv_sorted:
            if at_ <= t + 1e-6: c = to_
        return c
    spk_js = [f'tl.set("#spk",{xy(init)},0);', st_js(init, 0),
              f'tl.set("#caption-stack",{{y:{float(states[init].get("captionY", lane_cy)) - lane_cy:.0f}}},0);']
    cur = init
    for m in spk.get("moves") or []:
        to = m["to"]
        at = float(m["at"])
        if to == cur:
            continue
        a, b = states[cur], states[to]
        if (a["w"], a["h"]) == (b["w"], b["h"]):
            spk_js.append(f'tl.to("#spk",{{x:{b["x"]},y:{b["y"]},duration:.32,ease:"power3.inOut"}},{at:.3f});' + st_js(to, at))
        else:
            g = xy(to)[1:-1]
            spk_js.append(f'tl.to("#spk",{{autoAlpha:0,duration:.07,ease:"power2.in"}},{at:.3f});'
                          f'tl.set("#spk",{{autoAlpha:0,{g}}},{at + .07:.3f});' + st_js(to, at + .07) +
                          f'tl.to("#spk",{{autoAlpha:1,duration:.10,ease:"power2.out"}},{at + .08:.3f});')
        if a.get("captionY", lane_cy) != b.get("captionY", lane_cy):
            spk_js.append(cap_to(b.get("captionY", lane_cy), at - .22))   # переезд полосы заканчивается до появления спикера
        cur = to
    # полоса субтитров на время сцены (fullscreen): туда на from, обратно к полосе текущего состояния на to
    for sc in sb.get("scenes") or []:
        if sc.get("captionY"):
            spk_js.append(cap_to(sc["captionY"], float(sc["from"]) - .22))
            to_ = float(sc["to"])
            if not any(abs(at_ - to_) < .3 for at_, _ in mv_sorted):   # иначе возврат делает твин переезда спикера
                spk_js.append(cap_to(states[state_at(to_)].get("captionY", lane_cy), to_ - .12))
    # подскок каждой фразы субтитров (Codex: y 14→0 за 0.12, уход y −8 за 0.10)
    cap_js = []
    for g in groups:
        sel = f'"#{g["id"]} .cap-card"'
        cap_js.append(f'tl.fromTo({sel},{{autoAlpha:0,y:14}},{{autoAlpha:1,y:0,duration:.12,ease:"power3.out"}},{g["start"]:.3f});'
                      f'tl.to({sel},{{autoAlpha:0,y:-8,duration:.10,ease:"power2.in"}},{max(g["start"] + .2, g["end"] - .10):.3f});'
                      f'tl.set({sel},{{autoAlpha:0}},{g["end"]:.3f});')

    # кастомный объект
    cu = sb.get("custom") or {}
    cu_html = re.sub(r"<!--.*?-->", "", (project / cu["html"]).read_text(encoding="utf-8"), flags=re.S) if cu.get("html") else ""
    cu_css = (project / cu["css"]).read_text(encoding="utf-8") if cu.get("css") else ""
    cu_js = (project / cu["js"]).read_text(encoding="utf-8") if cu.get("js") else ""

    grid = th["gridPitch"]
    css = f"""
      :root{{--paper:{th['paper']};--paper-mid:{th['paperMid']};--paper-lo:{th['paperLo']};--ink:{th['ink']};--lime:{th['lime']};--orange:{th['orange']};--grey:{th['grey']}}}
      *,*::before,*::after{{box-sizing:border-box}}
      html,body{{width:1080px;height:1920px;margin:0;overflow:hidden;background:var(--paper-mid)}}
      body{{font-family:"Gilroy",Arial,sans-serif;color:var(--ink)}}
      #root{{position:relative;width:1080px;height:1920px;overflow:hidden;isolation:isolate}}
      #bg{{position:absolute;inset:0;overflow:hidden;background:
            radial-gradient(circle at 18% 2%,rgba(255,255,255,.95),transparent 35%),
            radial-gradient(circle at 88% 84%,rgba(85,87,89,.16),transparent 38%),
            linear-gradient(135deg,#f8f7f3 0%,var(--paper-mid) 46%,#c7c7c4 100%)}}
      #grid{{position:absolute;inset:0;opacity:1;
             background-image:linear-gradient(rgba(17,18,20,.075) 1px,transparent 1px),linear-gradient(90deg,rgba(17,18,20,.075) 1px,transparent 1px);
             background-size:{grid}px {grid}px}}
      #bg::after{{content:"";position:absolute;top:-300px;bottom:-300px;left:150px;width:580px;background:linear-gradient(108deg,transparent,rgba(255,255,255,.7),transparent);transform:skewX(-12deg);opacity:.45;pointer-events:none}}
      #spk{{position:absolute;left:0;top:0;overflow:hidden;border-radius:{radius}px;background:#111;border:3px solid var(--ink);box-shadow:18px 18px 0 rgba(17,18,20,.14);z-index:5}}
      #spk video{{width:100%;height:100%;object-fit:cover;object-position:50% 45%;display:block;filter:contrast(1.04) saturate(.96) brightness(.98)}}
      #spk::after{{content:"";position:absolute;inset:0;border:1px solid rgba(255,255,255,.16);background:linear-gradient(180deg,rgba(8,8,8,.04),transparent 48%,rgba(8,8,8,.18));pointer-events:none}}
      .ins{{position:absolute;overflow:hidden;z-index:4;background:var(--paper-lo)}}
      .ins video{{width:100%;height:100%;display:block}}
      #caption-stack{{position:absolute;left:{lane['x']}px;top:{lane['y']}px;width:{lane['w']}px;height:{lane['h']}px;z-index:20}}
      .caption{{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}}
      .cap-card{{display:inline-flex;align-items:center;justify-content:center;gap:0 16px;max-width:100%;padding:16px 26px 19px;
                 background:rgba(4,4,4,.24);border:1px solid rgba(255,255,255,.22);border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.20)}}
      /* караоке: текст залит градиентом «цвет | серый», background-position едет от 100% (серый) к 0% (цвет) */
      .cw{{display:inline-block;font-family:"Gilroy",Arial,sans-serif;font-weight:900;font-size:inherit;line-height:1.03;white-space:nowrap;{"text-transform:uppercase;" if cap.get("uppercase") else ""}
           letter-spacing:-.01em;color:transparent;-webkit-background-clip:text;background-clip:text;background-repeat:no-repeat;
           background-image:linear-gradient(90deg,#ffffff 0 48%,#d6d6d6 52% 100%);background-size:200% 100%;background-position:100% 0}}
      .cw--emph{{font-family:"STIX Two Text",Georgia,serif;font-style:italic;font-weight:700;letter-spacing:-.03em;padding-right:.04em;
                 text-decoration:underline;text-decoration-thickness:.09em;text-underline-offset:.12em}}
      .cw--lime{{background-image:linear-gradient(90deg,var(--lime) 0 48%,#d6d6d6 52% 100%);text-decoration-color:var(--lime)}}
      .cw--orange{{background-image:linear-gradient(90deg,var(--orange) 0 48%,#d6d6d6 52% 100%);text-decoration-color:var(--orange)}}
      .tr{{position:absolute;inset:0;z-index:30;pointer-events:none}}
      .tr-media{{position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover;mix-blend-mode:screen}}
      {"".join(clips_css)}
      {cu_css}
    """
    speech_html = (f'<audio id="speech" class="clip" data-start="0" data-duration="{D:.3f}" data-track-index="10" data-volume="1" src="{esc(src_speech)}" preload="auto"></audio>'
                   if src_speech else "")
    sb_json = json.dumps(sb, ensure_ascii=False)
    import hashlib
    prov = "storyboard:" + hashlib.sha256((project / "storyboard.json").read_bytes()).hexdigest()[:12]
    page = f"""<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>{esc(comp['id'])}</title>
    <meta name="hf-assembled" content="{prov}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      {fonts_css(project)}
      {css}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="{esc(comp['id'])}" data-width="1080" data-height="1920" data-duration="{D:.3f}" data-fps="{fps}">
      <div id="bg"><div id="grid"></div></div>
      {cu_html}
      {"".join(clips_html)}
      <div id="spk"><video id="spk-video" class="clip" data-start="0" data-duration="{D:.3f}" data-track-index="0" src="{esc(src_spk)}" muted playsinline preload="auto"></video></div>
      <div id="caption-stack">
{captions_html(groups, emph, lane, int(cap.get("size", 66)))}
      </div>
      {"".join(tr_html)}
      {speech_html}
      {"".join(sfx_html)}
    </div>
    <script>
      (function(){{
        "use strict";
        var SB={sb_json};
        var D={D:.3f};
        var tl=gsap.timeline({{paused:true}});
        var drv={{t:0}};
        var cw=Array.from(document.querySelectorAll(".cw")).map(function(w){{return {{el:w,ws:Number(w.dataset.ws),we:Number(w.dataset.we)}};}});
        var GREY="{th['grey']}",WHITE="#FFFFFF",LIME="{th['lime']}",ORANGE="{th['orange']}";
        function paintWords(){{
          var now=drv.t;
          /* караоке: заливка слова слева направо ровно за время его произнесения, сказанные слова остаются залитыми */
          cw.forEach(function(w){{
            var d=Math.max(w.we-w.ws,0.12), p=(now-w.ws)/d; p=p<0?0:(p>1?1:p);
            gsap.set(w.el,{{backgroundPosition:((1-p)*100).toFixed(1)+"% 0"}});
          }});
        }}
        tl.fromTo(drv,{{t:0}},{{t:D,duration:D,ease:"none",onUpdate:paintWords}},0);
        {"".join(cap_js)}
        /* хелперы для кастомного объекта */
        function show(sel,start,end,axis){{
          var from=axis==="x"?{{autoAlpha:0,x:28}}:{{autoAlpha:0,y:22}};
          var to=axis==="x"?{{autoAlpha:1,x:0,duration:.22,ease:"power3.out"}}:{{autoAlpha:1,y:0,duration:.22,ease:"power3.out"}};
          tl.fromTo(sel,from,to,start);
          if(end!=null){{tl.to(sel,{{autoAlpha:0,duration:.14,ease:"power2.in"}},Math.max(start+.2,end-.14));}}
        }}
        function pop(sel,at,over){{
          tl.fromTo(sel,{{autoAlpha:0,scale:.6}},{{autoAlpha:1,scale:1,duration:.22,ease:"back.out("+(over||1.4)+")"}},at);
        }}
        function draw(sel,at,dur,len){{
          tl.set(sel,{{strokeDasharray:len||900,strokeDashoffset:len||900,autoAlpha:1}},at);
          tl.to(sel,{{strokeDashoffset:0,duration:dur||.27,ease:"power2.out"}},at);
        }}
        /* спикер */
        {"".join(spk_js)}
        /* вставки */
        {"".join(clips_js)}
        /* переходы */
        {"".join(tr_js)}
        /* кастомный объект */
        {cu_js}
        window.__timelines=window.__timelines||{{}};
        window.__timelines["{comp['id']}"]=tl;
      }})();
    </script>
  </body>
</html>
"""
    (project / "index.html").write_text(page, encoding="utf-8")

    # motion sidecar
    assertions = [{"kind": "staysInFrame", "selector": "#spk"}]
    for c in sb.get("clips") or []:
        assertions.append({"kind": "appearsBy", "selector": f"#ins-{c['id']}", "bySec": round(float(c["at"]) + 0.35, 2)})
    assertions += sb.get("motion") or []
    (project / "index.motion.json").write_text(json.dumps({"duration": D, "assertions": assertions}, ensure_ascii=False, indent=1), encoding="utf-8")
    return {"prov": prov, "bytes": (project / "index.html").stat().st_size, "captions": len(groups), "clips": len(sb.get("clips") or []),
            "transitions": len(tr_html), "sfx": len(sfx_html), "moves": len(spk.get("moves") or []), "motion": len(assertions)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__.strip()); sys.exit(1)
    info = build(Path(sys.argv[1]).resolve())
    print("ASSEMBLED index.html " + " ".join(f"{k}={v}" for k, v in info.items()))
