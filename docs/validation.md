# Initial implementation validation

Checked October 11, 2026 (America/Chicago). This record covers the source-backed three-moment implementation in this repository. The first courtyard/632 check is separately recorded in [milestone-1.md](milestone-1.md).

## Poly Haven visual update — October 11, 2026

- Added four Poly Haven CC0 materials, each using local 1K WebP maps, and one local 1K pure sky HDRI. The 11 scene files total 3,051,172 bytes; the still used in the opening and reading fallback is 87,344 bytes. Asset sources, creators, and local paths are in `content/assets.json` and visible in the page's design note.
- The HDRI provides environment light and a visible sky without geographic landmarks. Clay plaster, sand, palm bark, and rough wood maps provide surface detail; the ground has slight geometry variation. The scene retains its explicit interpretive label and simplified geometry.
- Chromium loaded all 11 asset URLs with HTTP 200. A settled 1440px scene reported 29 draw calls and 8,428 triangles; the 390px scene reported 28 draw calls and 8,420 triangles. Browser checks passed for content, keyboard controls, reduced motion, reading fallback, context loss, dates, accessibility scans, and responsive layout. After adding vegetation detail, instancing the reeds and stones and merging palm fronds brought the targeted draw-call rerun below the original limit.
- `npm run check:release`, `npm test`, `npm run build`, and the targeted 3D browser check pass. Eight other browser checks passed in the preceding full run. These measurements use headless Chromium with software WebGL and are not real-device frame-rate evidence.

## Production and behavior

- Built static `dist/` with Vite 8, TypeScript, and locally bundled fonts. `npm run check:release` confirms three reviewed-in-code moments and two verified report records. `npm run typecheck`, `npm test`, and `npm run build` pass.
- Automated browser scenarios use the built site in headless Chromium on managed Linux. They cover no-JavaScript text, opt-in WebGL, keyboard view controls, pause/skip/reduced motion, unavailable WebGL, context loss, repeated entry/disposal, three-date navigation, and 320/390/1440px reflow. The last full run result is recorded in the repository checks and the commit report; the individual scenarios are inspectable in `tests/experience.spec.ts`.
- Automated WCAG-tagged axe checks cover the default desktop/mobile page and the selected 680 interactive view. Contrast defects found during implementation were fixed before final checks. These scans are evidence for the tested views, not certification.
- A production Chromium pass switched 680 → 661 → 632 with no page errors and the renderer reporting the final selected moment as 632. Screenshots from the built artifact are [desktop](preview-desktop.jpg), [courtyard](preview-courtyard.jpg), and [mobile](preview-mobile.jpg).
- Copied the built artifact under `/course/after-632/` on a simple static server. Chromium loaded the page, local display font, and 3D courtyard with HTTP 200 and no failed asset requests. This checks the relative asset path configuration.
- Default courtyard reported 97 draw calls (including shadow work), 1,426 triangles, and three frames after entry before idling. A separate browser check observed no additional frames after settling. These numbers are from software-rendered Chromium and are not real-device frame-rate measurements.
- Production output: HTML 6.79 KB gzip, CSS 5.00 KB gzip, controller 2.37 KB gzip, lazy Three.js/scene chunk 135.38 KB gzip. Five WOFF2 font faces total about 69.75 KB uncompressed. There are no remotely hosted fonts, textures, or API calls required at runtime.
- `npm audit --omit=dev` reported zero production dependency vulnerabilities on this check date.

## Content and culture

- The three main passages are 40, 43, and 43 words. All three cite Parkinson chapter 8, with source comparisons recorded in [content-review.md](content-review.md).
- The courtyard is labelled an imagined interpretive setting in the opening and near the rendered view. It contains no historical people, worshippers, combatants, voices, religious inscriptions, or simulated battle.
- Both AP report cards show exact publication dates and link to the checked article or its accessible syndication. The original October 2026 AP ID is preserved in `content/news.json`. The May 2025 report remains explicitly dated.

## Pending before classroom use

- Instructor or qualified historical reviewer acceptance of final wording and context.
- Confirm that the May 2025 report meets the course term's definition of “recent”; recheck both report links and the news context each term.
- Test with an actual phone and ordinary student laptop, including load time, active frame rate, touch handling, and memory use. Headless SwiftShader results do not establish hardware performance.
- Manually test screen-reader behavior and cross-browser use in Safari/WebKit and Firefox. Automated axe/Chromium checks do not cover those combinations.
- Observe representative students to check whether the room feels spacious and contemplative, the dates read as development within a shared Muslim history, and a self-paced visit is around six minutes. No learner observation or timing has occurred yet.
- Narration is optional and intentionally absent. If it is added later, use reviewed recording and synchronized captions with a persistent full transcript.

The artifact is suitable as an initial implementation for review. The pending checks define classroom release readiness.
