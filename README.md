# After 632

This repository is being rebuilt from [the meeting-room plan](docs/PLAN.md). The source-linked reading page works without JavaScript. Its three passages are drafts and still need instructor review.

For the current checkpoint, next proposed chunk, and publishing steps, see [HANDOFF.md](HANDOFF.md).

The optional 3D view shows the same imagined room in 632, 661, and 680 CE. Its walls and floors use CC0 Poly Haven textures as a material preview; the geometry and other surfaces remain a prototype. In 632, an unfinished circle of mats, untouched cups, an empty head position, and footprints suggest an unsettled moment. In 661, mats face a plain seat, a sealed letter and interpretive coin replica rest on a low table, and ordinary travel things sit by the door. In 680, the seat remains; the travel things are gone, leaving a clean floor patch and an empty hook. The yard palm is taller. Date changes cross-dissolve for 0.8 seconds at the same viewpoint, or switch immediately under reduced motion. Four place buttons move between the doorway, head of room, pegs, and yard in 0.8 seconds, or immediately under reduced motion. “Things here” separates each invented detail from a sourced historical fact. Drag, use the arrow keys while the view is focused, or use the look buttons to turn. WebGPU is used when available, with a WebGL2 fallback; the reading page remains available if rendering fails.

The [Phase 0 sky comparison](docs/phase0/SKY_COMPARISON.md) shows two pinned CC0 Qwantani HDRI candidates from the same yard camera pose. A sky can be previewed with `?sky=qwantani_morning_puresky` or `?sky=qwantani_mid_morning_puresky`; neither is the default yet.

In the 661 or 680 room, hold Compare to see the preceding date immediately from the same viewpoint. The selected date stays selected while the view and its “Things here” notes show the earlier date; releasing Compare restores the selection. The hold button works with a mouse, touch, or keyboard. Holding C while the room is active also compares, and a separate toggle button keeps the comparison visible without holding. Compare is unavailable in 632 because the room has no earlier scene.

The pure state model defines all three dates, four viewpoints, Compare, and movement policy. The three date views, four viewpoints, and Compare are connected to the scene. A doorway still appears before the 3D room opens. The reporting exit remains later work.

## Run

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

The six pinned Poly Haven JPGs and two HDR sky candidates are committed under `public/assets/polyhaven/`. Run `npm run fetch:assets` to re-fetch missing files or verify existing copies against the sizes and MD5 hashes in `assets.config.json`; this command requires `curl`.
Run `npm run check:assets` to build and verify the committed and built assets against their pinned records, confirm the recorded CC0 source, and check the full built visit against the 15 MB budget. This check works offline and does not change the source assets. Run `npm run capture:sky` with Chromium installed to reproduce the comparison images.

For the production build and checks:

```sh
npm test
npm run build
npx playwright install chromium
npm run e2e
```

The Playwright checks use the built page on port 4173 and cover the opt-in room, dated label sets and passage links, date transitions, the four viewpoints, Compare input and release, renderer failure, and passages without JavaScript. If Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for `npm run e2e`.
