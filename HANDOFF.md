# After 632 implementation handoff

This repository is being rebuilt as the imagined meeting-room experience in [the plan](docs/PLAN.md). The current build is a working gray-box prototype with three dates and four places to stand; it is not the planned photoreal release. Continue on `codex/phase0-scaffold`; `main` currently contains only the plan.

The user wants work delivered **one small chunk at a time**, with approval before starting the next chunk. They also asked to see completed chunks through GitHub. The public preview is [GitHub Pages](https://wangy113.github.io/after-632-gpt-sol-6/), built from `gh-pages`. “Idle-render frame check” is the current completed chunk. Wait for feedback or approval before starting another chunk.

## Verified checkpoint · 2026-10-14

| Item | State |
| --- | --- |
| Implementation branch | `codex/phase0-scaffold`; test and audit commit `6ebe0d5` (idle rendering) |
| Public preview branch | `gh-pages`; remains at `e8c43fe` because no app files changed |
| GitHub Pages | Existing build for `e8c43fe` reported `built`; the live Compare path was checked in an earlier chunk |
| Checks at this checkpoint | The new focused idle check and all 34 browser tests passed, including eight axe scans. The preceding checker checkpoint passed the 44,297 / 300,000 first-view and 5,016,889 / 15,000,000 full-visit byte budgets; those and the 17 unit tests were not rerun for this test-only change. |
| Working tree before this handoff update | Clean |

The user's “continue” authorized the proposed idle-render check. `6ebe0d5` adds a browser path that watches the canvas `data-frames` counter in the 632 doorway, after looking right, and after a move to the head of the room. Each action increased the counter; after two animation frames to settle, it stayed unchanged for a 300 ms quiet interval at each point. The current scheduler needed no fix. This counter measures application render callbacks in Chromium's WebGL2 fallback, not GPU activity or performance on real devices. This test-and-documentation chunk did not change the public build. `main` currently contains only the plan; `gh-pages` carries only built files. Source documentation and this handoff are on the implementation branch, not on the public site.

## What works now

- The [idle rendering check](docs/phase0/IDLE_RENDER_CHECK.md) confirms that the frame counter stops after room entry, a look, and a completed place move in Chromium's WebGL2 fallback. The full 34-test browser suite passes. Date transitions and Compare are separate rendering paths to check next.
- `npm run check:assets` enforces the plan's **300,000-byte first view** by following stylesheet and arrival-still references in built `index.html`. It reports 44,297 bytes for the current HTML, CSS, and WebP. An isolated fixture showed that changed references alter the total and that oversized, missing, or uncounted resources fail. The full 15,000,000-byte visit check remains.
- [Compare click-only activation](docs/phase0/COMPARE_VIRTUAL_ACTIVATION.md) lets an assistive-technology style click on **Hold to see 632 CE** show the earlier date persistently; a second click restores the selected date. The Hold button's pressed state reflects the visible comparison. Physical holds still end on release, and the adjacent persistent toggle remains. The browser surrogate passes; an actual screen-reader test remains open.
- The [screen-reader navigation check sheet](docs/phase0/SCREEN_READER_CHECK.md) gives an actual tester a short path through reading headings and sources, room entry, date/place labels, the view description, Compare, and return to reading. It asks for the exact spoken output and checks whether the Hold button's virtual activation follows the new behavior. This is preparation, **not a completed screen-reader pass**. The current container has no screen-reader program, GUI/audio session, or speech output; Chromium's accessibility tree cannot substitute for hearing the page.
- The [small-screen keyboard audit](docs/phase0/KEYBOARD_AUDIT.md) operates a 390 × 844 reading-to-room path using Tab, Enter, Space, arrows, and Escape. It covers date and place selection, an active movement skip, Compare hold and toggle, a disclosure, and return to reading. A second path forces initial renderer failure. Before the fix, disabling Enter during loading dropped focus to the document body and skipped the retry button in Tab order. Focus now returns to “Try the room again” when entry began with that button focused and the visitor has not moved elsewhere. Both new paths pass; the existing context-loss test still checks focus on the reading heading. A real screen-reader review remains open.
- The [automated accessibility audit](docs/phase0/ACCESSIBILITY_AUDIT.md) runs axe-core 4.13.0 against the static reading state and rendered room at 1440, 390, and 320 pixels, plus expanded 680 notes at 320 pixels. The expanded room initially exposed a moderate heading-order violation: scene item `h4` headings skipped the room's `h2`. Room labels now use `h3`, while labels beneath reading passage `h3` headings remain `h4`. All eight scans now report zero violations. Axe does not assess WebGL pixels, keyboard operation, or screen-reader announcements; the sampled keyboard path has its own audit, and a real screen-reader pass remains open.
- The [small-screen layout audit](docs/phase0/MOBILE_LAYOUT_AUDIT.md) records before and after captures at 390 × 844. Before the change, the scene frame ended below the first screen after Enter. Compare and its help now follow the scene in document order, while date and place controls remain before it. The full canvas spans `y=528..730` at both 632 and 661 inside the 844-pixel viewport, and the page has no horizontal overflow. Emulated touch controls and disclosures worked. A real-phone and screen-reader pass remain open.
- The [Phase 0 sky comparison](docs/phase0/SKY_COMPARISON.md) pins two 1k CC0 Qwantani clear-morning HDRIs and shows side-by-side 632 yard screenshots from the same upward camera pose. Qwantani morning is the provisional default because its lighter sky gives the roof and wall a clearer edge. `?sky=qwantani_mid_morning_puresky` still previews the darker candidate. The HDRI changes only the background; fixed prototype room lights remain. The reading page credits both skies. Visual and historical suitability still need human review.
- `npm run check:assets` makes a fresh production build, then checks six source and built Poly Haven JPGs and two HDRIs against their pinned download URLs, byte sizes, and MD5 hashes. It verifies the recorded CC0 license and source links, rejects unlisted Poly Haven files, and sums **all** files in `dist/` against the 15,000,000-byte visit budget. The check is offline and does not change the source assets. Current totals are 1,806,383 texture bytes, 2,240,209 sky bytes, 44,297 first-view bytes, and 5,016,889 full-visit bytes. It verifies recorded provenance, not the live Poly Haven license page.
- [The asset config](assets.config.json) pins two Poly Haven CC0 texture candidates: `clay_plaster` for walls and `clay_floor_001` for the floor. Each records its source page, 1k JPG Diffuse/normal/ARM map URLs, API-listed MD5 hashes, and byte sizes. The six files total 1,806,383 verified bytes and are committed under `public/assets/polyhaven/`; `npm run fetch:assets` rechecks them or downloads missing copies. The room and yard now use their diffuse, normal, ambient-occlusion, and roughness maps, with world-scaled UVs. Their visual and historical suitability still need review.
- The 632 doorway still and live room show the material preview. The doorway still was regenerated with the morning default and inspected, but it shows the room interior with no visible sky; the prior still was retained because the new render differed only by tiny capture noise. The reading page credits the assets and links to Poly Haven's CC0 terms. Roof, props, geometry, and lighting remain prototype work. The 680 clean floor patch remained distinct in Chromium; a user and instructor should still judge the scenes.
- The [gray-box review packet](docs/phase0/GRAYBOX_REVIEW_PACKET.md) gives a neutral image-only sequence, a separate reading-context pass, and a response sheet for 3 to 5 participants. It uses the three same-view doorway captures and names details that cannot be judged from those captures. The study still needs real participants; the packet contains no findings.
- The arrival page loads a 632 doorway WebP still before any 3D. Its alt text and caption identify the material preview as imagined. The Enter and Read controls stay above the image, and the image remains available without JavaScript. `npm run capture:arrival` regenerates `public/stills/632-arrival.webp` from the room in Chromium; the current image is 864 × 487 pixels and 13,180 bytes.
- An opt-in WebGPU room with a WebGL2 fallback and a readable, source-linked page that works without JavaScript or 3D.
- One stable room and yard across 632, 661, and 680 CE. Date changes keep the camera in its selected place. The three change sets have matching “In this room” and “In the record” labels; [build decisions](docs/DECISIONS.md) record historical limits and [gray-box captures](docs/phase0/) show each dated view.
- Four places to stand: doorway, head of room, pegs/hooks, and yard looking back. Moves glide for 0.8 seconds through the doorway where needed, or cut under reduced motion. The chosen place survives a return to reading and re-entry.
- Selected-date changes cross-dissolve for 0.8 seconds at the same camera with a caption. Compare and reduced motion cut instantly; a rapid newer date selection wins. The [gray-box blend capture](docs/phase0/661-dissolve-graybox.png) records the WebGL2 midpoint.
- “Describe this view” opens a native disclosure below the canvas. Authored JSON supplies a distinct starting-view description for every date and standing place. The description follows the visible date during Compare and the current camera direction after buttons, arrow keys, or drag; it identifies a moving camera during place glides. A separate “In the record” sentence links to an existing historical source. The same 12 starting-view descriptions are readable without JavaScript under the three passages.
- “Skip movement” finishes the current camera glide or date dissolve immediately, keeping the chosen place and date. Visitors can use its button or press Escape while focused in the room. It also clears the transition caption and updates the view description. It does not change future motion settings.
- “Pause motion” is a pressed-state toggle in the room. Turning it on finishes an active glide or dissolve and makes later date or place changes immediate. Turning it off restores transitions when the system reduced-motion setting permits them. The selected date and place stay intact, and Compare stays instant.
- Compare shows the previous date from the same camera while preserving the selected date. It works by pointer or keyboard hold, the C key, or a persistent click-only activation of either Compare button. Returning to reading releases the renderer; renderer failure falls back to the reading page.
- The pure state model defines all three dates, four places, Compare, and motion policy. Date, place, Compare, Pause, and reduced-motion behavior are wired to the live room.

## Next proposed chunk: idle rendering after date changes

First address any completed screen-reader observations the user supplies. Otherwise, pending approval, extend the idle-frame check to the separate date-dissolve and Compare paths. Select 661, observe `data-date-transition` turn true and then false, and measure a quiet interval; use Compare and return to 661, checking another quiet interval. Fix the scheduler only if frames keep rising, document and test the result, publish if app code changes, then stop for review. A real screen-reader pass remains open until a tester runs the check sheet.

When the user supplies completed response sheets, synthesize what participants noticed and how they interpreted it into `docs/DECISIONS.md` before committing to visual refinements.

## Where to work

| Purpose | Files |
| --- | --- |
| Requirements and historical decisions | `docs/PLAN.md`, `docs/DECISIONS.md` |
| First-view and full-visit budget checker | `scripts/check-assets.mjs`, `README.md` |
| Texture and sky records, fetch script, committed files | `assets.config.json`, `scripts/fetch-polyhaven.mjs`, `public/assets/polyhaven/` |
| Sky comparison and capture | `docs/phase0/SKY_COMPARISON.md`, `scripts/capture-sky-comparison.mjs` |
| Mobile audit and evidence | `docs/phase0/MOBILE_LAYOUT_AUDIT.md`, `docs/phase0/mobile-*.png` |
| Automated accessibility audit | `docs/phase0/ACCESSIBILITY_AUDIT.md`, `tests/e2e/accessibility.spec.ts` |
| Small-screen keyboard audit | `docs/phase0/KEYBOARD_AUDIT.md`, `tests/e2e/keyboard.spec.ts` |
| Screen-reader tester path | `docs/phase0/SCREEN_READER_CHECK.md` |
| Idle-render check | `docs/phase0/IDLE_RENDER_CHECK.md`, `tests/e2e/room.spec.ts` |
| Compare click-only behavior and limits | `docs/phase0/COMPARE_VIRTUAL_ACTIVATION.md` |
| Text, citations, and scene labels | `content/*.json`, `scripts/content.ts`, `src/schema/changeIds.ts` |
| UI state and Compare inputs | `src/main.ts`, `src/state/*.ts` |
| Camera, renderer, and dated geometry | `src/scene/createRoomView.ts`, `src/render/renderer.ts`, `src/world/*.ts` |
| Verification | `tests/unit/*.test.ts`, `tests/e2e/*.spec.ts` |

`scripts/content.ts` validates JSON and renders the full static reading page into `index.html` at build time. `src/main.ts` enhances that page after JavaScript loads, owns the reducer state, and lazy-loads one `RoomView`. `src/scene/createRoomView.ts` owns the camera, one canvas, movement and dissolve callbacks, and renderer disposal. Keep historical prose and scene descriptions in `content/*.json`, with source links, rather than adding historical claims to TypeScript. `src/state/` stays pure TypeScript without DOM or three.js dependencies.

The 680 Medina-to-Mecca claim is supported by the Madelung source in `content/sources.json`; the travel objects are invented and are not Husayn's belongings. The 661 coin is an interpretive replica linked to a museum catalog record, with no museum image. Keep the plan's guardrails: no people, relics, battle scene, weapons, or symbolic lighting. The passages and room symbolism still need instructor and community review. Other later work includes photoreal materials and lighting, reporting exit, device and screen-reader checks, and student testing.

The current room is still a gray-box prototype in its geometry and most surfaces, but its walls and floors now have candidate textures. The sky is a background HDRI under fixed prototype lights, so it does not test the planned sun patch or an irradiance bake. The arrival still matches the material preview; its framing has no visible sky. The plan also describes other assets, rendering features, exit content, checks, and a Pages workflow that have not all been implemented; treat those passages as future requirements, not descriptions of this checkout. Turned camera descriptions are deliberately broad, and the description changes to the destination date when a dissolve starts. WebGPU hardware, real mobile devices, and a screen reader have not been manually checked. Do not infer historical evidence from the invented props, stock textures, or stock skies.

## Run and verify

Use Node.js 22.12 or later. From the repository root:

```sh
npm ci
npm test
npm run build
npm run check:assets
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run e2e
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run capture:sky
```

To regenerate the arrival still after changing the room, run:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run capture:arrival
npm run build
```

This idle-render chunk passed the focused browser check and all 34 browser tests. The new check samples a stable 632 room, a look, and a completed move after two animation frames; the counter did not rise during each 300 ms quiet interval. It verifies that look and move actually increased the counter first. No renderer change was needed. See `docs/phase0/IDLE_RENDER_CHECK.md` for method and limits. No unit or asset checks were rerun because application and asset code did not change. Source commit `6ebe0d5` is pushed; the public `gh-pages` build remains `e8c43fe`.

The preceding first-view budget chunk passed `npm run check:assets`, including a fresh build and typecheck. It measured 44,297 / 300,000 first-view bytes and 5,016,889 / 15,000,000 full-visit bytes. Isolated fixtures showed that changed CSS and still references change the total, while an oversized file, missing file, arrival `srcset`, arrival `<picture>` source, or linked CSS asset reference fails. The check covers the plan's HTML, CSS, and arrival still measure; it does not claim a network transfer timing result. No unit or browser suite was rerun for that checker-only change. Source commit `bd105b4` is pushed; the public `gh-pages` build remains `e8c43fe`.

The preceding Compare chunk passed `npm run check:assets` (including typecheck and a fresh build), 17 unit tests, and all 33 browser tests. The new click-only browser path first failed against the old handler, then passed after the fix; it covers activation, reversal, pressed states, date and view labels, unchanged camera direction, and a click-only activation immediately after Enter release. The touch test now checks that a delayed click does not leave Compare on. The production `dist/` was 5,016,889 / 15,000,000 bytes. Source commit `3d8a6ff` and Pages commit `e8c43fe` were pushed; the Pages build reported `built`, and a live Chromium check confirmed the public click-only path. See `docs/phase0/COMPARE_VIRTUAL_ACTIVATION.md`. No real screen-reader pass has been run.

The preceding screen-reader preparation chunk changed documentation only. The tester sheet was checked against headings, labels, and focus code. No spoken output was heard and no screen-reader result is claimed. Unit, browser, and asset checks were not rerun for that documentation-only chunk. Its source commit was `2f41f8e`.

This keyboard chunk passed `npm run check:assets` (including typecheck and a fresh build), 17 unit tests, and all 32 browser tests. The two new keyboard paths at 390 × 844 cover the sampled room interaction and initial renderer failure. The failure test first showed that focus fell to the body after Enter was disabled; the fix returns it to the enabled retry button when appropriate. The production `dist/` is 5,016,398 / 15,000,000 bytes. See `docs/phase0/KEYBOARD_AUDIT.md` for the checked path and limits. The public `gh-pages` commit `6fb1bb7` reported `built`; live 390 × 844 Chromium forced renderer failure and confirmed the retry button was focused. A real screen-reader pass remains open.

The preceding accessibility chunk passed `npm run check:assets` (including typecheck and a fresh build), 17 unit tests, and all 30 browser tests. The eight new axe checks cover three widths in two baseline states and two expanded-note states. The first expanded 680 room scan found one moderate `heading-order` violation; a context-specific heading level fixed it, and all eight scans passed on rerun. The production `dist/` was 5,016,244 / 15,000,000 bytes. See `docs/phase0/ACCESSIBILITY_AUDIT.md` for method and limits. The public `gh-pages` commit `968e5ff` reported `built`; the live HTML contains an `h3` for the 680 room item and an `h4` for the matching reading item. A manual screen-reader review remains open.

The preceding small-screen chunk passed `npm run check:assets` (including typecheck and a fresh build), 17 unit tests, and 22 browser tests. The new browser check opens a 390 × 844 emulated mobile context and checks full scene visibility at 632 and 661 plus document width. `docs/phase0/MOBILE_LAYOUT_AUDIT.md` preserves before and after room captures and a reading capture. The production `dist/` was 5,016,236 / 15,000,000 bytes. A camera-drag browser test needed `scrollIntoViewIfNeeded()` after the layout move; it passed, then the full suite passed. Pages reported `bb07ef3` built; live Chromium showed the frame ending at `y=730` in both dates with the document width at 390 pixels. Real-device behavior remains to be checked.

The earlier default-sky chunk passed 17 unit and 21 browser tests. `npm run capture:arrival` confirmed the default sky ID; the downward doorway still has no visible sky, so it stayed in the repository. Pages reported `6fdba25` built; live Chromium opened the default and alternate rooms, both HDR files returned 200, and the default 632 yard view was inspected. The background choice remains provisional, not a historical claim.

The earlier sky-comparison chunk saved two matched 864 × 486 WebGL2 captures using `npm run capture:sky`; both were inspected. A temporary offline fixture showed the asset checker rejects a corrupted HDR. Pages reported `7483680` built, and live Chromium opened both query-selected candidate rooms with each HDR request returning 200.

The earlier asset-check chunk also used temporary fixtures to reject a corrupted JPG, invalid CC0 record, and oversized `dist/`.

The earlier material-preview chunk passed 20 browser tests. Chromium WebGL2 captures of the 632 doorway, 680 doorway, and 680 yard were inspected. `public/stills/632-arrival.webp` was regenerated from the textured room. The browser suite ran before the room-open timeout changed from 10 to 30 seconds; the final build passed after that small change. After Pages reported `built`, a live Chromium smoke check opened the 632 room and observed 200 responses for all six textures. The managed environment's Chromium needed `ignoreHTTPSErrors` for its proxy certificate; `curl` verified the live HTML without that override. A manual screen-reader check is still needed. Playwright serves the built page on `127.0.0.1:4173`; `/usr/bin/chromium` is the installed browser in this workspace. Elsewhere, install Chromium with `npx playwright install chromium` and adjust or omit the path override. The build output is `dist/` and is ignored by Git.

## Publish the preview

There is no `.github` workflow or deploy script in this checkout, despite older wording in the plan. GitHub Pages serves the root of `gh-pages`. Source-only checks need only a source-branch push. For later app changes, after checks pass, push the source branch, then publish **only built `dist/` files** from a separate `gh-pages` worktree:

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
