# Low antialiasing comparison · 2026-10-17

The Low tier now has two **opt-in** antialiasing diagnostics. `?tier=low&aa=off` disables the renderer's requested antialiasing. `?tier=low&aa=fxaa` renders the room or date blend into a half-float target, applies the normal AgX output conversion, then runs Three.js r186 FXAA over that image. Exact `?tier=low` keeps its existing antialiasing request, as does Normal; unknown or differently cased `aa` values do nothing. Changing Graphics through the visible controls clears `aa` and recreates the room at the selected date and place. The FXAA code loads only for its diagnostic URL.

## Matched local comparison

Run `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run measure:low-aa` to rebuild and refresh the nine captures below. The script opens a fresh browser context for each option, forces the WebGL2 fallback on Chromium SwiftShader, uses a 1440 × 900 viewport at device pixel ratio 1, selects reduced motion, and captures settled views at the same pose. It checks the canvas size, camera pose, sky, seven requested room assets, response bytes, and browser errors. `data-aa=msaa` labels the renderer request; this check does **not** read back a hardware MSAA sample count.

| Pose | Current Low | No AA | FXAA |
| --- | --- | --- | --- |
| 632 doorway | [PNG](low-aa-default-632-doorway.png) | [PNG](low-aa-off-632-doorway.png) | [PNG](low-aa-fxaa-632-doorway.png) |
| 661 pegs | [PNG](low-aa-default-661-pegs.png) | [PNG](low-aa-off-661-pegs.png) | [PNG](low-aa-fxaa-661-pegs.png) |
| 680 yard | [PNG](low-aa-default-680-yard.png) | [PNG](low-aa-off-680-yard.png) | [PNG](low-aa-fxaa-680-yard.png) |

All nine frames used an 864 × 486 drawing buffer. Each option requested the same seven Low texture and sky assets: 1,105,820 encoded response-body bytes in total. There were no page, request, or HTTP errors. The renderer reported two render calls in the current Low and no-AA settled frames, and three in FXAA, with one extra fullscreen draw. Those counters do not measure GPU time or memory; FXAA also allocates full-resolution half-float intermediate targets.

| Comparison with current Low | 632 doorway | 661 pegs | 680 yard |
| --- | ---: | ---: | ---: |
| No-AA pixels with any RGB difference | 1.39% | 0.35% | 1.73% |
| FXAA pixels with any RGB difference | 9.92% | 5.70% | 9.70% |
| FXAA mean absolute RGB-channel difference, 0–255 | 0.14 | 0.08 | 0.22 |

These are raw PNG comparisons, not quality scores. In the captured pegs view, disabling antialiasing makes the vertical wall edge visibly stepped; FXAA smooths it. Across the three poses, FXAA keeps the same objects and overall tones, with slightly softer edges than the current Low option. A separate local capture during a 661 pegs date dissolve, with the transition flag still true, showed no obvious exposure change between current Low and FXAA. The automated browser regression confirms the FXAA path completes date dissolves, place movement, Compare, resize, idle rendering, and an in-room Graphics change; it does not grade visual quality during every transition frame.

## Decision and limits

Keep the current Low option as the default and offer FXAA and no-AA as review links. The image pairs justify a direct quality comparison, but a software-rendered browser cannot establish whether FXAA meets the plan's phone or Chromebook frame-rate target, whether it uses less device memory, or whether people can read the dated traces as well. Before making FXAA the Low default, compare these options on the demo laptop, Chromebook, and phone using the [real-device tier sheet](REAL_DEVICE_TIER_TEST.md), including date movement and the small 661 pegs and 680 traces. The room is still a textured prototype; this antialiasing comparison does not resolve its material, lighting, or historical review.
