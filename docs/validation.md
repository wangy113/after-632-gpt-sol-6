# Initial implementation validation

Checked October 11, 2026 (America/Chicago). This record covers the source-backed three-moment implementation in this repository. The first courtyard/632 check is separately recorded in [milestone-1.md](milestone-1.md).

## Photographic visual update — October 11, 2026

- The opening, reading fallback, and all three dated interactive views now show images rendered from one detailed Blender Cycles courtyard. The render uses four local Poly Haven CC0 material sets and one pure sky HDRI. The page calls the courtyard an invented interpretive setting, not a photograph of a real site. Asset creators, links, files, and output sizes are recorded in `content/assets.json`; the pipeline and fixed camera limitation are in `docs/photographic-rendering.md`.
- The opening WebP is 1920 × 1200 and 353,918 bytes. The three 3072 × 1536 panorama WebPs are 378,584 bytes (632), 351,736 bytes (661), and 398,098 bytes (680). The browser projects each from the same point, lets visitors look within bounded yaw/pitch, and crossfades the sunlight changes. No geometry is drawn in the browser. All three views loaded in headless Chromium with one draw call and two triangles per displayed frame.
- The reading and unavailable-WebGL view now uses additional 1920 × 1200 perspective images for 661 (341,658 bytes) and 680 (296,008 bytes), with the opening image for 632. All three show the same scene and camera under their date's sunlight. The two new images were visually inspected, and a production browser check confirmed that selecting 661 loads the correct image.
- `npm run check:release`, `npm test`, `npm run build`, and all 13 Playwright browser checks pass after merging the remote keyboard-focus fix. The browser suite covers dates, matching reading images, keyboard controls, idle rendering, re-entry, unavailable WebGL, lost context and focus recovery, a missing dated panorama, reduced motion, responsive overflow, and automated accessibility scans. Desktop and 390px mobile captures were visually checked. These browser checks used software WebGL and do not establish real-device frame rate.

## Production and behavior

- Vite 8 produces a static `dist/` with the full historical text and links in HTML. The Three.js viewer loads only after a visitor chooses the courtyard. Three local panorama requests returned HTTP 200 in the production Chromium capture, and the selected date reported one draw call and two triangles. Rendering stops after a settled view.
- The 10 Playwright scenarios cover no-JavaScript reading, opt-in WebGL, keyboard view controls, idle rendering, reduced motion, unavailable WebGL, missing image fallback, context loss, repeated entry/disposal, three-date navigation, 320/390/1440px reflow, and WCAG-tagged axe scans. Automated checks are evidence for their tested views, not accessibility certification.
- Screenshots from the built artifact are [desktop](preview-desktop.jpg), [courtyard](preview-courtyard.jpg), and [mobile](preview-mobile.jpg). The final browser capture reported no page or console errors and no failed photo requests.
- The build uses relative asset paths, local DM Sans, local scene images, and bundled code. It makes no runtime request to Poly Haven or any external asset host. The source maps and HDRI are supplied in the repository for reproducing the images.
- The content check now verifies every listed local asset path and byte size. A nested-path production check at `/course/after-632/` loaded the 680 reading image and interactive panoramas with no failed requests.
- GitHub Pages serves the built `gh-pages` branch at `https://wangy113.github.io/after-632-gpt-sol-6/`. A public Chromium check entered the courtyard, selected 680, observed `data-assets="ready"`, and recorded no failed requests or page errors.

## Content and culture

- The three main passages are 40, 43, and 43 words. All three cite Parkinson chapter 8, with source comparisons recorded in [content-review.md](content-review.md).
- The courtyard is labelled an imagined interpretive setting in the opening and near the rendered view. It contains no historical people, worshippers, combatants, voices, religious inscriptions, or simulated battle.
- Both AP report cards show exact publication dates and link to the checked article or its accessible syndication. The original October 2026 AP ID is preserved in `content/news.json`. The May 2025 report remains explicitly dated.

## Pending before classroom use

### Small phase: keyboard focus after 3D failure — October 11, 2026

- Reproduced lost focus when WebGL context loss hides a focused view control or the in-scene reading button. The fallback now focuses the selected moment's heading without forcing a scroll. Focus elsewhere, such as a report link, is preserved.
- Expanded the context-loss browser check to cover both hidden-control groups and an unaffected report link, with 680 selected. All three passages remain visible, the canvas is disposed, and retry stays available.
- Before the fix, both hidden-control focus assertions failed; the report-link assertion passed. After the fix, all five targeted Chromium checks passed (three focus scenarios, unavailable WebGL, and repeated reading/3D switches). Release validation, all four unit tests, typechecking, and the production build also passed. The full browser suite was not rerun in this small phase.
- Next small phase: broaden browser coverage to Firefox or WebKit. Real-device, screen-reader, historical, and learner reviews below remain pending.

### Remaining checks

- Instructor or qualified historical reviewer acceptance of final wording and context.
- Confirm that the May 2025 report meets the course term's definition of “recent”; recheck both report links and the news context each term.
- Test with an actual phone and ordinary student laptop, including load time, active frame rate, touch handling, and memory use. Headless SwiftShader results do not establish hardware performance.
- Manually test screen-reader behavior and cross-browser use in Safari/WebKit and Firefox. Automated axe/Chromium checks do not cover those combinations.
- Observe representative students to check whether the room feels spacious and contemplative, the dates read as development within a shared Muslim history, and a self-paced visit is around six minutes. No learner observation or timing has occurred yet.
- Narration is optional and intentionally absent. If it is added later, use reviewed recording and synchronized captions with a persistent full transcript.

The artifact is suitable as an initial implementation for review. The pending checks define classroom release readiness.
