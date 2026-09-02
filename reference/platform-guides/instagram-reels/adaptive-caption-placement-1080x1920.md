# Adaptive caption placement for expert Reels

Canvas: `1080×1920`. This rule defines the production position of the subtitle card; the
safe-zone overlay remains a QA layer and is never burned into the master.

## Format presets

| Format / layout | Caption centre | Card geometry | Use |
|---|---:|---|---|
| Podcast | `50%` = `Y 960` | `x=120`, `y=904`, `w=720`, `h=112` | Separate format; it must pass source-specific head clearance. |
| Expert split fallback | `45.42%` = `Y 872` | `x=120`, `y=816`, `w=720`, `h=112` | Hard `32 px` gap before speaker panel at `Y=960`. |
| Expert Reel, portrait talking head | `65%` = `Y 1248` | `x=120`, `y=1192`, `w=720`, `h=112` | Speaker card is `x=120…864`, `y=260…1160`; hard chin gap 32 px, preferred 48 px. |
| Expert Reel, full graphics | top `Y 480` | `x=120`, `y=480`, `w=720`, `h=112` | Dedicated lane without a speaker. |

The `Y=960` and `Y=1248` values are nominal anchors, not face-safe approvals. Sparse tracking
overrides them for each source clip.

## Separate italic semantic-callout lane

Display-style italic callouts are not part of the main subtitle container. Their reserved safe
band is `x=200–820`, `y=1030–1160`.

- Keep the complete italic glyphs, underline, shadow and entry motion inside that band.
- Use this lane for one semantic word or a short phrase that clarifies the current diagram.
- Do not duplicate the main caption or place generic decoration in the lane.
- Do not show this callout simultaneously with the split main caption when their bands touch at
  `Y=1030–1048`; schedule it during a full-graphics or caption-free beat.
- In a full-graphics scene the callout ends at `Y=1160`, exactly where the main-caption lane
  begins. Neither layer may cross the boundary.

## Collision handling

Apply the nominal preset, then run `scripts/face-caption-clearance.py` before render.

- Expert portrait: caption top must be at least `chinY + 32 px` (`48 px` preferred);
  head/face/eye overlap after the actual object-fit crop is forbidden.
- With combined bottom UI beginning at `Y=1360`, a `24 px` reserve and `112 px` wrapper, the last
  legal top is `Y=1224`.
- If that space does not exist, switch to split/full-graphics; never cover mouth or beard.
- Expert top/bottom split uses the reviewed compact `Y=872` fallback. Podcast `Y=960` is not
  reused as the expert split preset.
- A full-graphics frame reserves the lower main-caption lane before placing diagram nodes. If an
  active node enters it, rearrange the diagram rather than inventing a caption position.
- For a full-screen speaker, correct crop and speaker scale before abandoning the `65%` preset.
  The subtitle must not cover the eye–nose–mouth focus area.
- If a platform overlay still proves a collision, create a reviewed platform-specific adaptation;
  do not vary the canonical master from phrase to phrase.
- Animate between approved positions on layout transitions; captions must not jump while the
  speaker remains in the same composition.

Face/head clearance and platform proof are authoritative over the nominal anchor.

## Side-safe and platform constraints

- Use `x=120–840` (`720 px` wide) for the combined Instagram+TikTok master. The older
  Instagram-only `x=120–864` card exceeds the combined right boundary by `24 px`.
- Keep every critical glyph inside that same interval. Do not let italic emphasis, shadows or
  word-pop animation enter the right action rail beginning at `x=864`.
- Background and decoration may bleed to the canvas edges; subtitles may not.
- `centerY=1248` is an organic expert-Reel composition rule, not a blanket paid-ad guarantee.
  Its compact card ends at `Y 1304`; paid use still requires its own platform proof.
  companion guide. Re-check or raise the card before reusing the master as a paid Reels ad.

## Measured source audit: IMG_7333

Sparse Haar analysis sampled `54` frames (one per second) from `1596` source frames and detected
the primary face in `54/54` samples.

- transformed expert-portrait chin: `Y=851…1110`;
- expert portrait `Y=1248`: `PASS 54/54`;
- compact expert split `Y=872`: `PASS 54/54`;
- short title portrait: the first `y=540–1200` crop failed at `03.0–04.0s`; after shortening
  the speaker-card to `y=540–1160`, the repeated gate is `PASS 7/7`.

Artifacts: `videos/vibecoding-stack-2026-img7333/analysis/face-head-trajectory.sample-1s.*`,
`face-caption-clearance.md` and `face-caption-clearance-contact-sheet.jpg`.

## Required QA keyframes

Before final render, capture and inspect at least these frames with the Instagram published-crop /
safe-zone overlay enabled. If the same master will ship to TikTok, repeat the inspection with the
TikTok and combined files in `../ui-proof-overlays/`, then use an in-app preview; the Instagram
proof is not transferable:

1. first stable frame of the full-screen talking head;
2. first stable frame after every top/bottom split transition;
3. the frame with the largest face scale;
4. the densest full-graphics frame;
5. the final CTA frame;
6. one frame on each animated caption-position transition.

For every keyframe confirm:

- the card uses a tracker-approved lane (`872`, `960` or `1248`), not merely a nominal preset;
- expert portrait card starts at least `32 px` below chin (`48 px` preferred), or layout switches;
- no caption covers the face's eye–nose–mouth focus area;
- cross-platform critical text remains within `x=120–840`;
- the right action rail and lower Instagram UI do not obscure the caption;
- the card does not cover an active diagram node, logo or CTA;
- the italic semantic callout remains inside `x=200–820`, `y=1030–1160` and does not touch the
  main-caption card;
- the subtitle remains readable over its intended backdrop at full resolution.

Do not approve placement from the HTML preview alone. Review extracted keyframes and the
proof video produced by `scripts/check-reels-safe-zone.*`.
