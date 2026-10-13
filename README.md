# After 632

This repository is being rebuilt from [the meeting-room plan](docs/PLAN.md). The first small chunk is a runnable, source-linked reading page. Its three passages are the plan's drafts and still need instructor review. The imagined 3D room, rendered still, object labels, and reporting exit are later chunks.

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

The Playwright check uses the built page on port 4173 and confirms that the passages work without JavaScript. If Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for `npm run e2e`.
