# After 632

This repository is being rebuilt from [the meeting-room plan](docs/PLAN.md). The source-linked reading page works without JavaScript. Its three passages are drafts and still need instructor review.

The optional, untextured 3D view now shows the imagined room at 632 CE: an unfinished circle of mats, untouched cups, an empty head position, and footprints toward the doorway. “Things here” separates each invented detail from a sourced historical fact. Drag, use the arrow keys while the view is focused, or use the look buttons to turn. WebGPU is used when available, with a WebGL2 fallback; the reading page remains available if rendering fails.

The pure state model defines all three dates, four viewpoints, Compare, and movement policy. The 661 and 680 change sets and those controls are not yet connected to the scene. The rendered still and reporting exit are later chunks.

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

The Playwright checks use the built page on port 4173 and cover the opt-in room, 632 labels and passage link, renderer failure, and passages without JavaScript. If Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for `npm run e2e`.
