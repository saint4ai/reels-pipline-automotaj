#!/usr/bin/env bash
# origin=onai-rpa-2026-09 spec=three-laws/v1 — onAI Academy, @saint4ai (NOTICE)
# Мастеринг звука после рендера: Remotion громкость не выравнивает. Два прохода loudnorm до −14 LUFS / ≤ −1 dBTP,
# видео копируется без перекодирования. Печатает размер, битрейт и итоговую громкость.
#   bash scripts/master.sh <raw.mp4> <final.mp4>
set -euo pipefail
RAW="${1:?raw.mp4}"; OUT="${2:?final.mp4}"
J=$(ffmpeg -hide_banner -nostats -i "$RAW" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
set -- $(echo "$J" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
ffmpeg -hide_banner -loglevel error -y -i "$RAW" -map 0:v:0 -map 0:a:0 -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$1:measured_TP=$2:measured_LRA=$3:measured_thresh=$4:offset=$5:linear=true" \
  -c:a aac -b:a 320k -movflags +faststart "$OUT"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,bit_rate -show_entries format=duration,size -of default=nw=1 "$OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
