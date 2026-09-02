#!/usr/bin/env python3
"""Нарезка подкаста по списку фрагментов. Имя файла = балл + заголовок."""
import json, re, subprocess, sys, os

SRC = os.path.expanduser("~/Downloads/podcast-4k.webm")
BASE = os.path.expanduser("~/Desktop/onAI-Workspace/projects/podcast_clips")

def safe(name: str) -> str:
    """Имя файла без спецсимволов."""
    n = re.sub(r'[/\\:*?"<>|]', '', name).strip()
    return re.sub(r'\s+', ' ', n)[:70]

def cut(clip, folder, vertical=False):
    start, end = clip["start_sec"], clip["end_sec"]
    dur = round(end - start, 2)
    fname = f"{int(clip['score']):02d} — {safe(clip['title'])}.mp4"
    out = os.path.join(BASE, folder, fname)
    vf = ("crop=1215:2160:1312:0,scale=1080:1920:flags=lanczos"
          if vertical else "scale=1920:1080:flags=lanczos")
    cmd = ["ffmpeg", "-y", "-v", "error", "-ss", str(start), "-i", SRC, "-t", str(dur),
           "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "18",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
           "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    return out, dur

if __name__ == "__main__":
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    folder = sys.argv[2]
    vertical = len(sys.argv) > 3 and sys.argv[3] == "vertical"
    for c in data:
        p, d = cut(c, folder, vertical)
        print(f"  {int(c['score']):3d}  {d:5.1f}с  {os.path.basename(p)}")
