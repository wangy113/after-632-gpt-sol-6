# After 632

This repository is being rebuilt from [the meeting-room plan](docs/PLAN.md). The source-linked reading page works without JavaScript. Its three passages are drafts and still need instructor review.

For the current checkpoint, next proposed chunk, and publishing steps, see [HANDOFF.md](HANDOFF.md).

The optional 3D view shows the same imagined room in 632, 661, and 680 CE. Its walls and floors use CC0 Poly Haven textures as a material preview; the geometry and other surfaces remain a prototype. In 632, an unfinished circle of mats, untouched cups, an empty head position, and footprints suggest an unsettled moment. In 661, mats face a plain seat, a sealed letter and interpretive coin replica rest on a low table, and ordinary travel things sit by the door. In 680, the seat remains; the travel things are gone, leaving a clean floor patch and an empty hook. The yard palm is taller. Date changes cross-dissolve for 0.8 seconds at the same viewpoint, or switch immediately under reduced motion. Four place buttons move between the doorway, head of room, pegs, and yard in 0.8 seconds, or immediately under reduced motion. “Things here” separates each invented detail from a sourced historical fact. Drag, use the arrow keys while the view is focused, or use the look buttons to turn. WebGPU is used when available, with a WebGL2 fallback; the reading page remains available if rendering fails.

The [Phase 0 sky comparison](docs/phase0/SKY_COMPARISON.md) shows two pinned CC0 Qwantani HDRIs from the same yard camera pose. The lighter Qwantani morning sky is the provisional default; `?sky=qwantani_mid_morning_puresky` keeps the darker candidate available for comparison. The sky changes the background only, with the room lights fixed. Its visual and historical suitability still need human review.

