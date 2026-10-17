# Opt-in sky-aligned sun preview · 2026-10-17

The two pinned Qwantani HDR skies have been backgrounds only: the room uses a fixed white directional light aimed from `(-3, 8, 5)` toward `(0, 0, -2)`, plus white ambient light at intensity 1.2. Exact `?light=sky` now places that directional light along the selected sky's measured sun direction and sets its normalized linear RGB color. The directional intensity stays at 2.0 and ambient lighting stays fixed so the two URLs isolate direction and color. Ordinary visits and unrecognized `light` values keep the previous fixed light. Neither path enables shadows unless the separate `?shadows=1` diagnostic is present.

For a visible side-by-side comparison, open [fixed light with shadows](https://wangy113.github.io/after-632-gpt-sol-6/?shadows=1) and [sky-aligned light with shadows](https://wangy113.github.io/after-632-gpt-sol-6/?shadows=1&light=sky), enter the room, and select the same date and place. The [Normal sky-aligned URL without shadows](https://wangy113.github.io/after-632-gpt-sol-6/?light=sky) and [Low sky-aligned URL](https://wangy113.github.io/after-632-gpt-sol-6/?tier=low&light=sky) are also available. The alternate `?sky=qwantani_mid_morning_puresky` uses that candidate's own analyzed sun.

## Reproducible sun analysis

`scripts/analyze-sky.mjs` verifies the byte size, MD5, and pinned source URL for each committed 1k HDR, decodes linear RGB with Three r186's `HDRLoader`, finds the highest luminance pixel, and maps its file position through Three's unrotated equirectangular convention. It writes `src/render/skyAnalysis.json`. `npm run analyze:sky` checks that committed JSON byte for byte against the pinned HDRs; the asset gate also runs this check. Synthetic raster tests check the direction quadrants, color normalization, and rejection of a dark image. The source peak is far brighter than the rest of either sky: these are identifiable compact sun disks rather than a diffuse sky maximum.

| Pinned 1k sky | Peak pixel in 1024 × 512 | World direction toward sun | Approximate elevation | Unit-luminance linear RGB |
| --- | --- | --- | ---: | --- |
| Qwantani morning | `(614, 198)` | `(0.759, 0.346, 0.552)` | 20.2° | `(1.183, 0.974, 0.716)` |
| Qwantani mid-morning | `(614, 141)` | `(0.617, 0.646, 0.449)` | 40.3° | `(1.054, 0.993, 0.907)` |

Low displays the pinned 512 × 256 derivative of the selected HDR, while the shared light direction comes from its pinned 1k source. This does not add a room asset request. The measured color is scaled to unit luminance before the prototype light receives it: **the existing intensity 2.0 is an artistic control, not a physical conversion from HDR radiance.** A clamped environment map, irradiance bake, and a light probe grid remain future work. These skies are modern stock images for a visual test, not evidence of seventh-century light or weather.

## Matched local views

Run `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run measure:sky-light` to reproduce the matched captures. The script uses a fixed 1440 × 900 viewport at DPR 1, reduced motion, the WebGL2 fallback on SwiftShader, and opt-in diagnostic shadows. It checks each camera pose, drawing buffer, asset list and response size before comparing the fixed and sky-aligned images. These checks do not measure a physical device or GPU frame time.

| Matched pose | Normal fixed / sky-aligned | Low fixed / sky-aligned |
| --- | --- | --- |
| Morning, 632 doorway | [Fixed](sky-light-normal-qwantani_morning_puresky-fixed-632-doorway.png) / [sky-aligned](sky-light-normal-qwantani_morning_puresky-sky-632-doorway.png) | [Fixed](sky-light-low-qwantani_morning_puresky-fixed-632-doorway.png) / [sky-aligned](sky-light-low-qwantani_morning_puresky-sky-632-doorway.png) |
| Morning, 680 yard | [Fixed](sky-light-normal-qwantani_morning_puresky-fixed-680-yard.png) / [sky-aligned](sky-light-normal-qwantani_morning_puresky-sky-680-yard.png) | [Fixed](sky-light-low-qwantani_morning_puresky-fixed-680-yard.png) / [sky-aligned](sky-light-low-qwantani_morning_puresky-sky-680-yard.png) |
| Mid-morning, 632 doorway | [Fixed](sky-light-normal-qwantani_mid_morning_puresky-fixed-632-doorway.png) / [sky-aligned](sky-light-normal-qwantani_mid_morning_puresky-sky-632-doorway.png) | [Fixed](sky-light-low-qwantani_mid_morning_puresky-fixed-632-doorway.png) / [sky-aligned](sky-light-low-qwantani_mid_morning_puresky-sky-632-doorway.png) |
| Mid-morning, 680 yard | [Fixed](sky-light-normal-qwantani_mid_morning_puresky-fixed-680-yard.png) / [sky-aligned](sky-light-normal-qwantani_mid_morning_puresky-sky-680-yard.png) | [Fixed](sky-light-low-qwantani_mid_morning_puresky-fixed-680-yard.png) / [sky-aligned](sky-light-low-qwantani_mid_morning_puresky-sky-680-yard.png) |

All eight local visits requested exactly seven tier-matched room assets, with HTTP 200 and no page or request errors. Within each sky and tier, fixed and sky-aligned visits transferred identical encoded room asset bytes: 2,390,880 for Normal morning, 2,371,456 for Normal mid-morning, 1,105,820 for Low morning, and 1,096,928 for Low mid-morning. Matched fixed/sky frames each submitted 90 draws at the 632 doorway and 100 at the 680 yard. The 864 × 486 drawing buffer and camera pose match within each pair. In Normal, 31.07% of doorway pixels and 75.17% of yard pixels changed under the morning sky; for mid-morning those fractions were 24.87% and 75.21%. Low fractions were nearly the same. Pixel fractions indicate the area affected, not improved quality.

In the morning pair, the sky-aligned low sun moves a broad angular lit area to the left wall and across the front mats. The 632 cups and right-side footprints stay visible, but the front mat is split by a hard light boundary. In the yard, the palm shadow shifts largely out of the captured center and a large diagonal wall shadow appears on the right. Mid-morning changes the boundary and color less at the doorway, yet still shifts the yard shadows strongly. These local images expose a composition and shadow-balance problem for review; they do not support making this light the default.

## Decision and limits

Keep fixed lighting on ordinary visits. The sky-aligned light is a controlled direction/color study, and the current diagnostic shadows already show a bright floor patch and a left/back-wall corner artifact. The shifted hard boundaries and yard shadow need a better lighting balance before any wider use. Review trace contrast and doorway composition with people before deciding whether to adopt sky-derived lighting. Participant and instructor review remains open, as do physical-device timing and screen-reader checks.
