---
name: onai-liquid-glass-expert
description: Build and refine ONai expert Reels with the real presenter, platinum Liquid Glass graphics, compact word-underlined subtitles and synchronized sound design. Use for this montage format, not spoken-script writing or the schematic puppet-head format.
---

# ONai Liquid Glass Expert

Use this format when Alexander asks for the approved platinum/glass expert montage. Current user corrections override the defaults here; do not apply these material choices to unrelated formats.

## Latest scale correction — shared with Claude Code

Read [the complete Russian montage pattern](references/montage-pattern-ru.md) before implementing this format. It is the current shared instruction for Claude Code and Codex. Alexander rejected the narrow layout and small objects: use the render-proven profile in [layout-wide-v3.json](references/layout-wide-v3.json), a normal presenter around 336 px, larger meaningful graphics, and unchanged 40 px captions. Approximate bottom 20% / right 10% margins are design intent, not certified platform safety; actual UI masks override them. Reels11 remains a material/motion implementation reference, not the latest scale default. This rules revision does not itself rerender its MP4 or migrate production validators.

## Working source

In `reels-montage-pipeline`, read `CONTEXT.md` and the applicable project instructions. The current recorded-Reel implementation is `videos/reels-11-claude-sales-glass/parts/glass.*` plus `storyboard.json`; `index.html` is assembled, not hand-edited. Its `DIRECTION.md` and `PORTRAIT-PATTERN.md` describe the moving square. The earlier `videos/liquid-glass-expert-v1` remains the material demo, not a production master. Installed copies of this skill are guidance, not a duplicate video project.

The user approved the visual direction, then requested content-fit gray subtitle backing, per-word underlines, a more expressive handwritten face and sound for animation events (09.09.2026). The 14-second demo uses muted earlier footage and sample captions: it is not a finished spoken Reel or evidence of speech synchronization.

## Decisions to preserve

- Keep the previously approved subtitle size. This demo uses Manrope 800 at **40 px / 1080×1920**. Do not enlarge it to signal premium quality. Keep the main subtitles in one upright font.
- **Backing follows the current line**, not the width of the safe-zone lane. Use intrinsic content width and about 20 px horizontal padding per side; center the resulting small pill. The lane itself has no background. Never keep the widest previous phrase as a minimum width. Split long phrases at spoken boundaries; do not crop or shrink text to fit.
- Current backing is neutral gray `rgba(73,77,84,.60)`, text `#f1f2f3`, 10 px blur, subtle edge/shadow. This is a starting point; verify contrast against actual footage without silently restoring the old dark 82% bar. Keep enough bottom padding for the underline.
- Underline **each spoken word** at its own recording timestamp, including short words. Reveal the line smoothly left-to-right, hold during the word, then fade. Keep glyphs stable: no bouncing, scaling or reflow for the active word. Punctuation alone is not spoken. Do not invent synchronization from equal subdivisions of a sentence.
- Handwritten accents use local **Caveat 600**, Cyrillic, separate from main subtitles. Use readable live text, not a screenshot of handwriting; roughly 52 px for this demo. Short meaningful notes only, not a second full caption layer.
- Platinum palette and restrained glass depth; orange = action, lime = result, red = actual error. Refraction affects only background/material, never faces, letters or service logos. Use authentic logos and original screen recordings; generic generated imagery must communicate an identifiable object.
- Latest approved presenter layout: a **persistent rounded square**, Screen Studio-like, smoothly travelling between available corners. Graphics lead. A moderately larger square may accompany a direct address or CTA; do not default to a full-screen portrait or hide the presenter. Crop surrounding source background only after checking the complete head throughout the recording. This exception does not permit cropping screen recordings. Re-measure each new source; never blindly reuse the previous crop coordinates.
- **Vary backgrounds by meaningful sections**, not one platinum gradient for the whole Reel. Approved family: light platinum; graphite with restrained orange illumination; deep blue; warm platinum. Crossfade around .55 s, no white flash. Keep glass, typography and presenter treatment consistent. On dark backdrops use light heading plates, denser pale glass surfaces and light standalone notes. Inspect contrast during transitions too. See [references/backgrounds-and-portrait.md](references/backgrounds-and-portrait.md) when constructing this layout.

For implementation, audio and verification, read [references/execution.md](references/execution.md).

## Delivery boundary

An export is not publication authorization. Do not upload to social accounts, send DMs, change automations or push Git merely because this skill ran. Save changes within the montage task, preserve original media and report demo versus production status honestly. If the new recording is missing, finish the style demo and explain that real word timing and voice/SFX balance still need that recording.
