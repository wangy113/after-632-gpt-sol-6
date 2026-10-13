# After 632 implementation handoff

This repository is being rebuilt as the imagined meeting-room experience in [the plan](docs/PLAN.md). The current build is a working gray-box prototype with three dates and four places to stand; it is not the planned photoreal release. Continue on `codex/phase0-scaffold`; `main` still contains the retired site.

The user wants work delivered **one small chunk at a time**, with approval before starting the next chunk. They also asked to see completed chunks through GitHub. The public preview is [GitHub Pages](https://wangy113.github.io/after-632-gpt-sol-6/), built from `gh-pages`. “Describe this view” is the current completed chunk; wait for approval before starting another.

## What works now

- An opt-in WebGPU room with a WebGL2 fallback and a readable, source-linked page that works without JavaScript or 3D.
- One stable room and yard across 632, 661, and 680 CE. Date changes keep the camera in its selected place. The three change sets have matching “In this room” and “In the record” labels; [build decisions](docs/DECISIONS.md) record historical limits and [gray-box captures](docs/phase0/) show each dated view.
- Four places to stand: doorway, head of room, pegs/hooks, and yard looking back. Moves glide for 0.8 seconds through the doorway where needed, or cut under reduced motion. The chosen place survives a return to reading and re-entry.
- Selected-date changes cross-dissolve for 0.8 seconds at the same camera with a caption. Compare and reduced motion cut instantly; a rapid newer date selection wins. The [gray-box blend capture](docs/phase0/661-dissolve-graybox.png) records the WebGL2 midpoint.
- “Describe this view” opens a native disclosure below the canvas. Authored JSON supplies a distinct starting-view description for every date and standing place. The description follows the visible date during Compare and the current camera direction after buttons, arrow keys, or drag; it identifies a moving camera during place glides. A separate “In the record” sentence links to an existing historical source. The same 12 starting-view descriptions are readable without JavaScript under the three passages.
- Compare shows the previous date from the same camera while preserving the selected date. It works by pointer or keyboard hold, the C key, or a persistent toggle. Returning to reading releases the renderer; renderer failure falls back to the reading page.
- The pure state model defines all three dates, four places, Compare, and motion policy. Date, place, Compare, and reduced-motion behavior are wired to the live room.

## Next proposed chunk: pause and skip movement

Pending user approval, add visitor controls to pause and skip camera movement and date dissolves. System reduced-motion preference already cuts transitions, but the plan also calls for a user choice and a way to skip motion in progress. Keep the selected date and place stable, and verify keyboard control and renderer cleanup.

Work on this one chunk, test it, commit and publish its preview, then stop for the user's approval before another chunk.

## Where to work

| Purpose | Files |
| --- | --- |
| Requirements and historical decisions | `docs/PLAN.md`, `docs/DECISIONS.md` |
| Text, citations, and scene labels | `content/*.json`, `scripts/content.ts`, `src/schema/changeIds.ts` |
| UI state and Compare inputs | `src/main.ts`, `src/state/*.ts` |
| Camera, renderer, and dated geometry | `src/scene/createRoomView.ts`, `src/render/renderer.ts`, `src/world/*.ts` |
| Verification | `tests/unit/*.test.ts`, `tests/e2e/*.spec.ts` |

The 680 Medina-to-Mecca claim is supported by the Madelung source in `content/sources.json`; the travel objects are invented and are not Husayn's belongings. The 661 coin is an interpretive replica linked to a museum catalog record, with no museum image. Keep the plan's guardrails: no people, relics, battle scene, weapons, or symbolic lighting. The passages and room symbolism still need instructor and community review. Other later work includes the rendered arrival still, photoreal materials and lighting, reporting exit, device and screen-reader checks, and student testing.

## Run and verify

Use Node.js 22.12 or later. From the repository root:

```sh
npm ci
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run e2e
```

The “Describe this view” checkpoint passed 17 unit tests and 17 browser tests. The browser checks include keyboard opening, camera turns by buttons, arrows and drag, Compare, and no-JavaScript access. Turned-view descriptions stay broad; detailed date-specific prose describes each place's starting direction and is labeled as such. A manual screen-reader check is still needed. Playwright serves the built page on `127.0.0.1:4173`; `/usr/bin/chromium` is the installed browser in this workspace. Elsewhere, install Chromium with `npx playwright install chromium` and adjust or omit the path override. The build output is `dist/` and is ignored by Git.

## Publish the preview

There is no `.github` workflow or deploy script in this checkout, despite older wording in the plan. GitHub Pages serves the root of `gh-pages`. After checks pass, push the source branch, then publish **only built `dist/` files** from a separate `gh-pages` worktree:

```sh
git push origin codex/phase0-scaffold
git fetch origin gh-pages:refs/remotes/origin/gh-pages
pages_dir=../after-632-pages
git worktree add --detach "$pages_dir" origin/gh-pages
git -C "$pages_dir" rm -r -- .
cp -a dist/. "$pages_dir"/
touch "$pages_dir"/.nojekyll
git -C "$pages_dir" add -A
git -C "$pages_dir" diff --cached --check
git -C "$pages_dir" commit -m 'Publish room preview'
git -C "$pages_dir" push origin HEAD:gh-pages
git worktree remove "$pages_dir"
```

Confirm GitHub Pages reports the new `gh-pages` commit as built, then open the public URL and check the new interaction. The plan's references to an existing Pages workflow and to the old site staying live until a merge do not describe this preview setup.
