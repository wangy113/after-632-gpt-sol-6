# After 632

This repository is being rebuilt from [the meeting-room plan](docs/PLAN.md). The source-linked reading page works without JavaScript. Its three passages are drafts and still need instructor review.

For the current checkpoint, next proposed chunk, and publishing steps, see [HANDOFF.md](HANDOFF.md).

The optional, untextured 3D view shows the same imagined room in 632, 661, and 680 CE. In 632, an unfinished circle of mats, untouched cups, an empty head position, and footprints suggest an unsettled moment. In 661, mats face a plain seat, a sealed letter and interpretive coin replica rest on a low table, and ordinary travel things sit by the door. In 680, the seat remains; the travel things are gone, leaving a clean floor patch and an empty hook. The yard palm is taller. The date buttons keep the viewpoint fixed. “Things here” separates each invented detail from a sourced historical fact. Drag, use the arrow keys while the view is focused, or use the look buttons to turn. WebGPU is used when available, with a WebGL2 fallback; the reading page remains available if rendering fails.

In the 661 or 680 room, hold Compare to see the preceding date from the same viewpoint. The selected date stays selected while the view and its “Things here” notes show the earlier date; releasing Compare restores the selection. The hold button works with a mouse, touch, or keyboard. Holding C while the room is active also compares, and a separate toggle button keeps the comparison visible without holding. Compare is unavailable in 632 because the room has no earlier scene.

The pure state model defines all three dates, four viewpoints, Compare, and movement policy. The three date views and Compare are connected to the scene. Additional viewpoints, a rendered still, and the reporting exit are later chunks.

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

The Playwright checks use the built page on port 4173 and cover the opt-in room, dated label sets and passage links, date switching, Compare input and release, renderer failure, and passages without JavaScript. If Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for `npm run e2e`.
