# Execution patterns and checks

## Caption geometry

Keep a fixed transparent safe lane, then one intrinsic-size box per phrase. Historical demo geometry: lane x120/y1140/w720, phrase `left:50%; translate:-50% 0; width:max-content; max-width:720px`. These lane coordinates are not the new default; use [montage-pattern-ru.md](montage-pattern-ru.md) and actual UI masks for wide-v2. Preserve intrinsic sizing: padding 17px top, 20px sides, 23px bottom, border 1px, radius 20px; backing width = rendered word span + 42px, not the lane width. Hidden phrases have no visible backing. Crossfade/translate each complete box by only 8px; do not animate font size.

Wrap each word in an inline positioned span. Add an underline child with left/right 0, bottom -7px, height 2px and left transform origin. On the master GSAP timeline animate scaleX 0→1 and alpha 0→1 over `min(.24, wordDuration*.5)` seconds (use a shorter minimum for truly short words); hold, then fade over at most .12s. Use actual start/end times after transcript alignment. Keep sentence gaps as pauses. Group simultaneous short-word transitions without dropping any word.

The reference stores samples under `glass.captionPhrases`, explicitly demo-only. A new production Reel must ingest the supplied recording, preserve its exact spoken words, align word times, and inspect late/missed underlines. An isolated dash has null timing and no sound. Do not copy demo timestamps into production.

## Motion and sound share one clock

Reveal .45–.60s power3.out; presenter travel .60–.75s power3.inOut; light sweep 1.6–2.2s sine.inOut; draw connector .45–.65s only after destination appears; exit .22–.28s then explicit hide for seek determinism. Objects continue between states rather than respawning randomly. These are defaults, not one transition stamped onto every sentence.

Give each perceptible animation event a sound assignment or group assignment. One transition may cover the outgoing scene, presenter movement and incoming title together. Do not stack separate effects for every CSS property or every frame of continuous reflections. Sound manifest records time, file, level and target objects; update it when motion timing changes.

Reference library: Kenney Interface Sounds, CC0, https://kenney.nl/assets/interface-sounds. Ten selected OGG files plus original license are cached at the demo's `assets/sfx/`. Local Caveat/OFL is in `assets/fonts/`. Keep source/license information when copying assets. Do not redownload the library per Reel or install a new animation framework for subtitle changes.

Useful pairings: glass_001/002 = glass object enters; minimize/maximize/open = layout travel; scroll_001 = flowing connection or handwritten note; select/click = endpoint/label; confirmation = meaningful result. `mix-sfx.py` decodes each source once, schedules events from the storyboard, gently filters and fades transients, and mixes one stereo WAV. No separate browser audio element for each tiny hit. The old `prepare-audio.py` is historical synthesized-v1 audio, not the current mixer.

Demo main events peak around -23 to -33 dBFS; word-underlining uses a very quiet -40 dBFS tick. These are demo balancing choices, not a loudness standard. On voiced material compare against intelligible speech and duck effects under it; never normalize the quiet effects stem to speech loudness. Verify the whole mix has headroom and audible intent. A mathematical peak check does not replace listening. If word ticks become distracting, ask/agree on reducing their level rather than deleting the required visual underlines.

## Layout and economical QA

Historical reference safe zone x120…840, y269…1248 was the old conservative preset, not an official universal Instagram/TikTok boundary. Latest design candidate is x108…972, y269…1536, minus actual UI obstacles: read [montage-pattern-ru.md](montage-pattern-ru.md) before using it. Existing V29 still enforces the old caption bottom; wide-v2 requires tested UI-aware integration, not merely widening a constant to obtain PASS. Background may bleed to edges; captions, face and significant labels may not overlap current UI masks. Prefer caption below tracked chin with ~40px gap, constrained by UI safety. If neither fits, change composition, not face coverage. No detected face is an unknown, not a PASS.

Before rendering:

1. Assemble from storyboard/parts; source and source-resolution stay untouched. Reference commands from repo root: `python3 scripts/assemble.py videos/liquid-glass-expert-v1`, `python3 videos/liquid-glass-expert-v1/mix-sfx.py`.
2. Run face sample QA and `node videos/liquid-glass-expert-v1/qa.cjs`. The latter checks all 420 DOM frames, caption intrinsic width and padding, stable 40px font, each word underline and contained geometry, safe areas and intersections, plus a backward/forward seek comparison. Face detections are sampled, not newly inferred on every DOM frame. Inspect the actual screenshots at phone scale as well.
3. Verify caption timing against speech when speech exists. Reference demo cannot pass that particular check because there is no new voice track.
4. Inspect cut boundaries and maximum underline extents. If the script reports any violation, fix it before export. Test short phrases and the longest phrase, not only the first frame.

Render through the repository's `scripts/render-safe.sh`, one worker and at most 4 CPUs, idle I/O and bounded RAM cache. No parallel full renders or PNG frame dump of an entire podcast. Cache images, fonts, SFX and displacement map. A single final high-quality export after cheap QA conserves resources; limiting CPU changes time, not resolution/quality settings. CRF16 is not mathematically lossless. Preserve original footage.

After rendering, inspect actual MP4 frames and overlay the interface guide for QA only; do not burn it into the final. Check video/audio streams, duration, clipping and the transitions in motion. Report measured verification scope honestly.

## Production integration

The style demo has `prototype.notForPublication`; do not ship it as spoken content. The recorded `reels-11-claude-sales-glass` adds `speakerWindow.motionMode=liquid-glass`, real states/moves and a `tracked-face` caption policy. V4 accepts only current input-hashed, full-frame layout/face proof; V24 still checks actual moves. V27 consumes observed GSAP object-motion and screen-recording intervals, excluding ambient material sweeps. Missing/stale proof blocks export approval; no blanket validator exemption. Run the production project's `qa.cjs` after assembly, then normal `pipe.py build`. Passing composition checks is not evidence of final MP4 inspection or cloud upload.
