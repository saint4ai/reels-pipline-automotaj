> **С 21.09.2026:** раскладка, шрифты, размеры субтитров и геометрия спикера в этом файле — эпоха HyperFrames 1080×1920.
> Для новых роликов действуют `studio/src/formats.ts` и навык `.claude/skills/remotion-montage`. Отсюда берутся бренд, голос, рубрики и CTA.

# Personal Brand Content System — saint4ai × onAI

Last confirmed by the user: `2026-09-02`.

## Identity and positioning

- Creator: Александр / `@saint4ai`.
- Role: Founder of onAI Academy.
- User-confirmed authority line: practitioner with **4 years of experience** implementing AI in business processes and automation.
- Core promise: explain what AI agents and vibe coding can do and how people can apply them in real work and business.
- Supporting proof currently used publicly: 4 products in production without staff developers; onAI Academy; practical business automation cases.

## Mandatory content rule for podcast cuts

- Format: expert, review-oriented, pedagogical.
- The speaker and the argument remain primary.
- Do not use unrelated gameplay, meme feeds, Subway Surfers-style attention fillers, or other entertainment inserts that compete with expertise.
- Attention is retained through argument progression, semantic diagrams, evidence cards, central captions, controlled pattern interrupts, and meaningful sound design.
- Every finished podcast cut must contain a concise CTA, normally in the final `3–5 seconds`.

## Personal brand visual code

- Primary canvas: premium platinum gradient `#F7F6F2 → #E5E4E2 → #C8C6C1`, leaning light rather than dark.
- Primary ink and objects: near-black `#111214`.
- Light surfaces: `#F2F0EC` and `#F7F6F2`; muted ink: `#5F6265`.
- Orange: `#FF6A00` — attention, tension, action and hook; never use it to mean a final negative verdict.
- Negative red: `#C61F32` — failure, invalidity, rejection and strike-through only.
- Acid green: `#C7FF00` — verified connection, correct solution, result and CTA.
- Bright orange and acid green carry black text or act as thick markers/lines; do not use them as small text directly on platinum.
- Use a restrained 96 px technical grid at 6–8% visibility and one slow deterministic metallic light sweep. Avoid neon glows; prefer crisp lines and subtle 4–7 px offset shadows.
- Do not add pseudo-HUD chrome, fabricated case labels, fake timecodes, decorative progress timelines, or other interface-like metadata that says nothing. Every visible element must clarify the argument, provide evidence, orient the viewer, or support comprehension.
- Default 9:16 layout: speaker in the lower half; semantic animation canvas in the upper half.
- Captions use format presets: podcast split stays on the `50%` seam; expert Reels default to `65%` of frame height, exactly `15%` below centre, with only pre-reviewed collision exceptions.
- Caption typography uses two explicit roles:
  - Primary subtitle face: target `Benzin Bold/Black` when a licensed font file is supplied; current open project fallback is `Montserrat 900`.
  - Semantic emphasis face: `STIX Two Text 700 Italic` with Cyrillic support and OFL-1.1 licensing.
- Emphasize only `1–2` important words in a caption phrase. Italic words may receive a restrained `-1.2°` active rotation, `1.10×` scale, `9 px` lift and a short underline reveal.
- Italic emphasis is semantic, not decorative: use it for the central risk, result, proof, profession, number/year, or action to remember.
- Never fake italics with CSS skew when a real italic font is available.
- The italic display face is used primarily for separate handwritten-style semantic callouts inside the upper animation canvas, not as the base subtitle face.
- Main subtitles stay consistently typeset in the primary sans-serif. The approved treatment may retain only a restrained `1–2`-word italic accent inside a caption when it materially improves emphasis.
- A large display-style italic semantic callout is always a separate canvas layer in its own safe
  band; the restrained inline accent above is not a substitute for that callout layer.

## Content ecosystem

The profile header contains four main destinations. Do not attempt to say all details aloud in every Reel; rotate one primary destination and show the remaining destinations visually.

1. **Blog** — longreads, cases, prompts, tutorials and analysis about vibe coding, Claude Code, AI agents and automation.
   - URL: `https://onai.academy/blog/`
   - Primary keyword CTA: `БЛОГ`.
2. **Free vibe-coding workshop** — beginner-friendly starting point and practical lifehacks.
   - Exact public URL: pending confirmation from the user/profile link hub.
