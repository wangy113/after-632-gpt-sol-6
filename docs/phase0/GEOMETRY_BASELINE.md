# WebGL2 geometry baseline · 2026-10-14

The plan targets roughly **under 150 draw calls and 800,000 triangles per frame on Balanced, including the shadow pass**. This is a baseline for the current gray-box room, not a Balanced-tier or shadow-inclusive result.

Run from a clean checkout with Node.js 22.12 or later and system Chromium available:

```sh
npm ci
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run measure:geometry
```

The command builds the production bundle, serves it locally, and opens Chromium 154 with SwiftShader's WebGL2 fallback (`?gl=1&metrics=1`). It fixes the viewport at 1440 × 900 CSS pixels, device pixel ratio 1, reduced motion, the default Qwantani morning sky, and an 864 × 486 canvas buffer. At each date it samples the starting doorway and yard camera poses. After each selection it turns right and back left, then reads the settled frame's counters; this also warms the rendering path. Date dissolves and place glides are bypassed by reduced motion. The opt-in `metrics` query copies `renderer.info.render` values onto the canvas as `data-draw-calls`, `data-triangles`, and `data-render-calls` immediately after a visible frame.

| Date | Place | Draw calls | Triangles | Renderer calls |
| --- | --- | ---: | ---: | ---: |
| 632 | Doorway | 61 | 3,077 | 2 |
| 632 | Yard | 67 | 3,273 | 2 |
| 661 | Doorway | 35 | 2,949 | 2 |
| 661 | Yard | 53 | 3,545 | 2 |
| 680 | Doorway | 33 | 2,501 | 2 |
| 680 | Yard | 48 | 2,781 | 2 |

The highest sampled draw count is **67** and the highest sampled triangle count is **3,545**; they occur in different frames. No sampled frame exceeds either numerical target. These counters represent issued draw calls and submitted mesh triangles, including the fullscreen output draw used for tone mapping. They do not measure shaded pixels, GPU time, or frame rate. The three.js r186 renderer runs its own animation tick and normally resets these counters there; measurement mode disables that reset, resets immediately before each application frame, and reads the totals immediately after it. Shadow draws would enter the same counters through nested renderer calls.

**No shadow pass runs on a normal visit.** The renderer leaves `shadowMap.enabled` at its default `false`, and the directional light does not cast shadows. Mesh `castShadow` flags alone do not start one. The prototype also has no Balanced quality tier. This baseline therefore cannot establish the plan's shadow-inclusive performance budget. It excludes the two offscreen scene renders that prepare an animated date dissolve and the intervening fullscreen blend frames; those are separate transient costs. The other two standing places, real WebGPU hardware, a Chromebook, and a phone were not sampled here.

## Small diagnostic shadow check · 2026-10-14

The `?shadows=1` flag enables one directional shadow pass for inspection; it is off on normal visits. This diagnostic uses a 1024 × 1024 shadow map and a 20-unit-wide orthographic shadow camera. Run the normal measurement command above, then:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run measure:geometry -- --shadow-doorway
```

With the same production build and 632 doorway pose, the default frame measured **61 draw calls, 3,077 triangles, and 2 renderer calls**. The diagnostic shadow frame measured **90 draw calls, 4,393 triangles, and 3 renderer calls**: an increase of 29 draws and 1,316 submitted triangles. The extra renderer call confirms that the shadow pass ran. The shadow frame remains below the plan's numerical draw and triangle limits, but this single gray-box pose does not validate the future Balanced tier or other views. Frame time has not been reviewed.

## Matched doorway shadow images · 2026-10-14

Run `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run capture:shadow-pair` to build and capture the default and `?shadows=1` views. The script fixes the 632 doorway camera at `(0, 1.6, 0.5)`, yaw `0`, pitch `-0.3`, with the Qwantani morning sky, 1440 × 900 viewport, DPR 1, reduced motion, and WebGL2 via SwiftShader. Both canvas buffers are 864 × 486. It checks that the pose matches and the shadow capture has one extra renderer call. The linked PNGs include the same 864 × 487 CSS canvas area:

| Default: shadows off | Diagnostic: shadows on |
| --- | --- |
| [View full-size image](632-doorway-shadow-off.png) | [View full-size image](632-doorway-shadow-on.png) |
| ![632 doorway without shadows](632-doorway-shadow-off.png) | ![Same 632 doorway with diagnostic shadows](632-doorway-shadow-on.png) |

In this pair, the shadow pass darkens the back wall and much of the floor. A bright, hard-edged doorway patch crosses the near floor and sharp prop shadows draw attention toward it. The unfinished mat circle, three cups, and footprints on the right remain visible, but the mats and cups separate less clearly from the darker floor. No object disappears or changes position. A narrow bright line along the left wall edge is visible in the shadow image; the image alone does not establish whether it is a shadow-map artifact or a geometry/light leak.

Keep shadows off on normal visits. Before widening this diagnostic to other dates or viewpoints, investigate that wall edge and a less dominant light/shadow balance at the same pose, then check that the three imagined traces stay legible. This one software-rendered view cannot establish real-device performance or the future Balanced tier.
