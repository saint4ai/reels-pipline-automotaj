# Instagram Reels safe-zone guide

Version checked: `2026-08-31`. Canvas: `1080×1920`, square pixels, no rotation.

This guide is a review overlay, not a visible frame for the final Reel. Backgrounds and
non-semantic decoration may bleed to every edge. Important text, logos, CTA, faces' eyes and
active diagram nodes stay inside the critical-content rectangle.

## Why the side reserve is larger than Meta's published 6%

Meta's current Reels-ad guide asks creators to leave at least `14%` of the top, `35%` of the
bottom and `6%` on each side clear of text, logos and other important elements:

- <https://www.facebook.com/business/ads-guide/update/video/instagram-reels>
- <https://www.facebook.com/business/ads/facebook-instagram-reels-ads>
- <https://www.facebook.com/business/help/980593475366490>

The user's supplied published-Reel screenshot has a `590×1280` viewport. A 9:16 asset fitted
with `cover` is `720 px` wide at that height, so the viewport removes `130 px` in total. This is
`9.03%` per source side, or approximately `98 px` on a `1080 px` canvas. The white/black dashed
vertical lines in the overlay show that measured crop.

The final ONai critical zone is intentionally asymmetric:

- left edge: `x=108`;
- right edge: `x=864`, leaving extra room for Instagram's action rail;
- top edge: `y=269`;
- bottom edge: `y=1248`;
- podcast caption: `x=120–840`, `y=904–1016`, centred on `Y=960`;
- expert portrait caption: `x=120–840`, `y=1192–1304`, centred on `Y=1248`;
- expert split fallback: `x=120–840`, `y=816–928`, centred on `Y=872`, with a hard
  `32 px` gap before the speaker panel at `Y=960`;
- full-graphics main-caption lane: `x=120–840`, `y=480–592`;
- separate italic semantic-callout band: `x=200–820`, `y=1030–1160`.

The exact compact `112 px` production-card coordinates, layout exceptions and required keyframes are
defined in [adaptive-caption-placement-1080x1920.md](adaptive-caption-placement-1080x1920.md).
The `captionBand` in the JSON/SVG overlay remains the podcast seam review anchor.

These are internal constraints, not visible gutters. No side bars or safety marks are rendered
into the delivery master.

## Three content classes

1. **Critical content** — titles, subtitles, CTA, technology names, real logos and the active
   nodes of a diagram. Keep inside the acid-green rectangle.
2. **Supporting visual** — large objects and inactive branches that help explain the frame but
   are not required to read the claim. Keep inside the grey dashed rectangle and outside the
   right action rail whenever possible.
3. **Decorative bleed** — platinum gradient, grid, texture, light sweep and abstract background
   shapes. These may fill the complete 1080×1920 canvas.

## Files

- `adaptive-caption-placement-1080x1920.md` — production presets for podcast and expert
  captions, collision-aware layout exceptions and keyframe QA.
- `safe-zone-1080x1920.json` — source of truth for coordinates, provenance and calculation.
- `safe-zone-1080x1920.svg` — editable transparent overlay.
- `safe-zone-1080x1920.png` — generated alpha overlay for ffmpeg and NLE review (scale ×4/3 for 2K).

Generate a QA video and five guided frames without changing the master:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-reels-safe-zone.ps1 `
  -InputVideo "<master.mp4>" `
  -OutputDirectory "<project>\renders\qa" `
  -Open
```

```bash
bash scripts/check-reels-safe-zone.sh \
  --input '<master.mp4>' \
  --output-dir '<project>/renders/qa'
```

The scripts reject technical packaging errors (`1080×1920`, SAR, rotation and duration). They
do not pretend to identify text or semantic importance from pixels: final safe-zone compliance
is checked visually against the overlay.

This proof is Instagram-specific. A cross-platform delivery also requires the separate TikTok
and combined overlays in `../ui-proof-overlays/`, followed by an in-app preview; do not infer
TikTok safety from this guide.
