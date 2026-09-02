# Platform review overlays

Safe-zone overlays are platform-specific QA layers. They are never visible in a delivery master
and one platform's proof never substitutes for another's.

- [`instagram-reels/`](instagram-reels/) — versioned Meta/Reels guide plus measured user-device
  crop and adaptive caption lanes.
- [`ui-proof-overlays/`](ui-proof-overlays/) — separate Instagram Reels, TikTok and combined
  transparent UI-pressure overlays for `1080×1920` review.

For a cross-posted master, generate and inspect both proofs. Background bleed may reach the frame
edge, but captions, italic callouts, CTA, real logos and active diagram nodes must survive each
platform's current controls and crop. The combined overlay is the default cross-posting gate;
the final in-app preview is still mandatory.
