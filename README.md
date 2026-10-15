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

## Run

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

The six pinned Poly Haven JPGs and two HDR sky candidates are committed under `public/assets/polyhaven/`. Run `npm run fetch:assets` to re-fetch missing files or verify existing copies against the sizes and MD5 hashes in `assets.config.json`; this command requires `curl`.
Run `npm run check:assets` to build and verify the committed and built assets against their pinned records, confirm the recorded CC0 source, check the built HTML, linked CSS, and arrival still against the 300 KB first-view budget, and check the full built visit against the 15 MB budget. This check works offline and does not change the source assets. Run `npm run capture:sky` with Chromium installed to reproduce the comparison images.
Run `npm run check:content` to build both pages and verify that their source links, report dates, credits, and no-photo treatment agree with the recorded content. This check is offline; publication still needs a live source-link review.

For the production build and checks:

```sh
npm test
npm run build
npx playwright install chromium
npm run e2e
```

The Playwright checks use the built pages on port 4173 and cover the opt-in room, dated label sets and passage links, date transitions, the four viewpoints, Compare input and release, renderer failure, the separate reporting exit, and both pages without JavaScript. If Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for `npm run e2e`.
