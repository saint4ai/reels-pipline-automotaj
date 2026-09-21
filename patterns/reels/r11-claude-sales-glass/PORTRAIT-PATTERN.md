# Persistent square presenter — Liquid Glass

Historical geometry of the delivered Reels11 master. A later user correction requests larger objects, more usable space and a larger presenter. For future montage read [the current shared pattern](../../skills/onai-liquid-glass-expert/references/montage-pattern-ru.md) and its `layout-wide-v2.json`. The 236px sizes below document this existing export; they are no longer the default. This rules update does not rerender the MP4.

User correction, 09 September 2026: graphics lead; the real presenter stays visible in a compact rounded square with smooth movement. This project overrides the earlier large/full portrait preset, not the screen-recording contain policy.

## Geometry

1080×1920 composition. Crop viewport in the prepared speaker source: x0, y240, width1080, height1080. CSS cover with object-position 50% 28.5714286% produces this square because the source has 840 excess vertical pixels. No source file is destructively cropped. These values are recording-specific, not a reusable blind default.

Five states: P (500,732,336²); R (604,900,236²); L (120,900,236²); TL (124,274,236²); TR (604,274,236²). All states share one aspect ratio. Initialize the transform immediately with gsap.set as well as the timeline set: seeking to exactly zero must not put the speaker at canvas origin. One controller owns x/y/scale, duration .68 s power3.inOut. No opacity blink and no second video decoder.

Reflow headings for upper placements. Reveal new objects after the presenter finishes travelling when their paths might cross. Check the entire window as well as the face; a clear face does not justify putting a card over the rest of its frame. Include the raised starting positions of incoming objects, not only settled boxes.

## QA and economy

- Reuse the original ASR, video proxy, local brand assets, fonts and SFX; changing layout does not require retranscription or media transcoding.
- Face boxes every .25 seconds, with explicit manual review for failed/false detections. Validate all measured heads against the source crop; inspect contact sheets for hair/chin clearance. A new recording needs new measurements.
- Project those boxes through the actual DOM transform on all 2110 frames. Check permanent visibility, square aspect, CSS crop agreement, safe bounds, caption backing width, each of 181 underlines and all text/window collisions.
- Store input hashes. Missing, stale or failed proof blocks production. V27 uses actual GSAP object-motion intervals plus real recorded-video intervals; ambient light sweeps and subtitle activity do not disguise an empty scene.
- Render once after cheap QA: one worker, four CPUs maximum, lower CPU/I/O priority, RAM frame cache, 1080p30/CRF16. No parallel render storm, no PNG dump of the whole source.
- Inspect the exported MP4, not just HTML screenshots. Verify voice and footage duration, look at movement boundaries and overlay the platform guide for QA only.
- Copy to OneDrive only after export acceptance; report upload confirmed only on Cloud Files IN_SYNC for that exact MP4. Never publish Instagram or change account settings merely to deliver the file.
