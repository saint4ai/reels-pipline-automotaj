#!/usr/bin/env bash
# Лист кадров: bash scripts/sheet.sh out.jpg COLS "подпись1" a.png "подпись2" b.png …
# Каждый кадр ужимается до ширины 360, сверху подпись; пустые ячейки не нужны — последний ряд короче.
set -e
out=$1; cols=$2; shift 2
font=$(dirname "$0")/../public/fonts/Manrope-Variable.ttf
args=(); fc=""; n=0
while [ $# -gt 0 ]; do
  label=$1; img=$2; shift 2
  args+=(-i "$img")
  fc+="[$n:v]scale=360:-2,pad=iw:ih+56:0:56:color=0x111316,drawtext=fontfile=$font:text='$label':fontcolor=white:fontsize=30:x=12:y=12[c$n];"
  n=$((n+1))
done
rows=$(( (n + cols - 1) / cols ))
layout=""; for ((i=0;i<n;i++)); do c=$((i%cols)); r=$((i/cols)); layout+="${c:+}$((c*364))_$((r*0))|"; done
ins=""; for ((i=0;i<n;i++)); do ins+="[c$i]"; done
# xstack с раскладкой по сетке: ширина ячейки 360+4, высота берётся из первой ячейки
lay=""; for ((i=0;i<n;i++)); do c=$((i%cols)); r=$((i/cols)); x="0"; for ((k=0;k<c;k++)); do x+="+w0+4"; done; y="0"; for ((k=0;k<r;k++)); do y+="+h0+4"; done; lay+="${x}_${y}|"; done
lay=${lay%|}
if [ $n -eq 1 ]; then fc+="[c0]copy[o]"; else fc+="${ins}xstack=inputs=$n:layout=$lay:fill=0x000000[o]"; fi
ffmpeg -loglevel error -y "${args[@]}" -filter_complex "$fc" -map "[o]" -q:v 3 "$out"
echo "$out"
