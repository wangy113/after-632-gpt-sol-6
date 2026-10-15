# Automated accessibility check · updated 2026-10-14

## Method and result

`tests/e2e/accessibility.spec.ts` runs `@axe-core/playwright` 4.13.0 (axe-core 4.13.0) against the built site in Chromium. It uses axe's default enabled rules and fails on any reported violation. The static reading tests serve the built HTML and CSS while replacing only the app entry script with an empty module; this lets axe run while leaving the page in its app-free state. The separate no-JavaScript browser test checks that the history and sources remain readable with JavaScript disabled.

| State scanned | Viewport widths | Final axe violations |
| --- | --- | ---: |
| Static reading page, default disclosures | 1440, 390, 320 px | 0 at each width |
| Entered 632 room after the canvas rendered | 1440, 390, 320 px | 0 at each width |
| Static 680 reading notes expanded | 320 px | 0 |
| Entered 680 room, view description and scene notes expanded | 320 px | 0 |
| Plain reporting exit, optional lenses expanded | 320 px | 0 |

The expanded 680 room scan initially reported one **moderate `heading-order`** violation: the first scene item was an `h4` immediately below the room's `h2`. The room list now uses `h3` headings. The same list under each reading passage keeps `h4` headings beneath that passage's `h3`. The shared styling keeps their appearance consistent. All nine current scans pass. The exit scan was added with the separate reporting page; it checks the expanded disclosure and source links at the narrowest sampled width.

Run after `npm run build`:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run e2e -- tests/e2e/accessibility.spec.ts
```

This is an automated DOM check, not an accessibility certification. Axe cannot judge the WebGL scene pixels, the clarity of the authored descriptions, or how the page sounds and behaves in a screen reader. A manual keyboard and screen-reader pass across the date, place, Compare, disclosure, and fallback states remains open, as do real-device checks.
