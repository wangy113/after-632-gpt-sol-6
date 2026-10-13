# After 632

This repository is being rebuilt from [the meeting-room plan](docs/PLAN.md). The source-linked reading page works without JavaScript. Its three passages are drafts and still need instructor review.

The optional, untextured 3D view shows the same imagined room in 632 or 661 CE. In 632, an unfinished circle of mats, untouched cups, an empty head position, and footprints suggest an unsettled moment. In 661, mats face a plain seat, a sealed letter and interpretive coin replica rest on a low table, and empty pegs mark the wall. The date buttons keep the viewpoint fixed. “Things here” separates each invented detail from a sourced historical fact. Drag, use the arrow keys while the view is focused, or use the look buttons to turn. WebGPU is used when available, with a WebGL2 fallback; the reading page remains available if rendering fails.

In the 661 room, hold Compare to see the 632 arrangement from the same viewpoint. The 661 date stays selected while the view and its “Things here” notes show 632; releasing Compare restores 661. The hold button works with a mouse, touch, or keyboard. Holding C while the room is active also compares, and a separate toggle button keeps the comparison visible without holding. Compare is unavailable in 632 because the room has no earlier scene.

The pure state model defines all three dates, four viewpoints, Compare, and movement policy. The 632/661 date switch and Compare are connected to the scene. The 680 change set, additional viewpoints, rendered still, and reporting exit are later chunks.

## Run

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

For the production build and checks:

```sh
npm test
npm run build
npx playwright install chromium
npm run e2e
```

The Playwright checks use the built page on port 4173 and cover the opt-in room, both dated label sets and passage links, the date switch, Compare input and release, renderer failure, and passages without JavaScript. If Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for `npm run e2e`.