3. **Podcast** — how to apply vibe coding and AI in business, including episodes with Александр.
   - Exact public URL: pending confirmation from the user/profile link hub.
4. **Telegram channel** — the regular Telegram channel is named `Vibe lab by saint4ai`; it contains ready-to-use solutions, practical notes and current findings.
   - Never call it «опуск», «клапан», «опуск-клапан» or use any similar misheard wording.
   - In spoken CTA copy, use either `Telegram-канал` or the exact name `Vibe lab by saint4ai`.
   - Public link found on the blog: `https://t.me/strogo_na_opuse`.

Always retain an Instagram follow cue as the account-level CTA:

- Instagram: `@saint4ai`.
- Promise: stay current on new AI technologies and their practical application.

## CTA architecture

### Rule

- One spoken primary CTA per Reel.
- Maximum spoken duration: `5 seconds`.
- Remaining destinations appear as short on-screen labels/icons, not as a long spoken list.
- Select the primary CTA according to the Reel topic.

### CTA rotation

**Blog-first — default for expert podcast cuts**

> Напиши «БЛОГ» — пришлю статьи и гайды. Всё остальное — в шапке.

**Ecosystem overview**

> Блог, воркшоп, подкаст и Telegram — всё в шапке. Подписывайся.

**Business/podcast topic**

> Подкаст про вайбкодинг в бизнесе — в шапке. Подписывайся.

**Beginner topic**

> Начинаешь с нуля? Бесплатный воркшоп по вайбкодингу — в шапке.

**Practical solution topic**

> Готовые решения забирай в Telegram. Ссылка — в шапке.

### Outro visual contract: 3–5 seconds

- Speaker remains visible in the lower half.
- Upper canvas shows a compact `2×2` resource map: `Блог / Воркшоп / Подкаст / Telegram`.
- Only the primary destination receives acid-green emphasis.
- Keyword chip `БЛОГ` uses orange or acid green depending on the preceding scene.
- Persistent final line: `@saint4ai · практический AI для бизнеса`.
- Optional authority micro-line earlier in the Reel, not crammed into the CTA: `4 года внедряю AI в бизнес`.

## Script delivery format

- By default, deliver every finished spoken script as a plain `.txt` file in the current user's operating-system Downloads directory, resolved at runtime without a hardcoded username.
- The file must contain only the words the speaker should say, with natural paragraph breaks.
- Do not use Markdown headings, bullets, tables, production notes, timing notes or editing instructions inside the spoken-script file unless the user explicitly asks for them.
- Create a Google Docs version only when the user explicitly requests Google Docs for that script.

## Adaptive caption placement

- Canvas: `1080×1920`; cross-platform compact caption wrapper: `x=120`, `w=720`, `h=112`.
- Podcast/split `Y=960` and expert talking-head `Y=1248` are nominal anchors, never automatic
  face-safe approvals.
- Expert portrait contract: wrapper `x=120–840`, `y=1192–1304`, centre `Y=1248`; it starts
  at least `32 px` below transformed chin (`48 px` preferred) and never intersects conservative
  head/face/eye boxes. If it cannot end before bottom UI, switch layout.
- Expert split fallback: `x=120–840`, `y=816–928`, centre `Y=872`; speaker panel begins at
  `Y=960`. Podcast keeps its separate `x=120–840`, `y=904–1016`, centre `Y=960` preset.
- Full-graphics main-caption lane: `x=120–840`, `y=480–592`; diagrams reserve it before animation.
- Separate italic semantic-callout safe band: `x=200–820`, `y=1030–1160`. A display callout is a separate canvas layer, not a replacement font for the main subtitle container.
- Do not run a separate italic callout simultaneously with the split caption when their bands touch; schedule it on a full-graphics or caption-free beat.
- Animate between approved positions with the layout transition; the caption must not jump independently.
- Keep captions horizontally centred and above scene layers with a stable foreground layer.
- Use the approved black caption backing at `30%` opacity (`rgba(4,4,4,.30)`); do not darken it without a contrast failure in QA.
- Exact geometry, collision rules and QA frames: `reference/platform-guides/instagram-reels/adaptive-caption-placement-1080x1920.md`.
- Sparse source-video gate: `scripts/face-caption-clearance.py`. A missing detection requires
  manual review; it never defaults to PASS.

