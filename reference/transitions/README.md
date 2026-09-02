# User transition library

This directory contains the five transition sources supplied by the user on
2026-08-31. `manifest.json` is the machine-readable source of truth for hashes,
technical metadata, approved time windows, opacity, speed, rhythm, and audio
rules.

The source binaries are retained without transcoding. Canonical ASCII paths make
the library portable across Windows, WSL, Node, FFmpeg, and CI; the exact original
filenames remain recorded below and in the manifest.

## Source map

| Canonical repository file | Exact original filename | SHA-256 |
| --- | --- | --- |
| `source/light-glare-nmntzh.mp4` | `блики @nmntzh.mp4` | `0b584092ab133b1f48f19338735c0bea4577e5c31b43330d5ab2117166a85990` |
| `source/film-burn-demo.mp4` | `переход.mp4` | `15846795d35053d320cce23d4d1c3d59aff17565af5e1463c4e8aec65724f329` |
| `source/marker-scribble-nmntzh3.mp4` | `переходы_маркером_@nmntzh3.mp4` | `cc6e3a7b0667e9e6328889f60eac7e84a7e0429276ee9592d26cbaa2778e49ee` |
| `source/click-flash-a-dadaew.mp4` | `Переходы-клик.mp4` | `02b172c37bd5e4bc001e764ff8d3482bd5c78e8aff10c30a7ebc976f51da2a05` |
| `source/click-flash-b-dadaew.mp4` | `Переходы-клик2.mp4` | `f1942799b8a6212d6bd93eee10cd6e3277ad5f16fc606d4cce2d475873bc1a15` |

## Non-negotiable usage rules

1. Use only an `approvedWindows` interval from `manifest.json`. Never place an
   entire compilation on the timeline.
2. Every file is H.264 `yuv420p` without an alpha channel. For a source with a
   black background, trim first and then use `Screen` or `Lighten`; lowering
   opacity alone leaves a black veil over the composition.
3. The normal opacity band is 60–70%, with 70% as an absolute ceiling. A white
   flash is limited to 45–50%.
4. A transition must explain a real change: new chapter, new layout, new scene,
   contrast, error, reveal, or switch between talking head and diagram. Never
   randomize a transition on every cut.
5. Leave 6–10 seconds between stock transitions. Use no more than three film
   burns per 60 seconds and no more than one pure-white flash per Reel.
6. Embedded audio is muted by default. If a useful transient is deliberately
   isolated, mix it to roughly -18 to -12 dBFS peak and duck narration by no more
   than 1.5 dB.
7. Before final render, inspect every used frame at 1080x1920 with both Instagram
   Reels and TikTok UI overlays. Reject any burst that exposes a watermark,
   creator handle, promo copy, CTA, profile card, or unrelated baked lettering.
8. A transition must not cover the speaker's eyes, the active subtitle band, the
   hook, CTA, or key diagram labels.

## Preferred shortlist

Use these first; the remaining windows are conditional alternatives:

- `glare-core` — clean cold technology reveal;
- `burn-b-red-dark-gate`, `burn-d-red-shutter`, `burn-f-green-negative` —
  semantic film burns;
- `m3-corner-scribbles`, `m4-bottom-scribble` — only after watermark QA;
- `c4-dark-rainbow-blur`, `c7-dark-blue-smear` — subtle optical clicks;
- `k1-blue-orange-vertical`, `k4-dark-diagonal-wipe`,
  `k6-dark-optical-edge` — short expert-Reel cuts.

## Integrity check

Linux/WSL:

```bash
sha256sum reference/transitions/source/*.mp4
```

PowerShell:

```powershell
Get-ChildItem reference/transitions/source/*.mp4 |
  Get-FileHash -Algorithm SHA256
```

If any hash changes, update the technical metadata and repeat visual, watermark,
audio, and platform-overlay QA before approving the replacement.

## Provenance and rights warning

These assets were supplied by the user, but their publishing and commercial-use
rights have not been verified. Filenames and baked frames reference handles such
as `@nmntzh`, `@nmntzh3`, and `@dadaew_m`; the film-burn compilation also contains
promotional/profile material whose author is not established here.

Do not redistribute these binaries, remove attribution or watermarks, or publish
them in a deliverable until the user confirms the relevant license or supplies
clean licensed masters. A private repository is storage, not proof of a license.