For a shadow comparison, open the [PCF preview](https://wangy113.github.io/after-632-gpt-sol-6/?shadows=1) or the [VSM preview](https://wangy113.github.io/after-632-gpt-sol-6/?shadows=1&shadowFilter=vsm), then enter the room. Both are diagnostic URL options; normal visits keep shadows off. The [cross-view review](docs/DECISIONS.md#cross-view-shadow-filter-decision--2026-10-14) keeps PCF as the diagnostic default because VSM flattens later mat detail and does not improve the focal traces; real-device performance is still unmeasured.

To compare the 680 pale floor mark in normal lighting, open the [baseline view](https://wangy113.github.io/after-632-gpt-sol-6/), the [lower-opacity candidate](https://wangy113.github.io/after-632-gpt-sol-6/?floorMarkOpacity=0.30), and the [softer-edge candidate](https://wangy113.github.io/after-632-gpt-sol-6/?floorMarkOpacity=0.30&floorMarkEdge=soft). Enter the room, select 680, and use the doorway or head-of-room place. The softer edge requires both exact URL values; regular visits use the baseline opacity. The [current prototype review packet](docs/phase0/TEXTURED_REVIEW_PACKET.md) and [680 mark variant sheet](docs/phase0/680_FLOOR_MARK_REVIEW_SHEET.md) are ready for participant responses; neither contains results yet.

In the 661 or 680 room, hold Compare to see the preceding date immediately from the same viewpoint. The selected date stays selected while the view and its “Things here” notes show the earlier date; releasing Compare restores the selection. The hold button works with a mouse, touch, or keyboard. A click-only activation of that button switches the comparison on or off for assistive technology that cannot hold it. Holding C while the room is active also compares, and a separate toggle button keeps the comparison visible without holding. Compare is unavailable in 632 because the room has no earlier scene.

The pure state model defines all three dates, four viewpoints, Compare, and movement policy. The three date views, four viewpoints, and Compare are connected to the scene. A doorway still appears before the 3D room opens. [Into the present](https://wangy113.github.io/after-632-gpt-sol-6/exit.html) is a separate plain page with two dated Yemen report links, a sourced Zaydi/Twelver note, and an open question. It works without JavaScript; leaving the room unloads its renderer. The [source review](docs/phase0/REPORTING_EXIT_SOURCES.md) records what each source supports and its limits. Instructor and community review of the wording remains open.

The [Phase 3 source and credit audit](docs/phase3/SOURCE_CREDIT_AUDIT.md) records the current passage, label, reporting, museum-reference, and asset checks. The 680 passage now links a second historical source for its family-casualty detail.

For a rendering comparison on a high-density screen, choose Normal or Low under **Graphics** before entering or while inside the room. The choice updates the shareable URL; [normal](https://wangy113.github.io/after-632-gpt-sol-6/) and [Low](https://wangy113.github.io/after-632-gpt-sol-6/?tier=low) links also work. Low caps the canvas drawing buffer at device pixel ratio 1, loads six pinned 512-pixel WebP wall and floor maps, and selects a derived 512 × 256 HDR sky. Normal retains the 1.5 cap, six 1k JPG maps, and the pinned 1k sky. Switching inside the room reloads the graphics while keeping the selected date and place. The [matched measurements and images](docs/phase4/LOW_512_SKIES.md) show the current scope and limits of this Phase 4 option. The visitor chooses the tier; there is no automatic selection.

For an antialiasing comparison within Low, open the [current Low rendering](https://wangy113.github.io/after-632-gpt-sol-6/?tier=low), [no antialiasing](https://wangy113.github.io/after-632-gpt-sol-6/?tier=low&aa=off), or [FXAA](https://wangy113.github.io/after-632-gpt-sol-6/?tier=low&aa=fxaa), then enter the room. These exact `aa` values are diagnostic options only when `tier=low`; the visible Graphics choice clears them. The [matched Low antialiasing review](docs/phase4/LOW_FXAA_PREVIEW.md) records the local images and limits. The default remains the renderer's requested antialiasing path until physical-device image and timing checks support a change.

## Run

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

The six pinned Poly Haven 1k JPGs, six generated 512-pixel WebP maps, two pinned 1k HDR skies, and two derived 512 × 256 HDR skies are committed under `public/assets/polyhaven/`. Run `npm run fetch:assets` to re-fetch missing source files or verify existing copies against the sizes and MD5 hashes in `assets.config.json`; this command requires `curl`. Run `npm run generate:low-textures` and `npm run generate:low-skies` to regenerate missing Low variants or verify committed ones against their recorded recipes and SHA-256 hashes.
Run `npm run check:assets` to build and verify source, derived, and built assets against their pins, confirm the recorded CC0 source, check the built HTML, linked CSS, and arrival still against the 300 KB first-view budget, and check the full built site against the 15 MB budget. This check works offline and does not change the source assets. Run `npm run capture:sky` with Chromium installed to reproduce the original two-candidate comparison images.
Run `npm run check:content` to build both pages and verify that their source links, report dates, credits, and no-photo treatment agree with the recorded content. This check is offline; publication still needs a live source-link review.
Run `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run measure:tier` to compare the current normal and Low drawing buffers and asset transfers at emulated device pixel ratio 2. Add `-- --capture-textures` to refresh the older doorway and yard material images at device pixel ratio 1; that capture holds Low's sky at 1k to isolate the maps. After building, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/measure-low-sky.mjs` compares both sky sizes with the Low maps fixed and refreshes the matched sky images. These commands require Chromium and do not measure real-device frame time. The [real-device tier sheet](docs/phase4/REAL_DEVICE_TIER_TEST.md) gives a repeatable laptop, Chromebook, and phone protocol. Open `?metrics=1&probe=1` (add `&tier=low` for Low), wait for the **Tier recorder ready** notice, then use its opt-in room recorder with **Sample idle second**, **Copy JSON**, and **Download JSON**; no Console paste is needed. Cold Network visits and displayed-frame traces use ordinary URLs without those flags. The sheet contains no device results yet.
Run `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run measure:low-aa` to rebuild and refresh nine matched Low antialiasing captures and local render counters. The comparison uses Chromium's software-rendered WebGL2 fallback; it does not establish device frame rate, memory use, or which option is clearer to visitors.

For the production build and checks:

```sh
npm test
npm run build
npx playwright install chromium
npm run e2e
```

The Playwright checks use the built pages on port 4173 and cover the opt-in room, dated label sets and passage links, date transitions, the four viewpoints, Compare input and release, renderer failure, the separate reporting exit, and both pages without JavaScript. If Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for `npm run e2e`.
