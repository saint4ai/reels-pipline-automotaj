# Vertical UI proof overlays — 1080×1920

Version checked: `2026-08-31`. These files are transparent review overlays for a
`1080×1920` master. They approximate the fixed interface pressure created by Instagram Reels
and TikTok and make layout collisions obvious before export.

They are **QA-only**. Never render an overlay into the delivery master. Platform interfaces vary
by device, account, locale, caption length, experiment and ad/organic placement, so a final
in-app preview on the publishing account remains mandatory.

## ONai proof rectangle

All three overlays enforce the same conservative content rectangle:

| Boundary | Coordinate |
| --- | ---: |
| left | `x=120` |
| right | `x=840` |
| top | `y=260` |
| bottom | `y=1360` |
| width | `720 px` |
| height | `1100 px` |

Critical words, logos, CTA text and active diagram nodes stay inside this rectangle. Backgrounds,
light leaks, grids and other non-semantic decoration may bleed to the full canvas.

The overlays show four compact `720×112` caption presets. They are alternative layout modes,
not four layers to display at once:

| Preset | Rectangle | Centre Y | Use |
| --- | --- | ---: | --- |
| `podcast` | `x=120, y=904, w=720, h=112` | `960` | Podcast 50/50 seam |
| `expertPortrait` | `x=120, y=1192, w=720, h=112` | `1248` | Expert portrait, preferably below the tracked head |
| `expertSplitFallback` | `x=120, y=816, w=720, h=112` | `872` | Above-face fallback when the lower slot is blocked by face clearance or platform UI |
| `fullGraphics` | `x=120, y=480, w=720, h=112` | `536` | Full-graphics scenes without a face |

`expertPortrait` remains exactly `15%` of the frame height below centre
(`960 + 0.15 × 1920 = 1248`). Expert split is **not** centred at `Y=960`: its compact fallback
is centred at `Y=872`.

For every face shot, track the face/head through the complete segment instead of validating only
one frame. Prefer the caption below the head and maintain at least `32 px` of face-to-card
clearance (`48 px` preferred). Use `expertSplitFallback` above the face only when a legal lower
slot does not exist because of the detected head position or bottom UI pressure. The split and
podcast rectangles partially overlap in the proof graphic because they are mutually exclusive
format presets.

Handwritten/italic semantic callouts remain independent layers and must be collision-tested
separately.

## Files

- `instagram-reels-ui-proof-1080x1920.svg|json|png` — Instagram-shaped top navigation/profile,
  right heart/comment/share rail and lower profile/caption/navigation pressure.
- `tiktok-ui-proof-1080x1920.svg|json|png` — TikTok-shaped Following/For You header, profile and
  right action rail, caption/music/navigation pressure.
- `combined-ui-proof-1080x1920.svg|json|png` — union mask used for cross-posted masters. This is
  the default ONai release check.

The SVG is the editable source, JSON is the coordinate contract and PNG is a generated preview.
All three PNGs retain transparency.

## Review workflow

Overlay a proof file without changing the master:

```bash
ffmpeg -i master.mp4 -loop 1 -i \
  reference/platform-guides/ui-proof-overlays/combined-ui-proof-1080x1920.png \
  -filter_complex "[0:v][1:v]overlay=0:0:shortest=1" \
  -map 0:a? -c:a copy -c:v libx264 -crf 18 -preset fast qa-ui-proof.mp4
```

Use these acceptance checks at the hook, every layout transition, every full-screen talking-head
return and the CTA:

1. No critical element crosses `x=120` or `x=840`.
2. No critical element crosses `y=260` or `y=1360`.
3. Main subtitles occupy the matching compact preset: podcast `Y=960`, expert portrait
   `Y=1248`, expert split fallback `Y=872`, or full graphics `Y=536`.
4. Across every face shot, the active subtitle card stays at least `32 px` from the tracked
   face/head (`48 px` preferred) and never covers the eyes or mouth.
5. Heart/comment/share controls do not cover words, logos or active connectors.
6. Profile/navigation/caption controls do not cover the hook, CTA or italic callout.
7. Hide the overlay and export the untouched master.

## Regenerate PNG previews

The Windows ffmpeg build checked on `2026-08-31` exposes `svg_pipe` demuxing but no SVG decoder,
so the committed PNGs were generated with the copy of Sharp already cached by HyperFrames. Run
from the repository root:

```bash
export ONAI_SHARP_MODULE="$(find "$HOME/.npm/_npx" -path '*/node_modules/sharp' -type d | head -n 1)"
test -n "$ONAI_SHARP_MODULE"

node - <<'NODE'
const fs = require('fs');
const path = require('path');
const sharp = require(process.env.ONAI_SHARP_MODULE);
const dir = 'reference/platform-guides/ui-proof-overlays';

(async () => {
  for (const name of fs.readdirSync(dir).filter((item) => item.endsWith('.svg'))) {
    const input = path.join(dir, name);
    const output = input.replace(/\.svg$/, '.png');
    await sharp(input, {density: 96})
      .resize(1080, 1920, {fit: 'fill'})
      .png()
      .toFile(output);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
NODE
```

On a machine with `librsvg2-bin`, this shorter equivalent is also valid:

```bash
for file in reference/platform-guides/ui-proof-overlays/*-1080x1920.svg; do
  rsvg-convert -w 1080 -h 1920 "$file" -o "${file%.svg}.png"
done
```

Validate dimensions and alpha:

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,pix_fmt \
  -of default=noprint_wrappers=1 \
  reference/platform-guides/ui-proof-overlays/combined-ui-proof-1080x1920.png
```

Expected: `1080×1920` and an alpha-capable pixel format such as `rgba`.

## Evidence and limits

Official platform guidance supports full-screen `9:16` and keeping key messages inside the UI
safe zone, but neither organic interface is a permanent pixel contract:

- Meta Reels creative guidance: <https://www.facebook.com/business/ads/facebook-instagram-reels-ads>
- TikTok creative best practices: <https://ads.tiktok.com/help/article/creative-best-practices>
- TikTok in-feed safe-zone notes: <https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads>

The explicit ONai coordinates above are therefore project QA constraints, not a claim that every
platform build uses those exact pixels.
