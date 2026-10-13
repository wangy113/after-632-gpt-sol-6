# After 632 implementation handoff

This repository is being rebuilt as the imagined meeting-room experience in [the plan](docs/PLAN.md). The current build is a working gray-box prototype with three dates and four places to stand; it is not the planned photoreal release. Continue on `codex/phase0-scaffold`; `main` still contains the retired site.

The user wants work delivered **one small chunk at a time**, with approval before starting the next chunk. They also asked to see completed chunks through GitHub. The public preview is [GitHub Pages](https://wangy113.github.io/after-632-gpt-sol-6/), built from `gh-pages`. “First CC0 asset records” is the current completed chunk; wait for approval before starting another.

## Verified checkpoint · 2026-10-13

| Item | State |
| --- | --- |
| Implementation branch | `codex/phase0-scaffold`; last chunk commit `8817f61` (first CC0 asset records) |
| Public preview branch | `gh-pages`; still at `f655a72` (Arrival still) |
| GitHub Pages | Build for `f655a72` reported `built`; no site files changed in this asset-config chunk |
| Checks at this checkpoint | Config parsed; six URLs, hashes, and byte sizes matched the live Poly Haven files API; official source pages and CC0 license checked; last app checkpoint: 17 unit tests, build, 20 browser tests passed |
| Working tree before this handoff update | Clean |

The user's “continue” authorized the first CC0 asset records. No textures have been downloaded or applied to the room, and no participant sessions or results have been recorded. This handoff commit follows `8817f61` on the implementation branch. `main` and `gh-pages` do not carry the source work. The public site serves only the built files, so the config, review packet, and this handoff are available on the source branch in GitHub, not on the site.

## What works now

- [The asset config](assets.config.json) pins two Poly Haven CC0 texture candidates: `clay_plaster` for walls and `clay_floor_001` for the floor. Each records its source page, 1k JPG Diffuse/normal/ARM map URLs, API-listed MD5 hashes, and byte sizes. The six maps total 1,806,383 API-listed bytes. Their visual and historical suitability still need review; the current gray-box room does not use them.
- The [gray-box review packet](docs/phase0/GRAYBOX_REVIEW_PACKET.md) gives a neutral image-only sequence, a separate reading-context pass, and a response sheet for 3 to 5 participants. It uses the three same-view doorway captures and names details that cannot be judged from those captures. The study still needs real participants; the packet contains no findings.
- The arrival page loads a 632 doorway WebP still before any 3D. Its alt text and caption identify the gray model as imagined. The Enter and Read controls stay above the image, and the image remains available without JavaScript. `npm run capture:arrival` regenerates `public/stills/632-arrival.webp` from the room in Chromium; the current image is 864 × 487 pixels and 3,964 bytes.
- An opt-in WebGPU room with a WebGL2 fallback and a readable, source-linked page that works without JavaScript or 3D.
- One stable room and yard across 632, 661, and 680 CE. Date changes keep the camera in its selected place. The three change sets have matching “In this room” and “In the record” labels; [build decisions](docs/DECISIONS.md) record historical limits and [gray-box captures](docs/phase0/) show each dated view.
- Four places to stand: doorway, head of room, pegs/hooks, and yard looking back. Moves glide for 0.8 seconds through the doorway where needed, or cut under reduced motion. The chosen place survives a return to reading and re-entry.
- Selected-date changes cross-dissolve for 0.8 seconds at the same camera with a caption. Compare and reduced motion cut instantly; a rapid newer date selection wins. The [gray-box blend capture](docs/phase0/661-dissolve-graybox.png) records the WebGL2 midpoint.
- “Describe this view” opens a native disclosure below the canvas. Authored JSON supplies a distinct starting-view description for every date and standing place. The description follows the visible date during Compare and the current camera direction after buttons, arrow keys, or drag; it identifies a moving camera during place glides. A separate “In the record” sentence links to an existing historical source. The same 12 starting-view descriptions are readable without JavaScript under the three passages.
- “Skip movement” finishes the current camera glide or date dissolve immediately, keeping the chosen place and date. Visitors can use its button or press Escape while focused in the room. It also clears the transition caption and updates the view description. It does not change future motion settings.
- “Pause motion” is a pressed-state toggle in the room. Turning it on finishes an active glide or dissolve and makes later date or place changes immediate. Turning it off restores transitions when the system reduced-motion setting permits them. The selected date and place stay intact, and Compare stays instant.
- Compare shows the previous date from the same camera while preserving the selected date. It works by pointer or keyboard hold, the C key, or a persistent toggle. Returning to reading releases the renderer; renderer failure falls back to the reading page.
- The pure state model defines all three dates, four places, Compare, and motion policy. Date, place, Compare, Pause, and reduced-motion behavior are wired to the live room.

## Next proposed chunk: fetch pinned texture candidates

Pending user approval, add a small fetch script for the six pinned map URLs in `assets.config.json`. Download into an ignored local cache, identify this app with a User-Agent as the Poly Haven API terms request, and verify file sizes and MD5 hashes after download. Keep this as asset groundwork while the user arranges the gray-box review. Do not change the rendered room or claim the pedagogy test is complete. Commit the one small chunk and stop for review.

When the user supplies completed response sheets, synthesize what participants noticed and how they interpreted it into `docs/DECISIONS.md` before committing to visual refinements.

## Where to work

| Purpose | Files |
| --- | --- |
| Requirements and historical decisions | `docs/PLAN.md`, `docs/DECISIONS.md` |
| Texture candidate records | `assets.config.json` |
| Text, citations, and scene labels | `content/*.json`, `scripts/content.ts`, `src/schema/changeIds.ts` |
| UI state and Compare inputs | `src/main.ts`, `src/state/*.ts` |
| Camera, renderer, and dated geometry | `src/scene/createRoomView.ts`, `src/render/renderer.ts`, `src/world/*.ts` |
| Verification | `tests/unit/*.test.ts`, `tests/e2e/*.spec.ts` |

`scripts/content.ts` validates JSON and renders the full static reading page into `index.html` at build time. `src/main.ts` enhances that page after JavaScript loads, owns the reducer state, and lazy-loads one `RoomView`. `src/scene/createRoomView.ts` owns the camera, one canvas, movement and dissolve callbacks, and renderer disposal. Keep historical prose and scene descriptions in `content/*.json`, with source links, rather than adding historical claims to TypeScript. `src/state/` stays pure TypeScript without DOM or three.js dependencies.

The 680 Medina-to-Mecca claim is supported by the Madelung source in `content/sources.json`; the travel objects are invented and are not Husayn's belongings. The 661 coin is an interpretive replica linked to a museum catalog record, with no museum image. Keep the plan's guardrails: no people, relics, battle scene, weapons, or symbolic lighting. The passages and room symbolism still need instructor and community review. Other later work includes photoreal materials and lighting, reporting exit, device and screen-reader checks, and student testing.

The current room and arrival still remain an untextured gray box. The plan also describes asset scripts, rendering features, exit content, tests, and a Pages workflow that have not all been implemented; treat those passages as future requirements, not descriptions of this checkout. Turned camera descriptions are deliberately broad, and the description changes to the destination date when a dissolve starts. WebGPU hardware, mobile devices, and a screen reader have not been manually checked. Do not infer historical evidence from the invented props.

## Run and verify

Use Node.js 22.12 or later. From the repository root:

```sh
npm ci
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run e2e
```

To regenerate the arrival still after changing the room, run:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run capture:arrival
npm run build
```

This source-only asset chunk checked that the JSON parses, all six map URLs, hashes, and byte sizes match the live Poly Haven files API, and both asset pages and the official license page confirm CC0. These hashes are API-listed metadata; the image files have not been downloaded and independently hashed. App tests were not rerun. The previous “Arrival still” checkpoint passed 17 unit tests and 20 browser tests. Its new browser check confirms the image loads before Enter and without JavaScript; a focused rerun passed after moving the entry controls above the image. Desktop and phone layouts were inspected. Turned-view descriptions stay broad; detailed date-specific prose describes each place's starting direction and is labeled as such. A manual screen-reader check is still needed. Playwright serves the built page on `127.0.0.1:4173`; `/usr/bin/chromium` is the installed browser in this workspace. Elsewhere, install Chromium with `npx playwright install chromium` and adjust or omit the path override. The build output is `dist/` and is ignored by Git.

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
git -C "$pages_dir" diff --cached --check -- index.html 'assets/*.css' .nojekyll
git -C "$pages_dir" commit -m 'Publish room preview'
git -C "$pages_dir" push origin HEAD:gh-pages
git worktree remove "$pages_dir"
```

The scoped whitespace check covers authored HTML and CSS. Running `git diff --cached --check` on the generated, minified JavaScript also reports whitespace inside third-party shader strings; that is not an authored source change. Confirm GitHub Pages reports the new `gh-pages` commit as built (`gh api repos/wangy113/after-632-gpt-sol-6/pages/builds/latest`), then open the public URL and check the new interaction. Fetch or inspect remote refs before trusting local `origin/*` refs, which can lag a push. The plan's references to an existing Pages workflow and to the old site staying live until a merge do not describe this preview setup.
