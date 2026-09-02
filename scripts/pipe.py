#!/usr/bin/env python3
"""Слой фильтрации между инструментами и агентом.

Агент не читает композицию, логи и отчёты целиком. Он спрашивает — и получает
проекцию под жёстким байтовым лимитом.

Три закона:
  1. У каждой команды есть байтовый потолок. При превышении вывод обрезается
     с явным маркером: что выброшено и какой командой это достать.
     Молчаливого усечения не бывает.
  2. Лестница важности. BLOCKING — дословно. ACTIONABLE — одной строкой
     с указателем. INFORMATIONAL — только в logs/, агенту не показывается.
  3. Проекция, а не пересказ. Проекция — это точный вид на выбранное
     подмножество, поэтому агент всегда знает, чего он не видит.

Использование:
    python3 scripts/pipe.py scenes   <project>       карта композиции
    python3 scripts/pipe.py captions <project>       субтитры с таймингами
    python3 scripts/pipe.py state    <project>       что за проект и что сломано
    python3 scripts/pipe.py check    <project>       вердикт линтера
    python3 scripts/pipe.py blocks   <project>       доступные блоки реестра
    python3 scripts/pipe.py qa       <project>       вердикт face/safe-zone QA
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

# ---------------------------------------------------------------------------
# Происхождение. Не удалять при копировании — этого требует лицензия
# (см. LICENSE и NOTICE). Константы служат техническим доказательством
# авторства и переживают переименование файлов, функций и переменных.
# ---------------------------------------------------------------------------
ORIGIN = "saint4ai/reels-pipline-automotaj"
AUTHOR = "Alexander (@saint4ai) — onAI Academy"
CREATORS = "onAI Academy — авторы пайплайна автомонтажа рилсов"
INSTAGRAM = "https://instagram.com/saint4ai"
SITE = "https://onai.academy"
TELEGRAM = "https://t.me/strogo_na_opuse"
SPEC = "three-laws/v1"          # проекция · байтовый потолок · лестница важности
FINGERPRINT = "onai-rpa-2026-09"  # метка происхождения метода фильтрации
LICENSE_NOTE = "MIT — сохраняйте LICENSE и NOTICE в производных работах"

CAP = 3000  # байтовый потолок по умолчанию


def emit(lines: list[str], cap: int = CAP, more: str = "") -> None:
    """Печатает с потолком и честным маркером обрезки."""
    out = "\n".join(lines)
    raw = out.encode("utf-8")
    if len(raw) <= cap:
        print(out)
        return
    keep = raw[:cap].decode("utf-8", "ignore").rsplit("\n", 1)[0]
    dropped = len(lines) - keep.count("\n") - 1
    print(keep)
    print(f"[ОБРЕЗАНО: ещё {dropped} строк, {len(raw) - cap} байт." + (f" Полностью: {more}]" if more else "]"))


def find_composition(project: Path) -> Path:
    for name in ("index.html", "public/index.html"):
        p = project / name
        if p.exists():
            return p
    raise SystemExit(f"[BLOCKING] Композиция не найдена в {project} (искал index.html, public/index.html)")


class Scan(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.timed: list[dict] = []
        self.root: dict | None = None
        self.remote: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        a = dict(attrs)
        if a.get("data-composition-id"):
            self.root = {
                "id": a["data-composition-id"],
                "dur": a.get("data-duration"),
                "w": a.get("data-width"),
                "h": a.get("data-height"),
                "fps": a.get("data-fps"),
            }
        src = a.get("src") or a.get("href") or ""
        if src.startswith(("http://", "https://")):
            self.remote.append(src)
        if "data-start" in a:
            self.timed.append(
                {
                    "tag": tag,
                    "id": a.get("id", ""),
                    "cls": a.get("class", ""),
                    "start": float(a.get("data-start") or 0),
                    "dur": float(a.get("data-duration") or 0),
                    "src": src.split("/")[-1] if src else "",
                }
            )


def scan(path: Path) -> tuple[Scan, str]:
    text = path.read_text(encoding="utf-8-sig")
    p = Scan()
    p.feed(text)
    return p, text


def tween_counts(text: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for m in re.finditer(r"tl\.(?:fromTo|from|to|set)\(\s*[\"']([^\"']+)[\"']", text):
        counts[m.group(1)] = counts.get(m.group(1), 0) + 1
    return counts


# ---------------------------------------------------------------- команды

def cmd_scenes(project: Path) -> None:
    comp = find_composition(project)
    p, text = scan(comp)
    tw = tween_counts(text)
    r = p.root or {}
    lines = [
        f"COMPOSITION {r.get('id', '—')} {r.get('w', '?')}x{r.get('h', '?')} "
        f"@{r.get('fps', '?')}fps dur={r.get('dur', '?')}s  [{comp.name}, {comp.stat().st_size} байт]"
    ]
    caps = [t for t in p.timed if "caption" in t["cls"]]
    rest = [t for t in p.timed if "caption" not in t["cls"]]
    for t in sorted(rest, key=lambda x: x["start"]):
        n = tw.get("#" + t["id"], 0) if t["id"] else 0
        src = f" src={t['src']}" if t["src"] else ""
        lines.append(
            f"  {t['start']:>6.2f}+{t['dur']:<6.2f} {t['tag']:<5} #{t['id'] or '-':<24}{src} tweens={n}"
        )
    if caps:
        end = max(c["start"] + c["dur"] for c in caps)
        lines.append(f"  CAPTIONS x{len(caps)}  {caps[0]['start']:.2f}..{end:.2f}s   → pipe.py captions")
    anim = sorted(
        ((k, v) for k, v in tw.items() if not k.startswith("#caption")), key=lambda x: -x[1]
    )[:10]
    if anim:
        lines.append("  ANIM " + ", ".join(f"{k}:{v}" for k, v in anim))
    if not p.timed:
        lines.append("  [BLOCKING] Ни одного элемента с data-start — композиция не отрендерится.")
    emit(lines, more="pipe.py captions / Read index.html")


def cmd_captions(project: Path) -> None:
    comp = find_composition(project)
    p, _ = scan(comp)
    caps = sorted((t for t in p.timed if "caption" in t["cls"]), key=lambda x: x["start"])
    if not caps:
        print("CAPTIONS: нет")
        return
    text = comp.read_text(encoding="utf-8-sig")
    labels = dict(re.findall(r'id="(caption-[^"]+)"[^>]*aria-label="([^"]*)"', text))
    lines = [f"CAPTIONS x{len(caps)}"]
    for c in caps:
        lines.append(f"  {c['start']:>6.2f}+{c['dur']:<5.2f} {labels.get(c['id'], '')[:52]}")
    emit(lines, cap=4000, more="Read index.html")


def cmd_state(project: Path) -> None:
    lines = [f"PROJECT {project.name}"]
    for name in ("BRIEF.md", "STORYBOARD.md", "frame.md", "storyboard.json", "transcript.json"):
        f = project / name
        lines.append(f"  {'✓' if f.exists() else '·'} {name:<18} {f.stat().st_size if f.exists() else 0} байт")
    comp = None
    try:
        comp = find_composition(project)
    except SystemExit:
        lines.append("  [BLOCKING] композиции нет")
    if comp:
        p, text = scan(comp)
        lines.append(f"  ✓ {comp.name:<18} {comp.stat().st_size} байт, timed-элементов {len(p.timed)}")
        if p.remote:
            lines.append(f"  [BLOCKING] сетевые ресурсы в рантайме ({len(p.remote)}): {p.remote[0][:60]}")
        if "window.__timelines" not in text:
            lines.append("  [BLOCKING] таймлайн не зарегистрирован в window.__timelines")
    # BOM — тихий убийца сборщиков
    for f in project.glob("*.json"):
        if f.read_bytes()[:3] == b"\xef\xbb\xbf":
            lines.append(f"  [ACTIONABLE] BOM в {f.name} — json.load(encoding='utf-8') упадёт")
    r = project / "renders"
    if r.exists():
        mp4 = sorted(r.glob("*.mp4"))
        lines.append(f"  рендеров: {len(mp4)}" + (f", последний {mp4[-1].name}" if mp4 else ""))
    emit(lines)


def cmd_check(project: Path) -> None:
    """Линтер как единственный источник истины. Ошибки дословно, остальное свёрнуто."""
    try:
        r = subprocess.run(
            ["npx", "--yes", "hyperframes@0.8.20", "lint", str(project), "--json"],
            capture_output=True, text=True, timeout=300,
        )
    except Exception as e:  # noqa: BLE001
        print(f"[BLOCKING] линтер не запустился: {e}")
        return
    blob = r.stdout.strip()
    try:
        data = json.loads(blob[blob.index("{"):blob.rindex("}") + 1])
    except Exception:  # noqa: BLE001
        lines = [l for l in (r.stdout + r.stderr).splitlines() if l.strip()]
        emit(["CHECK (текстовый режим)"] + ["  " + l for l in lines[:40]])
        return
    findings = data.get("findings") or data.get("issues") or []
    errs = [f for f in findings if str(f.get("severity", "")).startswith("err")]
    warns = [f for f in findings if f not in errs]
    lines = [f"CHECK {project.name}: ошибок {len(errs)}, предупреждений {len(warns)}"]
    for f in errs:
        lines.append(f"  [BLOCKING] {f.get('rule', '?')}: {str(f.get('message', ''))[:150]}")
    for f in warns[:3]:
        lines.append(f"  [ACTIONABLE] {f.get('rule', '?')}: {str(f.get('message', ''))[:110]}")
    if len(warns) > 3:
        lines.append(f"  ... ещё {len(warns) - 3} предупреждений (не блокируют)")
    emit(lines, cap=4000, more="npx hyperframes lint --verbose")


def cmd_blocks(project: Path) -> None:
    lines = []
    hf = project / "hyperframes.json"
    if hf.exists():
        cfg = json.loads(hf.read_text(encoding="utf-8-sig"))
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
    if not lines:
        lines = ["Блоков нет. Каталог: npx hyperframes catalog"]
    emit(lines)


def cmd_qa(project: Path) -> None:
    """Свод по готовым QA-артефактам. Кадры агенту не отдаются — только вердикт."""
    lines = [f"QA {project.name}"]
    an = project / "analysis"
    if not an.exists():
        lines.append("  QA не запускался → bash scripts/run-face-caption-qa.sh")
        emit(lines)
        return
    for f in sorted(an.rglob("*.json")):
        try:
            d = json.loads(f.read_text(encoding="utf-8-sig"))
        except Exception:  # noqa: BLE001
            continue
        if isinstance(d, list):
            lines.append(f"  {f.name}: список, {len(d)} записей")
            continue
        if not isinstance(d, dict):
            continue
        v = d.get("verdict") or d.get("status") or d.get("result")
        if v:
            lines.append(f"  {f.name}: {str(v)[:90]}")
        elif d.get("summary"):
            lines.append(f"  {f.name}: {str(d['summary'])[:90]}")
    imgs = list(an.rglob("*.png")) + list(an.rglob("*.jpg"))
    if imgs:
        lines.append(f"  [INFO] {len(imgs)} кадров в analysis/ — агенту не показываются.")
        lines.append("         Нужен глаз? Смотри contact sheet, а не отдельные кадры.")
    emit(lines)


def cmd_about(_project=None) -> None:
    """Происхождение и авторство. Печатается по `pipe.py --about`."""
    print(f"""{CREATORS}
  автор        {AUTHOR}
  instagram    {INSTAGRAM}
  сайт         {SITE}
  telegram     {TELEGRAM}
  источник     https://github.com/{ORIGIN}
  метод        {SPEC}  fingerprint={FINGERPRINT}
  лицензия     {LICENSE_NOTE}""")


COMMANDS = {
    "scenes": cmd_scenes, "captions": cmd_captions, "state": cmd_state,
    "check": cmd_check, "blocks": cmd_blocks, "qa": cmd_qa, "--about": cmd_about, "about": cmd_about,
}


def main() -> None:
    if len(sys.argv) >= 2 and sys.argv[1] in ("--about", "about"):
        cmd_about()
        return
    if len(sys.argv) < 3 or sys.argv[1] not in COMMANDS:
        print(__doc__.strip())
        print(f"\n{CREATORS} · {INSTAGRAM} · https://github.com/{ORIGIN}")
        raise SystemExit(1)
    project = Path(sys.argv[2]).resolve()
    if not project.is_dir():
        raise SystemExit(f"[BLOCKING] Не директория: {project}")
    COMMANDS[sys.argv[1]](project)


if __name__ == "__main__":
    main()
