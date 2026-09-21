# Approved variety, one visual identity

Alexander approved this family on 09 September 2026 after rejecting a monotonous single background. These are options within ONai Liquid Glass, not a requirement to use every background in every short.

| Environment | Useful role | Readability treatment |
|---|---|---|
| Light platinum | Opening, explanation, visual rest | Dark text, translucent pale glass |
| Graphite + soft orange light | Action, contrast, important turn | Pale heading plate and denser light glass; light standalone notes |
| Deep blue | Connectors, technical demonstrations | Same dark-scene text treatment; restrained texture |
| Warm platinum | Author's perspective, result, CTA | Dark text; orange action accent, not saturated orange everywhere |

Change on a spoken section boundary. Typical blend .55 s power2.inOut; use the same animation clock and group sound cue as the scene transition. Never flash white or add noisy random effects just to fill time. Keep the portrait stable and visible while the environment changes. Headings must remain readable during the crossfade, not just at its endpoints.

Current assets: user-supplied `ПАК APPLE/ПАК APPLE/Фоны/Блюр + Зерно.jpg` and `Синий.jpg`, cached as `assets/backgrounds/grain.jpg` and `blue.jpg` in Reels11. Their availability does not establish redistribution rights. Light and warm platinum are code gradients. This avoids new image-generation calls or multiple background video decoders. If another real footage background is selected, inspect it before reuse and preserve provenance.

## Persistent presenter

One real video layer, rounded square. Latest user correction enlarges the old 236px normal square: start around 304 px (normal range 280–320, emphasis 360–400 if space permits) on a 1080px-wide canvas. Read [montage-pattern-ru.md](montage-pattern-ru.md) for larger objects and the widened design area with real UI exclusions. Smooth .60–.75 s motion; graphics occupy the main free area. Corner travel or moderate emphasis scaling is allowed, not face-obscuring decorations. Upper placements require reflowing the heading; moving left/right requires keeping notes on the opposite side.

Track or sample head position over the source, include hair and chin margin, and choose a stable crop envelope where possible. A crop fitted to one screenshot is insufficient. Use measured tracking only when the head genuinely leaves that stable envelope, and smooth it to avoid jitter. On all timeline frames check the whole presenter window, projected face, captions and graphics, including moving entrance positions. Unknown face detection requires review, not automatic PASS.

For the historical recorded implementation and source-specific geometry, read `videos/reels-11-claude-sales-glass/PORTRAIT-PATTERN.md` in the montage repository. Neither its crop coordinates nor its old small display size is a universal default. Main subtitles stay at the approved 40px size for this format, with intrinsic-width backing and per-word underlines.
