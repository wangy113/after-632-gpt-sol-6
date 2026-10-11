# First courtyard milestone

Checked October 10, 2026 (America/Chicago), before adding 661 and 680 content.

- Implemented one complete primitive courtyard and the source-checked 632 passage. The original handoff and the planning session's textbook review informed its wording; no instructor or historian sign-off is claimed.
- Inspected desktop, mobile, and rendered-courtyard screenshots. Refined the camera composition and replaced font-dependent decorative glyphs with inline SVG.
- Production build and strict TypeScript passed. Four content/state unit checks passed.
- Eight browser scenarios were run against the production build in system Chromium. Seven initially passed; the accessibility scenario found insufficient contrast on the gold entry button. After fixing that button, the desktop/390px/320px accessibility and overflow scenario passed.
- Confirmed opt-in WebGL, no-JavaScript content, keyboard-equivalent view controls, no idle frames, context-loss fallback, unavailable-WebGL fallback, repeated disposal/re-entry, and system reduced motion.
- Default refined view: 97 reported draw calls including shadow work, 1,426 reported triangles. Three.js is a separate lazy chunk, approximately 135 KB gzip. The HTML/CSS/controller and five WOFF2 font files fit below the proposed 200 KB compressed initial budget.
- Scope of evidence: headless Chromium using SwiftShader on managed Linux; no claim of real-phone GPU performance, six-minute learner timing, Safari testing, or screen-reader user testing. Those checks remain pending for a course release.

The first slice is ready for development of the remaining moments. This is an engineering and visual check, not completion of learner validation or publication approval.
