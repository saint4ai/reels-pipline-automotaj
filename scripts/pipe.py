#!/usr/bin/env python3
"""Слой фильтрации между инструментами и агентом.

Агент не читает композицию, логи и отчёты целиком. Он спрашивает и получает
проекцию под байтовым потолком. Три закона:
  1. Потолок байт у каждой команды, обрезка с явным маркером.
  2. Лестница важности: [BLOCKING] всегда печатается первым и целиком,
     [ACTIONABLE] одной строкой, [INFO] только если влезло.
  3. Проекция, а не пересказ: всегда видно, что не разобрано.

Команды:
    state    <project>            что есть, что устарело, что сломано
    scenes   <project>            карта композиции: сцены из GSAP, медиа, спикер
    captions <project>            субтитры с таймингами
    plan     <project>            таймлайн, выведенный из storyboard.json
    validate <project>            сториборд против правил DECISIONS/03_rules
    lint     <project>            статический линтер HyperFrames (быстро, без Chrome)
    check    <project> [args]     полный check: lint+runtime+layout+motion+contrast
    qa       <project> [file.mp4] детерминированная проверка мастера + contact sheet
    blocks   <project>            установленные блоки реестра
    build    <project>            assemble → validate → lint → check → snapshots одной командой
    plan     <project> --layout   раскладка по секундам: спикер, доска, вставки, события
Опция --cap=N меняет байтовый потолок.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from html.parser import HTMLParser
from pathlib import Path

HF = ["npx", "--yes", "hyperframes@0.8.20"]
REPO = Path(__file__).resolve().parents[1]
CAP = 3000
_cap_override: int | None = None


# ------------------------------------------------------------------ вывод

def emit(lines: list[str], cap: int = CAP, more: str = "") -> None:
    """Потолок байт. BLOCKING-строки идут сразу после заголовка и не режутся."""
    cap = _cap_override or cap
    if not lines:
        return
    head, body = lines[0], lines[1:]
    blocking = [l for l in body if "[BLOCKING]" in l]
    rest = [l for l in body if "[BLOCKING]" not in l]
    ordered = [head] + blocking + rest
    out: list[str] = []
    used = 0
    dropped = 0
    for i, l in enumerate(ordered):
        if len(l) > 400:
            l = l[:400] + "…"
        b = len(l.encode("utf-8")) + 1
        if used + b > cap and i > len(blocking):
            dropped = len(ordered) - i
            break
        out.append(l)
        used += b
    print("\n".join(out))
    if dropped:
        print(f"[ОБРЕЗАНО: ещё {dropped} строк." + (f" Полностью: {more}]" if more else "]"))


def sev(level: str, msg: str) -> str:
    return f"  [{level}] {msg}"


def read_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8-sig"))


def provenance(project: Path) -> tuple[str, str]:
    """(ожидаемый хеш storyboard, хеш из index.html или '')."""
    import hashlib
    sbp = project / "storyboard.json"
    want = "storyboard:" + hashlib.sha256(sbp.read_bytes()).hexdigest()[:12] if sbp.exists() else ""
    have = ""
    for name in ("index.html", "public/index.html"):
        f = project / name
        if f.exists():
            m = re.search(r'name="hf-assembled" content="([^"]+)"', f.read_text(encoding="utf-8-sig")[:4000])
            have = m.group(1) if m else ""
            break
    return want, have


def find_composition(project: Path) -> Path:
    for name in ("index.html", "public/index.html"):
        p = project / name
        if p.exists():
            return p
    raise SystemExit(f"[BLOCKING] Композиция не найдена в {project} (искал index.html, public/index.html)")


# ------------------------------------------------------------------ HTML

class Scan(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.timed: list[dict] = []
        self.root: dict | None = None
        self.remote: list[str] = []
        self.captions: list[dict] = []
        self._cap_stack: list[tuple[dict, int]] = []
        self._depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self._depth += 1
        if a.get("data-composition-id") and self.root is None:
            self.root = {"id": a["data-composition-id"], "dur": a.get("data-duration"),
                         "w": a.get("data-width"), "h": a.get("data-height"), "fps": a.get("data-fps")}
        src = a.get("src") or a.get("href") or ""
        if src.startswith(("http://", "https://")):
            self.remote.append(src)
        if "data-start" in a:
            el = {"tag": tag, "id": a.get("id", ""), "cls": a.get("class", ""),
                  "start": float(a.get("data-start") or 0), "dur": float(a.get("data-duration") or 0),
                  "src": src.split("/")[-1] if src else "", "label": a.get("aria-label", ""), "text": ""}
            self.timed.append(el)
            if "caption" in el["cls"]:
                self.captions.append(el)
                self._cap_stack.append((el, self._depth))
        if tag in ("br", "img", "source", "meta", "link", "input"):
            self._depth -= 1

    def handle_endtag(self, tag):
        if self._cap_stack and self._cap_stack[-1][1] == self._depth:
            self._cap_stack.pop()
        self._depth -= 1

    def handle_data(self, data):
        if self._cap_stack:
            self._cap_stack[-1][0]["text"] += data


def scan(path: Path) -> tuple[Scan, str]:
    text = path.read_text(encoding="utf-8-sig")
    p = Scan()
    p.feed(text)
    return p, text


# ------------------------------------------------------------------ GSAP

CALL_RE = re.compile(r"\b(?:tl|timeline|master|t)\.(to|fromTo|from|set|addLabel)\(")
NUM_RE = re.compile(r"^[+-]?\d+(?:\.\d+)?$")


def _scan_balanced(text: str, i: int) -> int:
    depth, instr, j = 1, None, i
    while j < len(text) and depth > 0:
        ch = text[j]
        if instr:
            if ch == "\\":
                j += 1
            elif ch == instr:
                instr = None
        elif ch in "\"'`":
            instr = ch
        elif ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        j += 1
    return j


def _split_top(args: str) -> list[str]:
    parts, depth, instr, cur = [], 0, None, []
    for ch in args:
        if instr:
            cur.append(ch)
            if ch == instr:
                instr = None
            continue
        if ch in "\"'`":
            instr = ch
        elif ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        elif ch == "," and depth == 0:
            parts.append("".join(cur).strip())
            cur = []
            continue
        cur.append(ch)
    if cur:
        parts.append("".join(cur).strip())
    return parts


def _unq(s: str) -> str:
    s = s.strip()
    if len(s) >= 2 and s[0] in "\"'`" and s[-1] == s[0]:
        return s[1:-1]
    return s


def gsap_calls(text: str) -> tuple[list[dict], dict, int]:
    """Возвращает (вызовы, метки, число нерешённых позиций)."""
    calls, labels, unresolved = [], {}, 0
    for m in CALL_RE.finditer(text):
        end = _scan_balanced(text, m.end())
        parts = _split_top(text[m.end():end - 1])
        method = m.group(1)
        if method == "addLabel":
            if len(parts) >= 2 and NUM_RE.match(parts[1]):
                labels[_unq(parts[0])] = float(parts[1])
            continue
        need = 4 if method == "fromTo" else 3
        selraw = parts[0] if parts else ""
        sels = [_unq(x) for x in _split_top(selraw[1:-1])] if selraw.startswith("[") else [_unq(selraw)]
        pos = None
        if len(parts) >= need:
            raw = parts[need - 1]
            if NUM_RE.match(raw):
                pos = float(raw)
            else:
                pos = ("label", _unq(raw))
        dur = 0.0
        for v in parts[1:need - 1]:
            d = re.search(r"duration\s*:\s*([\d.]+)", v)
            if d:
                dur = float(d.group(1))
        calls.append({"method": method, "sels": sels, "pos": pos, "dur": dur})
    for c in calls:
        if isinstance(c["pos"], tuple):
            name = c["pos"][1]
            m2 = re.match(r"^([\w-]+)\s*([+-]=)\s*([\d.]+)$", name)
            if name in labels:
                c["pos"] = labels[name]
            elif m2 and m2.group(1) in labels:
                c["pos"] = labels[m2.group(1)] + float(m2.group(3)) * (1 if m2.group(2) == "+=" else -1)
            else:
                c["pos"] = None
        if c["pos"] is None:
            unresolved += 1
    return calls, labels, unresolved


def _root(sel: str) -> str:
    sel = sel.strip()
    if not sel or sel[0] not in "#.":
        return sel.split()[0] if sel else "?"
    return sel.split()[0]


# ------------------------------------------------------------------ transcript / storyboard

ALIASES = {"инстаграм": "instagram", "инстаграма": "instagram", "инста": "instagram",
           "клод": "claude", "рилс": "reels", "тикток": "tiktok"}


def norm(w: str) -> str:
    w = w.lower().replace("ё", "е")
    w = re.sub(r"[^0-9a-zа-я+]", "", w)
    return ALIASES.get(w, w)


def load_words(project: Path) -> list[dict]:
    for name in ("transcript.json", "analysis/transcript.words.json"):
        p = project / name
        if p.exists():
            d = read_json(p)
            if isinstance(d, dict):
                d = d.get("words") or d.get("segments") or []
            out = []
            for x in d:
                if "start" in x and ("text" in x or "word" in x):
                    out.append({"text": str(x.get("text", x.get("word"))).strip(),
                                "start": float(x["start"]), "end": float(x.get("end", x["start"]))})
            return out
    return []


def word_at(words: list[dict], t: float) -> dict | None:
    best = None
    for w in words:
        if w["start"] - 0.06 <= t <= w["end"] + 0.06:
            return w
        if w["start"] <= t and (best is None or w["start"] > best["start"]):
            best = w
    return best


def find_word(words: list[dict], target: str) -> list[float]:
    n = norm(target)
    if not n:
        return []
    return [w["start"] for w in words
            if norm(w["text"]).startswith(n[:6]) or (len(norm(w["text"])) >= 4 and n.startswith(norm(w["text"])[:6]))]


def load_storyboard(project: Path) -> dict | None:
    p = project / "storyboard.json"
    return read_json(p) if p.exists() else None


def _speaker_bottom(sb: dict) -> int | None:
    sw = sb.get("speakerWindow") or {}
    return (sw.get("invariant") or {}).get("bottomEdgeY")


def sb_events(sb: dict, words: list[dict]) -> list[dict]:
    """Единый список событий сториборда v3–v6. accent=True — это акцент по 02_editing §3."""
    ev: list[dict] = []

    def add(t, kind, label, group=None, accent=False, structural=False, word=None):
        if t is None:
            return
        ev.append({"t": float(t), "kind": kind, "label": label, "group": group or f"{kind}:{label}",
                   "accent": accent, "structural": structural, "word": word})

    sp = sb.get("spine") or {}
    for c in sp.get("chips") or []:
        add(c.get("at"), "CHIP", c.get("id", "?"), "spine-build", accent=True, structural=True, word=c.get("word"))
    for t in sp.get("tiles") or []:
        add(t.get("at"), "TILE", t.get("id", "?"), "spine-build", accent=False, structural=True, word=t.get("word"))
    so = sp.get("socket") or {}
    add(so.get("wiredAt"), "SOCKET", "wired", accent=True, structural=True)
    add(so.get("closedAt"), "SOCKET", "closed", accent=True, structural=True)
    fl = sp.get("flowing") or {}
    tiles_by_id = {t.get("id"): t for t in sp.get("tiles") or []}
    for l in fl.get("litInPlace") or []:
        tid = l.get("tile", "?")
        add(l.get("at"), "LIT", tid, "lit", accent=True, structural=True,
            word=l.get("word") or (tiles_by_id.get(tid) or {}).get("word"))
    for sc in sb.get("scenes") or []:
        add(sc.get("from"), "SCENE", sc.get("id", "?"), accent=False, structural=True)
        for k in sc.get("stack") or []:
            add(k.get("at"), "TEXT", k.get("text", "?")[:14], group="stack:" + sc.get("id", "?"), accent=(k.get("role") in ("accent", "number")), structural=True, word=k.get("word"))
        for li in sc.get("list") or []:
            add(li.get("at"), "LINE", li.get("text", "?")[:14], group="list:" + sc.get("id", "?"), accent=False, structural=True, word=li.get("word"))
        for c in sc.get("chips") or []:
            add(c.get("at"), "BRAND", c.get("text", "?"), group="chips:" + sc.get("id", "?"), accent=True, structural=True, word=c.get("word"))
        for l in sc.get("labels") or []:
            add(l.get("at"), "LABEL", l.get("text", "?")[:14], group="labels:" + sc.get("id", "?"), accent=False, structural=True, word=l.get("word"))
        for o in sc.get("objects") or []:
            add(o.get("at"), "OBJ", o.get("kind", "?"), accent=(o.get("kind") in ("stamp", "clock", "arrow", "chart")), structural=True, word=o.get("word"))
            if o.get("composioAt") is not None:
                add(o.get("composioAt"), "OBJ", "composio", accent=True, structural=True, word=o.get("word"))
    for pl in sp.get("platforms") or []:
        add(pl.get("at"), "BRAND", pl.get("id", "?"), "platforms", accent=True, structural=True, word=pl.get("word"))
    bu = sb.get("budget") or sp.get("budget") or {}
    if so.get("composioAt") is not None:
        add(so.get("composioAt"), "SOCKET", "composio", accent=True, structural=True, word=so.get("composioWord"))
    if (sp.get("cta") or {}).get("pointerAt") is not None:
        add(sp["cta"]["pointerAt"], "CTA", "pointer", accent=True, structural=True)
    add(bu.get("appearsAt"), "BUDGET", "appears", accent=True, structural=True, word=bu.get("word"))
    add(bu.get("freezesAt"), "BUDGET", "freeze", accent=False, structural=False)
    for m in (sb.get("speakerWindow") or {}).get("moves") or []:
        add(m.get("at"), "MOVE", m.get("to", "?"), accent=False, structural=True)
    for name, s in (sb.get("sources") or {}).items():
        if isinstance(s, dict) and s.get("placeAt") is not None:
            add(s.get("placeAt"), "INSERT", name, accent=True, structural=True)
    seen_groups: set = set()
    for c in sb.get("clips") or []:
        g = c.get("group")
        first = g not in seen_groups
        seen_groups.add(g)
        add(c.get("at"), "INSERT", c.get("id", "?"), group=g, accent=(first or not g), structural=True)
    for tr in sb.get("transitions") or []:
        if tr.get("hardCut"):
            add(tr.get("at"), "CUT", "hard", accent=False, structural=True)
        else:
            add(tr.get("at"), "TRANS", f"{tr.get('window') or tr.get('source')} {tr.get('frames', '?')}f/{tr.get('opacity', '?')}",
                accent=True)
    for h in (sb.get("audio") or {}).get("hits") or []:
        add(h.get("at"), "SFX", h.get("on", ""), accent=True)
    for e in (sb.get("captions") or {}).get("emphasis") or []:
        if isinstance(e, dict):
            add(e.get("at"), "EMPH", e.get("word", "?"), accent=True, word=e.get("word"))
        else:
            for t0 in find_word(words, e):
                add(t0, "EMPH", e, accent=True, word=e)
    # cards (schema v3)
    for c in sb.get("cards") or []:
        add(c.get("startSec"), "CARD", c.get("id", "?"), accent=True, structural=True)
    ev.sort(key=lambda x: (x["t"], x["kind"]))
    return ev


# ------------------------------------------------------------------ команды

def cmd_state(project: Path, *_):
    lines = [f"PROJECT {project.name}"]
    files = {}
    for name in ("BRIEF.md", "STORYBOARD.md", "DIRECTION.md", "frame.md", "storyboard.json",
                 "transcript.json", "ASSET_SOURCES.md", "index.template"):
        f = project / name
        files[name] = f
        if f.exists():
            lines.append(f"  ✓ {name:<18} {f.stat().st_size} байт")
    comp = None
    try:
        comp = find_composition(project)
    except SystemExit:
        lines.append(sev("BLOCKING", "композиции нет (index.html)"))
    if comp:
        p, text = scan(comp)
        lines.append(f"  ✓ {comp.name:<18} {comp.stat().st_size} байт, timed-элементов {len(p.timed)}, субтитров {len(p.captions)}")
        if p.remote:
            lines.append(sev("BLOCKING", f"сетевые ресурсы в рантайме ({len(p.remote)}): {p.remote[0][:70]}"))
        if "window.__timelines" not in text:
            lines.append(sev("BLOCKING", "таймлайн не зарегистрирован в window.__timelines"))
        if not p.timed:
            lines.append(sev("BLOCKING", "ни одного элемента с data-start — это не HyperFrames-композиция"))
        bad = [t for t in p.timed if t["dur"] <= 0]
        if bad:
            lines.append(sev("BLOCKING", f"клипов с data-duration ≤ 0: {len(bad)} (первый #{bad[0]['id']} на {bad[0]['start']}) — рантайм после них ломается, линтер это не видит"))
        if re.search(r"<video[^>]*\bautoplay\b", text):
            lines.append(sev("BLOCKING", "<video autoplay>: HyperFrames сам управляет клипами, autoplay/loop недетерминированы"))
        if re.search(r"url\(\s*['\"]?https?://", text):
            lines.append(sev("BLOCKING", "сетевой url() в CSS (@import, шрифты): рендер без сети сломается, файлы шрифтов класть в public/fonts"))
        faces = {f.strip() for f in re.findall(r"@font-face\s*\{[^}]*?font-family\s*:\s*['\"]?([^;'\"}]+)", text)}
        used: list[str] = []
        for fam in re.findall(r"font-family\s*:\s*([^;}]+)", text):
            first = fam.split(",")[0].strip().strip("'\"")
            if first and first.lower() not in ("sans-serif", "serif", "monospace", "system-ui", "inherit") and first not in used:
                used.append(first)
        system = ("Arial", "Georgia", "Times New Roman", "Consolas", "Segoe UI", "Helvetica", "Verdana")
        missing = [f for f in used if f not in faces and f not in system]
        if missing:
            lines.append(sev("ACTIONABLE", f"шрифты без @font-face: {', '.join(missing)} — рендер молча возьмёт системный (DECISIONS.md:39)"))
        sysf = [f for f in used if f in system]
        if sysf:
            lines.append(sev("ACTIONABLE", f"системный шрифт как основной: {', '.join(sysf)} — на машине рендера его может не быть, и это не утверждённая гарнитура"))
        approved = ("Manrope", "JetBrains Mono", "STIX Two Text", "Benzin", "Gilroy")
        foreign = [f for f in used if f not in approved and f not in system]
        if foreign:
            lines.append(sev("ACTIONABLE", f"не утверждённые гарнитуры: {', '.join(foreign)} — DECISIONS 02.09.2026: Benzin (H1), Gilroy (H2, субтитры), STIX Two Text Italic (акцент); bash scripts/fonts.sh <project>"))
        if re.search(r"#c7ff00", text, re.I):
            lines.append(sev("ACTIONABLE", "лайм #C7FF00 в CSS — фирменный #B6FF00 (DECISIONS 02.09.2026)"))
        long_caps = [c for c in p.captions if len((c["label"] or c["text"]).split()) > 3]
        if long_caps:
            lines.append(sev("ACTIONABLE", f"субтитров длиннее трёх слов: {len(long_caps)} из {len(p.captions)} (DECISIONS: три слова)"))
        sbx = load_storyboard(project)
        if sbx:
            lane = (sbx.get("captions") or {}).get("lane") or {}
            m_top = re.search(r"\.caption\s*\{[^}]*?top:\s*(\d+)px", text)
            if lane.get("y") is not None and m_top and int(m_top.group(1)) != int(lane["y"]):
                lines.append(sev("ACTIONABLE", f"полоса субтитров: CSS top={m_top.group(1)}, сториборд y={lane['y']} — разные пресеты (podcast 904 / expert 1192)"))
            want = (sbx.get("composition") or {}).get("durationSeconds")
            have = (p.root or {}).get("dur")
            if want and have and abs(float(have) - float(want)) > 0.05:
                lines.append(sev("ACTIONABLE", f"data-duration {have} ≠ storyboard {want}"))
        want, have = provenance(project)
        if want and have == want:
            lines.append("  ✓ index.html собран сборщиком из текущего storyboard.json")
        elif want and have:
            lines.append(sev("ACTIONABLE", "index.html собран из другой версии storyboard.json — python3 scripts/pipe.py build"))
        elif want:
            lines.append(sev("ACTIONABLE", "index.html собран не сборщиком (чужой файл или ручной): рендерить нельзя, python3 scripts/pipe.py build"))
        # свежесть
        cm = comp.stat().st_mtime
        for name in ("storyboard.json", "index.template"):
            f = files[name]
            if f.exists() and f.stat().st_mtime > cm + 60:
                mins = int((f.stat().st_mtime - cm) / 60)
                lines.append(sev("ACTIONABLE", f"{comp.name} старше {name} на {mins} мин — композиция не отражает план"))
    else:
        if files["storyboard.json"].exists():
            lines.append(sev("INFO", "сториборд есть, композиции нет: сборка ещё не начиналась"))
    for f in project.glob("*.json"):
        if f.read_bytes()[:3] == b"\xef\xbb\xbf":
            lines.append(sev("ACTIONABLE", f"BOM в {f.name} — json.load(encoding='utf-8') упадёт"))
    sb = load_storyboard(project)
    if sb:
        for name, s in (sb.get("sources") or {}).items():
            if not isinstance(s, dict):
                continue
            fpath = s.get("file")
            status = s.get("status", "")
            if fpath and not (project / fpath).exists():
                lvl = "INFO" if status == "REQUESTED" else "BLOCKING"
                lines.append(sev(lvl, f"источник {name}: {fpath} отсутствует" + (f" (статус {status})" if status else "")))
            elif not fpath:
                lines.append(sev("INFO", f"источник {name}: файла нет, статус {status or '—'}"))
    scripts = sorted(x.name for x in (project / "scripts").glob("*") if x.is_file()) if (project / "scripts").exists() else []
    if scripts:
        lines.append("  скрипты проекта: " + ", ".join(scripts))
    r = project / "renders"
    if r.exists():
        mp4 = sorted(r.glob("*.mp4"), key=lambda x: x.stat().st_mtime)
        lines.append(f"  рендеров: {len(mp4)}" + (f", последний {mp4[-1].name} ({time.strftime('%d.%m %H:%M', time.localtime(mp4[-1].stat().st_mtime))})" if mp4 else ""))
    an = project / "analysis"
    if an.exists():
        lines.append(f"  analysis/: {len(list(an.rglob('*')))} файлов → pipe.py qa")
    emit(lines)


def cmd_scenes(project: Path, *_):
    comp = find_composition(project)
    p, text = scan(comp)
    r = p.root or {}
    lines = [f"COMPOSITION {r.get('id', '—')} {r.get('w', '?')}x{r.get('h', '?')} @{r.get('fps', '?')}fps "
             f"dur={r.get('dur', '?')}s  [{comp.name}, {comp.stat().st_size} байт]"]
    if not p.timed:
        lines.append(sev("BLOCKING", "ни одного элемента с data-start — композиция не отрендерится"))
    vids = [t for t in p.timed if t["tag"] == "video"]
    auds = [t for t in p.timed if t["tag"] == "audio"]
    others = [t for t in p.timed if t["tag"] not in ("video", "audio") and "caption" not in t["cls"]]
    for t in sorted(vids, key=lambda x: x["start"]):
        lines.append(f"  VIDEO {t['start']:>6.2f}+{t['dur']:<6.2f} #{t['id'] or '-':<26} {t['src']}")
    if auds:
        sfx = [a for a in auds if a["dur"] < 5]
        beds = [a for a in auds if a["dur"] >= 5]
        for a in beds:
            lines.append(f"  AUDIO {a['start']:>6.2f}+{a['dur']:<6.2f} #{a['id'] or '-':<26} {a['src']}")
        if sfx:
            lines.append(f"  SFX x{len(sfx)}  {min(a['start'] for a in sfx):.2f}..{max(a['start'] for a in sfx):.2f}s  "
                         + ", ".join(sorted({a['src'] for a in sfx})[:6]))
    for t in sorted(others, key=lambda x: x["start"]):
        lines.append(f"  CLIP  {t['start']:>6.2f}+{t['dur']:<6.2f} {t['tag']:<5} #{t['id'] or '-'}")
    if p.captions:
        end = max(c["start"] + c["dur"] for c in p.captions)
        lines.append(f"  CAPTIONS x{len(p.captions)}  {p.captions[0]['start']:.2f}..{end:.2f}s   → pipe.py captions")
    calls, labels, unresolved = gsap_calls(text)
    groups: dict[str, dict] = {}
    cap_tweens = 0
    for c in calls:
        for s in c["sels"]:
            root = _root(s)
            if re.match(r"#cap(?:tion)?[-_]?\d", root) or "caption" in s or ".cap-card" in s:
                cap_tweens += 1
                continue
            g = groups.setdefault(root, {"n": 0, "first": None, "last": None, "sets": 0})
            g["n"] += 1
            if c["method"] == "set":
                g["sets"] += 1
            if c["pos"] is not None:
                endt = c["pos"] + c["dur"]
                g["first"] = c["pos"] if g["first"] is None else min(g["first"], c["pos"])
                g["last"] = endt if g["last"] is None else max(g["last"], endt)
    lines.append(f"SCENES (из позиций GSAP): {len(groups)} корней, {len(calls)} вызовов, "
                 f"субтитров {cap_tweens}, не разобрано позиций {unresolved}")
    timed_groups = sorted((k, v) for k, v in groups.items() if v["first"] is not None)
    timed_groups.sort(key=lambda kv: kv[1]["first"])
    for k, v in timed_groups:
        lines.append(f"  {v['first']:>6.2f}..{v['last']:<6.2f} {k:<30} tweens={v['n']}" + (f" set={v['sets']}" if v["sets"] else ""))
    untimed = [k for k, v in groups.items() if v["first"] is None]
    if untimed:
        lines.append(f"  без числовой позиции ({len(untimed)}): " + ", ".join(sorted(untimed)[:12]))
    if not calls:
        lines.append(sev("ACTIONABLE", "GSAP-вызовов tl.* не найдено: таймлайн пуст или в другой переменной"))
    emit(lines, cap=3500, more="pipe.py captions / Read index.html с offset")


def cmd_captions(project: Path, *_):
    comp = find_composition(project)
    p, _ = scan(comp)
    caps = sorted(p.captions, key=lambda x: x["start"])
    if not caps:
        print("CAPTIONS: нет элементов с class=caption и data-start")
        return
    long_n = sum(1 for c in caps if len((c["label"] or c["text"]).split()) > 3)
    lines = [f"CAPTIONS x{len(caps)}" + (f"  [ACTIONABLE] длиннее трёх слов: {long_n}" if long_n else "  (все ≤ 3 слов)")]
    for c in caps:
        label = c["label"] or re.sub(r"\s+", " ", c["text"]).strip()
        mark = " !" if len(label.split()) > 3 else ""
        lines.append(f"  {c['start']:>6.2f}+{c['dur']:<5.2f} {label[:56]}{mark}")
    emit(lines, cap=4000, more="Read index.html с offset")


def cmd_plan(project: Path, *args):
    sb = load_storyboard(project)
    if not sb:
        print("[BLOCKING] storyboard.json нет")
        return
    words = load_words(project)
    ev = sb_events(sb, words)
    comp = sb.get("composition") or {}
    lines = [f"PLAN {project.name}  dur={comp.get('durationSeconds', '?')}s  событий {len(ev)}  слов в транскрипте {len(words)}"]
    # слить события в одной точке (±0.15 с)
    i = 0
    while i < len(ev):
        j = i
        while j + 1 < len(ev) and ev[j + 1]["t"] - ev[i]["t"] <= 0.15:
            j += 1
        grp = ev[i:j + 1]
        w = word_at(words, ev[i]["t"])
        wtxt = f" «{w['text']}»" if w else ""
        parts = [f"{e['kind']} {e['label']}" for e in grp]
        acc = sum(1 for e in grp if e["accent"])
        mark = f"  ← {acc} акцента" if acc >= 3 else ""
        lines.append(f"  {ev[i]['t']:>6.2f}{wtxt:<18} " + " | ".join(parts) + mark)
        i = j + 1
    # заметки timeline[], не совпавшие с событиями
    notes = [t for t in sb.get("timeline") or [] if not any(abs(e["t"] - float(t.get("at", -9))) < 0.05 for e in ev)]
    if notes:
        lines.append(f"  timeline[] без события в данных ({len(notes)}): " + "; ".join(f"{t['at']} {str(t.get('do', ''))[:40]}" for t in notes[:5]))
    if "--layout" in args:
        lines = [f"LAYOUT {project.name}: секунда | спикер | доска | вставка | события"]
        sw = sb.get("speakerWindow") or {}
        moves = sorted((float(m["at"]), m["to"]) for m in sw.get("moves") or [])
        spn = sb.get("spine") or {}
        clips = sb.get("clips") or []
        state = sw.get("initial") or "?"
        t = 0.0
        step = 1.0
        while t < float(comp.get("durationSeconds") or 0):
            for at, to in moves:
                if at <= t:
                    state = to
            board = "—"
            if spn:
                board = "full"
                if spn.get("stripFrom") is not None and float(spn["stripFrom"]) <= t < float(spn.get("stripTo", 1e9)):
                    board = "strip"
                if spn.get("hideAt") is not None and t >= float(spn["hideAt"]):
                    board = "—"
                if (spn.get("climax") or {}).get("at") is not None and t >= float(spn["climax"]["at"]) and board == "full":
                    board = "LIME"
            ins = ",".join(c["id"] for c in clips if float(c["at"]) <= t < float(c["at"]) + float(c.get("dur", 0))) or "·"
            evs = " ".join(f"{e['kind'][:4]}:{e['label'][:10]}" for e in ev if t <= e["t"] < t + step and e["kind"] not in ("MOVE",))
            lines.append(f"  {t:>4.0f}  {state:<3} {board:<5} {ins:<10} {evs}")
            t += step
        emit(lines, cap=6000)
        return
    emit(lines, cap=4500, more="Read storyboard.json")


def _box(d: dict, w_key="w", h_key="h") -> tuple[float, float, float, float] | None:
    try:
        x = d.get("x", d.get("xLeft", 0))
        return float(x), float(d["y"]), float(d[w_key]), float(d[h_key])
    except (KeyError, TypeError, ValueError):
        return None


def cmd_validate(project: Path, *_):
    sb = load_storyboard(project)
    if not sb:
        print("[BLOCKING] storyboard.json нет")
        return
    words = load_words(project)
    ev = sb_events(sb, words)
    out: list[str] = []
    counts = {"BLOCKING": 0, "ACTIONABLE": 0, "INFO": 0}

    def say(level, rule, msg):
        counts[level] += 1
        out.append(sev(level, f"{rule}: {msg}"))

    comp = sb.get("composition") or {}
    dur = float(comp.get("durationSeconds") or 0)

    # V1 источники
    for name, s in (sb.get("sources") or {}).items():
        if not isinstance(s, dict):
            continue
        f = s.get("file")
        if f and not (project / f).exists() and s.get("status") != "REQUESTED":
            say("BLOCKING", "V1 источник", f"{name}: {f} нет на диске")
        if name not in ("speaker", "speech") and f and s.get("placeAt") is None and not s.get("cuts") and not sb.get("clips"):
            say("ACTIONABLE", "V14 раскладка", f"{name}: файл есть, placeAt/cuts нет — в данных не сказано, когда и где он в кадре")
        if s.get("placeAt") is not None and name != "speaker" and not (s.get("box") or s.get("zone") or s.get("fit")):
            say("BLOCKING", "V14 раскладка", f"{name} ставится на {s['placeAt']}, но нет box {{x,y,w,h}} или zone — сборщику некуда его класть")

    # V2 начальное состояние спикера
    sw = sb.get("speakerWindow") or {}
    moves = sw.get("moves") or []
    if moves and not (sw.get("initial") or sw.get("startState") or (moves and float(moves[0].get("at", 1)) == 0)):
        say("BLOCKING", "V2 спикер", f"первый переезд в {moves[0].get('at')}, начальное состояние (speakerWindow.initial) не задано")

    # V3 перекрытие панели и окна спикера, V5 апскейл, V4 зазор до субтитров
    panel = _box((sb.get("spine") or {}).get("panel") or {})
    states = sw.get("states") or {}
    native_w = None
    m = re.match(r"(\d+)x(\d+)", str((sw.get("constraint") or {}).get("sourceNative") or (sb.get("sources") or {}).get("speaker", {}).get("native") or ""))
    if m:
        native_w = int(m.group(1))
    lane = (sb.get("captions") or {}).get("lane") or {}
    bottom = _speaker_bottom(sb)
    for sname, st in states.items():
        b = _box(st)
        if not b:
            continue
        x, y, w, h = b
        if panel:
            px, py, pw, ph = panel
            ov = min(py + ph, y + h) - max(py, y)
            if ov > 0 and min(px + pw, x + w) - max(px, x) > 0:
                say("BLOCKING", "V3 перекрытие", f"панель ({py:.0f}–{py + ph:.0f}) и {sname} ({y:.0f}–{y + h:.0f}) перекрываются на {ov:.0f} px")
        max_up = float((sw.get("constraint") or {}).get("maxUpscale", 1.2))
        if native_w and w / native_w > max_up + 1e-6:
            say("BLOCKING", "V5 апскейл", f"{sname} шириной {w:.0f} из {native_w} = {w / native_w:.2f}x (> {max_up})")
        if bottom is not None and abs((y + h) - bottom) > 1:
            say("ACTIONABLE", "V4 инвариант", f"{sname} нижний край {y + h:.0f} ≠ bottomEdgeY {bottom}")
    if lane and states:
        lh = float(lane.get("h", 112))
        lane_cy0 = float(lane.get("centerY", float(lane.get("y", 0)) + lh / 2))
        for sname, st in states.items():
            b = _box(st)
            if not b:
                continue
            x, y, w, h = b
            ly = float(st.get("captionY", lane_cy0)) - lh / 2   # полоса субтитров у каждого состояния своя
            gap = max(y - (ly + lh), ly - (y + h))
            if gap < 0:
                say("BLOCKING", "V4 субтитры", f"полоса {ly:.0f}–{ly + lh:.0f} перекрывает {sname} ({y:.0f}–{y + h:.0f}) на {-gap:.0f} px")
            elif gap < 32:
                say("BLOCKING", "V4 субтитры", f"зазор полосы субтитров до {sname}: {gap:.0f} px < 32 (hard gap 03_rules §5)")
            elif gap < 48:
                say("INFO", "V4 субтитры", f"зазор до {sname} {gap:.0f} px, preferred 48")

    # V25 вставки не пересекают окно спикера и полосу субтитров (Александр 02.09: объекты не накладываются)
    mv = sorted(((float(m["at"]), m["to"]) for m in sw.get("moves") or []), key=lambda x: x[0])
    def spk_state_at(t):
        cur = sw.get("initial") or next(iter(states), None)
        for at, to in mv:
            if at <= t + 1e-6:
                cur = to
        return cur
    lane_box = (float(lane.get("x", 120)), float(lane.get("y", 900)), float(lane.get("w", 840)), float(lane.get("h", 120))) if lane else None
    def inter(a, b):
        return max(0, min(a[0] + a[2], b[0] + b[2]) - max(a[0], b[0])) * max(0, min(a[1] + a[3], b[1] + b[3]) - max(a[1], b[1]))
    for c in sb.get("clips") or []:
        bx = c.get("box") or {}
        cb = (float(bx.get("x", 0)), float(bx.get("y", 0)), float(bx.get("w", 0)), float(bx.get("h", 0)))
        t0, t1 = float(c["at"]), float(c["at"]) + float(c.get("dur", 0))
        checked = set()
        for tt in [t0 + 0.01] + [at + 0.01 for at, _ in mv if t0 < at < t1]:
            sname = spk_state_at(tt)
            if sname in checked or sname not in states:
                continue
            checked.add(sname)
            sbx = _box(states[sname])
            if sbx and inter(cb, sbx) > 0 and c.get("id") != "cta":
                say("BLOCKING", "V25 наложение", f"вставка {c['id']} ({cb[0]:.0f},{cb[1]:.0f},{cb[2]:.0f}×{cb[3]:.0f}) пересекает окно спикера {sname} на {tt:.1f} с")
        if lane_box and inter(cb, lane_box) > 0 and c.get("id") != "cta":
            say("ACTIONABLE", "V25 наложение", f"вставка {c['id']} заходит на полосу субтитров")
    # V26 объекты сцен не сидят друг на друге, не лезут на субтитры и спикера (Александр 02.09, вечер)
    TEXTY = {"note", "bubble", "stamp", "chip", "clock", "chart", "socket"}
    for sc in sb.get("scenes") or []:
        zone = sc.get("zone") or ({"x": 0, "y": 0} if sc.get("kind") == "overlay" else {"x": 96, "y": 96})
        ox, oy = float(zone.get("x", 0)), float(zone.get("y", 0))
        s_from, s_to = float(sc.get("from", 0)), float(sc.get("to", 0))
        st_name = spk_state_at(s_from + 0.01)
        st_cy = float(states[st_name].get("captionY", 960)) if st_name in states else 960.0
        cap_y = float(sc.get("captionY", st_cy))
        lane_here = (lane_box[0], cap_y - lane_box[3] / 2, lane_box[2], lane_box[3]) if lane_box else None
        objs = []
        for o in sc.get("objects") or []:
            bx = o.get("box")
            if not bx:
                continue
            ab = (ox + float(bx.get("x", 0)), oy + float(bx.get("y", 0)), float(bx.get("w", 0)), float(bx.get("h", 0)))
            objs.append((o, ab, float(o.get("at", s_from)), float(o.get("until", s_to))))
        for i in range(len(objs)):
            oi, bi, ai, ui = objs[i]
            for k in range(i + 1, len(objs)):
                ok_, bk, ak, uk = objs[k]
                if {oi["kind"], ok_["kind"]} & {"highlight", "arrow"}:
                    continue
                if min(ui, uk) > max(ai, ak) + 1e-6 and inter(bi, bk) > 0:
                    say("BLOCKING", "V26 наложение", f"сцена {sc['id']}: {oi['kind']} и {ok_['kind']} пересекаются ({max(ai, ak):.1f}–{min(ui, uk):.1f} с)")
            if oi["kind"] in TEXTY:
                if lane_here and inter(bi, lane_here) > 0:
                    say("BLOCKING", "V26 наложение", f"сцена {sc['id']}: {oi['kind']} ({bi[0]:.0f},{bi[1]:.0f}) заходит на полосу субтитров")
                if not sc.get("fullscreen"):
                    sname = spk_state_at(ai + 0.01)
                    sbx = _box(states[sname]) if sname in states else None
                    if sbx and inter(bi, sbx) > 0:
                        say("BLOCKING", "V26 наложение", f"сцена {sc['id']}: {oi['kind']} ({bi[0]:.0f},{bi[1]:.0f}) пересекает окно спикера {sname}")
    # V6 переходы
    manifest = None
    mp = REPO / "reference/transitions/manifest.json"
    if mp.exists():
        manifest = read_json(mp)
    windows = {}
    if manifest:
        for t in manifest.get("transitions", []):
            for wnd in t.get("approvedWindows", []):
                windows[wnd.get("id")] = (t.get("id"), wnd)
    trans = [t for t in sb.get("transitions") or [] if not t.get("hardCut")]
    prev = None
    flashes = 0
    for t in trans:
        at = float(t.get("at", 0))
        fr = t.get("frames")
        op = t.get("opacity")
        wid = t.get("window")
        if fr is not None and not (4 <= int(fr) <= 10):
            say("BLOCKING", "V6 переход", f"{at}: {fr} кадров, норма 4–10")
        if op is not None and float(op) > 0.7:
            say("BLOCKING", "V6 переход", f"{at}: opacity {op} > 0.7")
        if not wid:
            src = t.get("source", "?")
            pref = [k for k, (s, w) in windows.items() if s == src and str(w.get("approval", "")).startswith("preferred")]
            say("ACTIONABLE", "V6 переход", f"{at}: указан source={src}, нужен window=<id> из manifest" + (f", preferred: {', '.join(pref[:3])}" if pref else ""))
        elif wid not in windows:
            src = t.get("source", "")
            pref = [k for k, (s, w) in windows.items() if (not src or s == src) and str(w.get("approval", "")).startswith("preferred")]
            say("BLOCKING", "V6 переход", f"{at}: окна «{wid}» нет в manifest; preferred для {src or 'всех источников'}: {', '.join(pref[:4])} — см. reference/transitions/trims/index.json")
        else:
            srcid, w = windows[wid]
            style = str(w.get("style", "")).lower()
            if "white flash" in style or "pure white" in style:
                flashes += 1
            rng = w.get("opacity")
            if rng and op is not None and not (rng[0] - 0.05 <= float(op) <= rng[1] + 0.05):
                say("INFO", "V6 переход", f"{at}: opacity {op}, manifest для {wid} даёт {rng}")
        if "flash" in str(t.get("source", "")) and not wid:
            flashes += 1
        if prev is not None:
            if at - prev < 6:
                say("ACTIONABLE", "V6 ритм", f"переходы на {prev} и {at}: {at - prev:.1f} с < 6 (03_rules: один на 6–10 с)")
        prev = at
    if flashes > 1:
        say("ACTIONABLE", "V6 вспышки", f"{flashes} вспышек за ролик, 03_rules §2.7 допускает одну; в manifest есть тёмные preferred-окна")
    policy = sb.get("transitionPolicy") or {}
    if str(policy.get("status", "")).startswith("PENDING"):
        say("INFO", "V6 статус", f"{policy.get('status')}: чистые окна уже есть в manifest.approvedWindows и reference/transitions/trims/")

    # V7 звук
    hits = (sb.get("audio") or {}).get("hits") or []
    if len(hits) > 3:
        say("BLOCKING", "V7 звук", f"{len(hits)} срабатываний, 02_editing допускает не больше трёх")
    for h in hits:
        if float(h.get("at", 9)) < 1.5:
            say("ACTIONABLE", "V7 звук", f"SFX на {h.get('at')} в первые 1.5 с (сториборд сам объявил тишину)")

    # V8 слово ↔ объект
    for e in ev:
        if e["kind"] in ("CHIP", "TILE", "LIT", "BUDGET") and words:
            w = word_at(words, e["t"])
            wt = w["text"] if w else "—"
            if e["word"]:
                ok = any(abs(s - e["t"]) <= 0.12 for s in find_word(words, e["word"]))
                if not ok:
                    near = find_word(words, e["word"])
                    hint = f", слово звучит в {near[:3]}" if near else ", в транскрипте такого слова нет"
                    say("ACTIONABLE", "V8 синхрон", f"{e['t']}: {e['kind']} {e['label']} привязан к «{e['word']}», в речи в этот момент «{wt}»{hint}")
            elif e["kind"] == "LIT":
                say("ACTIONABLE", "V8 синхрон", f"{e['t']}: {e['label']} загорается на слове «{wt}», поле word не задано")

    # V9 стек акцентов, V10 триггеры ближе 1.2 с, V11 акцент слова против структуры
    acc = [e for e in ev if e["accent"]]
    i = 0
    while i < len(acc):
        j = i
        while j + 1 < len(acc) and acc[j + 1]["t"] - acc[i]["t"] <= 0.15:
            j += 1
        grp = acc[i:j + 1]
        if len(grp) >= 3:
            say("ACTIONABLE", "V9 стек", f"{acc[i]['t']}: {len(grp)} акцента разом ({', '.join(e['kind'] + ' ' + e['label'][:14] for e in grp)}) — 02_editing §3: один акцент в момент")
        i = j + 1
    kinetic = ("TEXT", "LINE", "LABEL", "SCENE", "TILE")   # кинетический текст и строки списка — не триггеры, а ритм речи
    struct = [e for e in ev if e["structural"] and e["kind"] not in ("MOVE",) + kinetic] + [e for e in ev if e["kind"] == "TILE"][:1]
    struct.sort(key=lambda x: x["t"])
    for a, b in zip(struct, struct[1:]):
        if 0.15 < b["t"] - a["t"] < 1.2 and a["group"] != b["group"]:
            say("ACTIONABLE", "V10 триггеры", f"{a['t']} {a['kind']} {a['label'][:16]} и {b['t']} {b['kind']} {b['label'][:16]}: {b['t'] - a['t']:.2f} с < 1.2 — второй выбрасывается (03_rules §3.7)")
    trans_ev = [e for e in ev if e["kind"] == "TRANS"]
    for tr in trans_ev:
        for s in struct:
            if 0.15 < abs(tr["t"] - s["t"]) < 1.2:
                say("ACTIONABLE", "V10 триггеры", f"переход {tr['t']} и {s['kind']} {s['label'][:16]} на {s['t']}: {abs(tr['t'] - s['t']):.2f} с < 1.2")
    for e in ev:
        if e["kind"] == "EMPH":
            near = [s for s in struct if abs(s["t"] - e["t"]) <= 1.2]
            if near:
                say("ACTIONABLE", "V11 акцент", f"{e['t']}: курсив «{e['label']}» рядом с {near[0]['kind']} {near[0]['label'][:14]} ({near[0]['t']}) — структура бьёт украшение (03_rules §3.1)")
            if re.search(r"[.,!?]$", e["label"]):
                say("INFO", "V11 акцент", f"«{e['label']}» с пунктуацией: сборщик сравнивает нормализованные слова")

    # V12 динамика (DECISIONS 02.09.2026): визуализация без пауз — разрыв между событиями > 4 с
    vis = sorted({e["t"] for e in ev if e["kind"] not in ("SFX", "EMPH")})
    if dur and vis:
        pts = [0.0] + vis + [dur]
        cover = [(float(c["at"]), float(c["at"]) + float(c.get("dur", 0))) for c in sb.get("clips") or []]
        gaps = [(a, b) for a, b in zip(pts, pts[1:]) if b - a > 4.0
                and not any(ca <= a + 0.05 and cb >= b - 0.05 for ca, cb in cover)]
        if gaps:
            say("ACTIONABLE", "V12 динамика", "паузы без визуального события дольше 4 с: "
                + "; ".join(f"{a:.1f}–{b:.1f}" for a, b in gaps[:5]) + " (DECISIONS: блоки визуализации без пауз)")
    # V24 положение спикера меняется не реже раза в 10 с (DECISIONS 02.09.2026); формат podcast — спикер всегда в нижней половине (11_formats)
    if dur and (sb.get("format") != "podcast"):
        mv = sorted(set([0.0] + [e["t"] for e in ev if e["kind"] == "MOVE"] + [dur]))
        long = [(a, b) for a, b in zip(mv, mv[1:]) if b - a > 10.0]
        if long:
            say("BLOCKING", "V24 спикер", "положение спикера не меняется дольше 10 с: "
                + "; ".join(f"{a:.1f}–{b:.1f}" for a, b in long[:5]) + " (DECISIONS: смена положения раз в 10 с)")
    # V13 плотность
    if dur:
        t0 = 0.0
        while t0 < dur:
            n = len({e["group"] for e in ev if t0 <= e["t"] < t0 + 30 and e["kind"] not in ("SFX", "MOVE", "TRANS", "CUT")})
            lvl = "ACTIONABLE" if n >= 12 or n < 4 else "INFO"
            say(lvl, "V13 плотность", f"{t0:.0f}–{min(t0 + 30, dur):.0f} с: {n} конструкций (норма 6–9)")
            t0 += 30
    # V15 длительности
    spk = (sb.get("sources") or {}).get("speaker") or {}
    if dur and spk.get("out") and abs(float(spk["out"]) - dur) > 0.05:
        say("ACTIONABLE", "V15 длительность", f"composition {dur} ≠ speaker.out {spk['out']}")
    if words and dur and words[-1]["end"] > dur + 0.05:
        say("BLOCKING", "V15 длительность", f"речь до {words[-1]['end']} с, композиция {dur} с — субтитры за пределами будут отброшены; чужая правка durationSeconds?")
    # V16 записи timeline[] без события в данных
    tl_notes = [t for t in sb.get("timeline") or [] if t.get("at") is not None and not any(abs(e["t"] - float(t["at"])) < 0.05 for e in ev)]
    if tl_notes:
        say("ACTIONABLE", "V16 данные", f"{len(tl_notes)} записей timeline[] без события в данных (сборщик и валидатор их не видят): "
            + "; ".join(f"{t['at']} {str(t.get('do', ''))[:28]}" for t in tl_notes[:4]))
    # V20 шрифты
    fonts = sb.get("captions") or {}
    bf = fonts.get("baseFont")
    if bf and bf not in ("Manrope", "Gilroy"):
        say("BLOCKING", "V20 шрифт", f"субтитры {bf}: DECISIONS 02.09.2026 — субтитры Gilroy, три слова, кегль 66 (bash scripts/fonts.sh <project>)")
    ef = fonts.get("editorialFont")
    if ef and "STIX" not in str(ef):
        say("ACTIONABLE", "V20 шрифт", f"акцент {ef}: утверждён STIX Two Text Italic")
    # V23 хук
    if words:
        first = [w for w in words if w["start"] < 1.5]
        if len(first) > 7:
            say("ACTIONABLE", "V23 хук", f"{len(first)} слов в первые 1.5 с (норма ≤ 7)")
        firstvis = min((e["t"] for e in ev if e["structural"]), default=None)
        if firstvis is not None and firstvis > 3:
            say("ACTIONABLE", "V23 хук", f"первое визуальное событие на {firstvis} с, позже 3 с")
    # V17 знаки брендов
    icons = [c.get("icon") for c in (sb.get("spine") or {}).get("chips") or [] if c.get("icon")]
    if len(icons) >= 2:
        say("ACTIONABLE", "V17 знаки", f"{len(icons)} фирменных знака в одной конструкции — ограничение Meta, решение за Александром (08_assets)")

    head = f"VALIDATE {project.name}: BLOCKING {counts['BLOCKING']}, ACTIONABLE {counts['ACTIONABLE']}, INFO {counts['INFO']}  (событий {len(ev)}, слов {len(words)})"
    order = {"BLOCKING": 0, "ACTIONABLE": 1, "INFO": 2}
    out.sort(key=lambda l: order[l.split("]")[0].strip(" [")])
    emit([head] + out, cap=4500, more="pipe.py plan")
    return counts["BLOCKING"]


def _run_hf(args: list[str], timeout=600) -> tuple[int, str, str]:
    try:
        r = subprocess.run(HF + args, capture_output=True, text=True, timeout=timeout)
        return r.returncode, r.stdout, r.stderr
    except Exception as e:  # noqa: BLE001
        return 99, "", str(e)


def _json_blob(s: str):
    try:
        return json.loads(s[s.index("{"):s.rindex("}") + 1])
    except Exception:  # noqa: BLE001
        return None


def _rank_warning(f: dict) -> int:
    code = (str(f.get("code", "")) + " " + str(f.get("message", ""))).lower()
    for i, key in enumerate(("font", "media", "audio", "video", "seek", "clip", "overlap", "contrast")):
        if key in code:
            return i
    return 9


def _findings_lines(findings: list[dict], tag: str, maxw: int) -> tuple[list[str], int, int]:
    errs = [f for f in findings if str(f.get("severity", "")).startswith("err")]
    warns = sorted([f for f in findings if str(f.get("severity", "")).startswith("warn")], key=_rank_warning)
    lines = []
    for f in errs:
        loc = f.get("selector") or f.get("elementId") or ""
        lines.append(sev("BLOCKING", f"{tag} {f.get('code', '?')} {loc}: {str(f.get('message', ''))[:160]}"))
    for f in warns[:maxw]:
        loc = f.get("selector") or f.get("elementId") or ""
        lines.append(sev("ACTIONABLE", f"{tag} {f.get('code', '?')} {loc}: {str(f.get('message', ''))[:120]}"))
    if len(warns) > maxw:
        lines.append(f"  ... ещё {len(warns) - maxw} предупреждений {tag}: " + ", ".join(sorted({str(f.get('code')) for f in warns[maxw:]})[:8]))
    return lines, len(errs), len(warns)


def cmd_lint(project: Path, *_):
    code, so, se = _run_hf(["lint", str(project), "--json"], timeout=300)
    data = _json_blob(so)
    if data is None:
        lines = [f"LINT {project.name}: JSON не получен (exit {code})"] + ["  " + l for l in (so + se).splitlines() if l.strip()][:25]
        emit(lines)
        return code or 1
    lines, ne, nw = _findings_lines(data.get("findings") or [], "lint", 5)
    head = f"LINT {project.name}: ok={data.get('ok')} ошибок {data.get('errorCount', ne)}, предупреждений {data.get('warningCount', nw)}"
    emit([head] + lines, cap=4000, more="npx hyperframes lint --verbose")
    return 0 if data.get("ok") else 1


def cmd_check(project: Path, *extra):
    code, so, se = _run_hf(["check", str(project), "--json", *extra], timeout=900)
    data = _json_blob(so)
    if data is None:
        lines = [f"CHECK {project.name}: JSON не получен (exit {code})"] + ["  " + l for l in (so + se).splitlines() if l.strip()][-25:]
        emit(lines)
        return code or 1
    lines = []
    summary = []
    for sec in ("lint", "runtime", "layout", "motion", "contrast"):
        s = data.get(sec) or {}
        fl, ne, nw = _findings_lines(s.get("findings") or [], sec, 3)
        lines += fl
        en = s.get("enabled")
        summary.append(f"{sec}={'off' if en is False else f'{ne}e/{nw}w'}")
    head = f"CHECK {project.name}: ok={data.get('ok')}  " + " ".join(summary)
    emit([head] + lines, cap=4500, more="npx hyperframes check --snapshots")
    return 0 if data.get("ok") else 1


def _ffprobe(path: Path) -> dict:
    r = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
                       capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except Exception:  # noqa: BLE001
        return {}


def cmd_qa(project: Path, *args):
    """Детерминированная приёмка мастера. Возвращает 0 (PASS) или 1."""
    target = Path(args[0]).resolve() if args and args[0].endswith(".mp4") else None
    if target is None:
        r = project / "renders"
        mp4 = sorted(r.glob("*.mp4"), key=lambda x: x.stat().st_mtime) if r.exists() else []
        if not mp4:
            print(f"QA {project.name}: рендеров нет → bash scripts/render-safe.sh {project} renders/out.mp4")
            return 1
        target = mp4[-1]
    lines = [f"QA {target.name}"]
    fail = 0
    info = _ffprobe(target)
    v = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), None)
    a = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), None)
    fmt = info.get("format") or {}
    if not v:
        lines.append(sev("BLOCKING", "видеопотока нет"))
        emit(lines)
        return 1
    w, h = int(v.get("width", 0)), int(v.get("height", 0))
    fps = eval(v.get("r_frame_rate", "0/1")) if re.match(r"^\d+/\d+$", v.get("r_frame_rate", "")) else 0
    dur = float(fmt.get("duration") or 0)
    br = float(fmt.get("bit_rate") or 0) / 1e6
    sb = load_storyboard(project)
    want = None
    if sb:
        want = (sb.get("composition") or {}).get("durationSeconds")
    if want is None:
        try:
            p, _ = scan(find_composition(project))
            want = float((p.root or {}).get("dur") or 0) or None
        except SystemExit:
            pass
    checks = []
    if (w, h) != (1080, 1920):
        fail += 1
        checks.append(sev("BLOCKING", f"размер {w}x{h}, нужен 1080x1920"))
    if abs(fps - 30) > 0.01:
        fail += 1
        checks.append(sev("BLOCKING", f"fps {fps:.2f}, нужен 30"))
    if want and abs(dur - float(want)) > 0.05:
        fail += 1
        checks.append(sev("BLOCKING", f"длительность {dur:.2f} с, сториборд {want}"))
    if not a:
        fail += 1
        checks.append(sev("BLOCKING", "аудиодорожки нет"))
    if br and br < 6:
        checks.append(sev("ACTIONABLE", f"битрейт {br:.1f} Мбит/с < 6 (04_pipeline)"))
    lines.append(f"  {w}x{h} {fps:.0f}fps {dur:.2f}s" + (f" (план {want})" if want else "") +
                 (f" audio {a.get('codec_name')} {a.get('sample_rate')}Hz" if a else "") + f" {br:.1f} Мбит/с  {fmt.get('size', '?')} байт")
    lines += checks
    # contact sheet с safe-zone
    qa_dir = target.parent / "qa"
    qa_dir.mkdir(exist_ok=True)
    sheet = qa_dir / f"{target.stem}-contact.jpg"
    overlay = REPO / "reference/platform-guides/instagram-reels/safe-zone-1080x1920.png"
    if not sheet.exists() or sheet.stat().st_mtime < target.stat().st_mtime:
        n = 6
        step = max(dur / n, 0.5)
        vf = f"fps=1/{step:.3f},scale=360:-1,tile=3x2"
        cmd = ["nice", "-n", "10", "ffmpeg", "-v", "error", "-y", "-i", str(target)]
        if overlay.exists():
            cmd += ["-i", str(overlay), "-filter_complex", f"[0:v][1:v]overlay=0:0,{vf}"]
        else:
            cmd += ["-vf", vf]
        cmd += ["-frames:v", "1", "-q:v", "4", str(sheet)]
        subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if sheet.exists():
        lines.append(f"  contact sheet (6 кадров, safe-zone поверх): {sheet.relative_to(REPO) if str(sheet).startswith(str(REPO)) else sheet}")
    # face QA, если есть
    an = project / "analysis"
    for f in sorted(an.glob("face-head-trajectory*.json")) if an.exists() else []:
        try:
            d = read_json(f)
        except Exception:  # noqa: BLE001
            continue
        if isinstance(d, dict):
            s = d.get("summary") if isinstance(d.get("summary"), dict) else d
            det = s.get("detectionRatePercent", "?")
            n = len(s["samples"]) if isinstance(s.get("samples"), list) else s.get("samples", "?")
            verd = {k.replace("Verdicts", ""): v for k, v in s.items() if "erdict" in k and isinstance(v, dict)}
            lines.append(f"  face-QA (по исходнику): детекция {det}% в {n} кадрах; " + str(verd)[:160])
            break
    lines.append("  " + ("PASS" if not fail else f"FAIL ({fail} блокирующих)"))
    emit(lines, cap=2500)
    return 1 if fail else 0


def cmd_blocks(project: Path, *_):
    lines = []
    hf = project / "hyperframes.json"
    if hf.exists():
        cfg = read_json(hf)
        items = cfg.get("registryItems", [])
        lines.append(f"УСТАНОВЛЕНО ИЗ РЕЕСТРА: {len(items)}")
        for i in items:
            lines.append(f"  {i.get('name'):<28} → {i.get('target', '')}")
        lines.append(f"  authoringSkill: {cfg.get('authoringSkill', '—')}")
    for d in (project / "compositions", project / "compositions/components"):
        if d.exists():
            f = sorted(x.name for x in d.glob("*.html"))
            if f:
                lines.append(f"ЛОКАЛЬНЫЕ {d.name}: " + ", ".join(f))
    lib = REPO / "library"
    if lib.exists():
        lines.append("БИБЛИОТЕКА library/: " + ", ".join(sorted(x.name for x in lib.glob("*.html"))))
    emit(lines or ["Блоков нет. Каталог: npx hyperframes catalog"])


def cmd_build(project: Path, *args):
    """assemble → validate → lint → check → snapshots. Один ход вместо пяти."""
    lines = [f"BUILD {project.name}"]
    sb = load_storyboard(project)
    if sb and int(sb.get("schemaVersion", 0)) >= 7:
        r = subprocess.run([sys.executable, str(REPO / "scripts/assemble.py"), str(project)], capture_output=True, text=True)
        lines.append("  " + (r.stdout.strip().splitlines() or ["assemble: без вывода"])[-1] if r.returncode == 0 else sev("BLOCKING", f"assemble: {(r.stderr or r.stdout).strip()[-300:]}"))
        if r.returncode != 0:
            emit(lines); return 2
        # validate
        import io, contextlib
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            blocking = cmd_validate(project)
        vlines = buf.getvalue().splitlines()
        lines.append("  " + vlines[0] if vlines else "  validate: пусто")
        lines += [l for l in vlines[1:] if "[BLOCKING]" in l]
        if blocking:
            lines.append(sev("BLOCKING", "сториборд не проходит — сборка остановлена (pipe.py validate)"))
            emit(lines); return 2
    else:
        lines.append("  storyboard schema < 7: сборщик пропущен, проверяю index.html как есть")
    # lint
    code, so, se = _run_hf(["lint", str(project), "--json"], timeout=300)
    d = _json_blob(so)
    if not d or not d.get("ok"):
        fl, ne, nw = _findings_lines((d or {}).get("findings") or [], "lint", 3)
        lines.append(f"  LINT ошибок {ne if d else '?'}")
        lines += fl
        emit(lines); return 1
    lines.append("  LINT ok")
    want, have = provenance(project)
    if want and have != want:
        lines.append(sev("BLOCKING", "index.html подменён после сборки (другой агент пишет в проект) — остановлено"))
        emit(lines); return 3
    # check
    code, so, se = _run_hf(["check", str(project), "--json"], timeout=900)
    d = _json_blob(so)
    if not d:
        lines.append(sev("BLOCKING", f"check: JSON не получен (exit {code})")); emit(lines); return 1
    summ = []
    for sec in ("lint", "runtime", "layout", "motion", "contrast"):
        s2 = d.get(sec) or {}
        fl, ne, nw = _findings_lines(s2.get("findings") or [], sec, 2)
        summ.append(f"{sec}={ne}e/{nw}w")
        lines += [l for l in fl if "[BLOCKING]" in l] + [l for l in fl if "[ACTIONABLE]" in l][:2]
    lines.append(f"  CHECK ok={d.get('ok')}  " + " ".join(summ))
    if not d.get("ok"):
        emit(lines, cap=4500); return 1
    want, have = provenance(project)
    if want and have != want:
        lines.append(sev("BLOCKING", "index.html подменён во время check (другой агент пишет в проект) — остановлено"))
        emit(lines); return 3
    # snapshots: моменты из сториборда
    times = {0.6}
    if sb:
        dur = float((sb.get("composition") or {}).get("durationSeconds") or 0)
        for c in sb.get("clips") or []:
            times.add(round(float(c["at"]) + 0.4, 2))
        for m in (sb.get("speakerWindow") or {}).get("moves") or []:
            times.add(round(float(m["at"]) + 0.5, 2))
        spn = sb.get("spine") or {}
        for key in ("climax",):
            if (spn.get(key) or {}).get("at") is not None:
                times.add(round(float(spn[key]["at"]) + 0.6, 2))
        if dur:
            times.add(round(dur - 1.0, 2))
        times = {t for t in times if 0 <= t < (dur or 1e9)}
    times = sorted(times)[:14]
    snap = project / "snapshots"
    snap.mkdir(exist_ok=True)
    for f in list(snap.glob("frame-*.png")) + list(snap.glob("contact-sheet-*.jpg")):
        f.unlink()
    code, so, se = _run_hf(["snapshot", str(project), "--at", ",".join(f"{t:g}" for t in times)], timeout=600)
    sheets = sorted(snap.glob("contact-sheet-*.jpg"))
    if sheets:
        lines.append(f"  SNAPSHOTS {len(times)} кадров → " + ", ".join(str(x.relative_to(project)) for x in sheets))
        lines.append("  Посмотри лист, запиши дефекты в DIRECTION.md, потом: bash scripts/render-safe.sh " + str(project.relative_to(REPO) if str(project).startswith(str(REPO)) else project) + " renders/out.mp4 --draft")
    else:
        lines.append(sev("ACTIONABLE", f"snapshot не создал листов (exit {code}): {(se or so).strip()[-160:]}"))
    emit(lines, cap=4500)
    return 0


COMMANDS = {
    "state": cmd_state, "scenes": cmd_scenes, "captions": cmd_captions, "plan": cmd_plan,
    "validate": cmd_validate, "lint": cmd_lint, "check": cmd_check, "qa": cmd_qa, "blocks": cmd_blocks, "build": cmd_build,
}


def main() -> None:
    global _cap_override
    argv = [a for a in sys.argv[1:] if not a.startswith("--cap=")]
    for a in sys.argv[1:]:
        if a.startswith("--cap="):
            _cap_override = int(a.split("=", 1)[1])
    if len(argv) < 2 or argv[0] not in COMMANDS:
        print(__doc__.strip())
        raise SystemExit(1)
    project = Path(argv[1]).resolve()
    if not project.is_dir():
        raise SystemExit(f"[BLOCKING] Не директория: {project}")
    rc = COMMANDS[argv[0]](project, *argv[2:])
    raise SystemExit(int(rc or 0))


if __name__ == "__main__":
    main()
