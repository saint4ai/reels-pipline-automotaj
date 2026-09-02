# Face-aware caption QA

Run this gate before a full render whenever the composition contains a visible speaker and
subtitles. A fixed percentage anchor is only a design preference; it is never proof that the
caption is face-safe.

## Required process

1. Detect the primary face throughout the source at intervals no wider than one second. Also
   inspect every caption onset, layout transition, largest-face moment and fast head movement.
2. Derive conservative head and eye regions, then transform them through the exact production
   crop (`object-fit: cover`, scale, offset and clipping). Source-video coordinates alone are not
   sufficient.
3. Prefer the caption below the transformed chin. Use a hard `32 px` gap and target `48 px` on a
   `1080×1920` master; scale these gaps proportionally for another canvas.
4. Keep the complete caption inside the active Instagram/TikTok proof rectangle. If the slot
   below the chin collides with bottom UI, reframe the speaker or switch layout. Never move text
   onto the eyes, mouth, beard or microphone.
5. In a top/bottom split where a below-chin lane is impossible, place the compact caption above
   the speaker panel and preserve the same hard separation from the panel/head.
6. A missing or uncertain face detection is `MANUAL_REVIEW`, never an automatic pass.
7. Capture a contact sheet with platform UI proof overlays. Do not launch the full render until
   every active speaker interval passes and the user has not asked to keep rendering paused.

## Repository implementation

When available, run `scripts/run-face-caption-qa.sh [project-directory]`. It creates a JSON/CSV
trajectory, a verdict report and an annotated contact sheet without rendering the composition. The project
`storyboard.json` owns the final caption and speaker rectangles; keep the script, storyboard,
composition and platform overlays synchronized.

For the ONai `1080×1920` expert preset, the validated defaults are:

- portrait caption: `x=120`, `y=1192`, `w=720`, `h=112`, `centerY=1248`;
- portrait speaker card ends at `Y=1160`;
- split fallback: `x=120`, `y=816`, `w=720`, `h=112`, `centerY=872`;
- split speaker panel begins at `Y=960`;
- podcast `centerY=960` is a separate format and still requires source-specific face QA.

These values are reusable presets, not permission to skip tracking.
