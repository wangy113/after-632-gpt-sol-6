# Compare click-only activation · 2026-10-14

The **Hold to see earlier date** button already previewed the previous date while a pointer, Space, or Enter was held. A click sent without those input events did nothing. In the 661 room, a DOM `button.click()` left the visible date at 661 before this change.

An unaccompanied click on Hold now switches the existing persistent Compare state on or off. The first activation shows 632 while 661 remains selected; a second activation restores 661. The Hold button's pressed state reflects whether the earlier date is visible, and its help text explains the single-activation option for assistive technology that cannot hold a button. The adjacent **Keep earlier date visible** button uses the same persistent state and remains available.

Physical pointer, touch, Space, and Enter holds still show the earlier date only until release. The code ignores the click that can follow a physical hold, including a delayed touch-generated click, so release does not accidentally leave Compare on. The browser test checks click-only activation and reversal, date and view labels, pressed states, unchanged camera direction, physical Enter and mouse release, and delayed touch release.

Run after `npm run build`:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run e2e -- tests/e2e/room.spec.ts -g 'click-only activation of Hold|touch holds Compare only until release'
```

DOM `button.click()` approximates one possible assistive-technology activation sequence; it is **not a screen-reader pass**. A tester still needs to run [the screen-reader check sheet](SCREEN_READER_CHECK.md) and report the actual spoken state and behavior.
