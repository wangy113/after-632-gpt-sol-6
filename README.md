# After 632

This repository is being rebuilt from [the meeting-room plan](docs/PLAN.md). The reading page is runnable and source-linked. Its three passages are the plan's drafts and still need instructor review. An optional, untextured 3D study view shows the imagined room and yard from a doorway. Drag, use the arrow keys while the view is focused, or use the look buttons to turn. WebGPU is used when available, with a WebGL2 fallback; if rendering fails, the reading page remains available. The pure state model defines date selection, four viewpoints, Compare, and movement policy, but those controls and dated objects are not yet connected to the 3D view. The rendered still, object labels, and reporting exit are later chunks.

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

The Playwright checks use the built page on port 4173 and cover the opt-in room, renderer failure, and passages without JavaScript. If Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for `npm run e2e`.