## Reels publishing safe-zone QA

- Keep the delivery master at `1080×1920`, `9:16`, square pixels and zero rotation. A larger export does not prevent viewport cropping.
- Before delivery, generate a review copy with `reference/platform-guides/instagram-reels/safe-zone-1080x1920.png`; never burn the guide into the final master.
- The user-supplied published-Reel screenshot is `590×1280`. When Instagram fills that tall viewport with a 9:16 asset, it crops approximately `98 px` from each side of a 1080-wide master.
- Background gradient, grid, texture and non-semantic decoration may bleed across the full frame.
- Keep supporting visuals within `x=100–980`; a cropped edge must not change the meaning.
- Keep Instagram-only critical content within `x=108–864`, `y=269–1248`; cross-platform
  Instagram+TikTok text uses the narrower proof range `x=120–840`, `y=260–1360`.
- Treat `x>864` as the Reels action-rail risk area. Faces and large non-text objects may enter it only when the eyes and essential details remain outside it.
- Caption anchors are approved only after face/head and platform proof. For the current
  `IMG_7333` source, sparse QA detected the face in `54/54` samples. After the actual portrait
  reframe, expert `Y=1248` and split fallback `Y=872` pass `54/54`. The first short-title crop
  failed at `03.0–04.0s`; after shortening its speaker-card to `y=540–1160`, the repeated title
  gate passes `7/7`.
- These are internal padding constraints, not visible side bars. The final Reel stays full-bleed.
- Meta publishes `14%` top, `35%` bottom and `6%` side clearances for Reels ads. Organic Reels have no fixed official pixel safe zone, so the project combines that conservative ad guide with the measured crop from the user's real viewport.
- Source ledger and calculations: `reference/platform-guides/instagram-reels/safe-zone-1080x1920.json`.
- A cross-platform master also requires the separate TikTok and combined review overlays from
  `reference/platform-guides/ui-proof-overlays/`, followed by an in-app preview. Never treat the
  Instagram overlay as proof of TikTok safety, and never burn a proof overlay into the master.

## Stock transition contract

- Use a stock transition only on a structural cut, with a target spacing of one per `6–10 seconds`.
- Duration: `4–10 frames` at `30 fps`; overlay opacity: maximum `70%`.
- Timing, frame selection and transforms must be deterministic.
- Exclude stock source audio by default. If it has deliberate semantic value, duck it by
  `12–18 dB` beneath the presenter and verify speech intelligibility.
- Reject every watermarked frame, including a watermark visible for only one transition frame.

## Stable Windows rendering

- On Windows, do not render with the cached `chrome-headless-shell.exe`: its browser, GPU, network and renderer child processes may each expose a visible console window.
- Use the repository wrapper `scripts/render-hyperframes-hidden-windows.ps1`, which points `HYPERFRAMES_BROWSER_PATH` to regular Google Chrome or Microsoft Edge for headless capture.
- Default to one capture worker, software browser rendering and GPU video encoding. This avoids console-window storms and reduces browser restart risk while retaining fast NVENC output.

## Public-site consistency note

As of `2026-08-31`, the user confirmed **4 years** of experience. Some existing public onAI copy still says **3 years**. Use the latest user-confirmed 4-year figure in new scripts, and flag the website mismatch before updating public pages.

## Confirmed 2026-09-02 (supersedes conflicting lines above)

- Brand lime is `#B6FF00` (history/DECISIONS.md). `#C7FF00` used in frame.md and templates is not the brand colour.
- Fonts: H1 **Benzin**; H2 and **captions Gilroy**; **STIX Two Text Italic** only for emphasised words. Soyuz Grotesk not in use for now. Montserrat and IBM Plex Mono are not approved (they were fallbacks while font files were missing). Files: `fonts/`, install with `scripts/fonts.sh`.
- Captions: three words per group, size 66, in every format.
- Dynamics: visual blocks illustrate speech without pauses; the speaker layout changes at least every 10 s (bottom → up with the interface full-canvas → half again). The old "3 s bare head every 15 s" rule is cancelled. No intro/outro plates: montage and captions start with the first spoken word.

## Sources inspected

- `https://onai.academy/blog/`
- `https://onai.academy/blog/services/`
- `https://onai.academy/guidevc/`
- `https://t.me/strogo_na_opuse`
