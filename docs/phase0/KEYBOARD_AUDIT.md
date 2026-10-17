# Small-screen keyboard audit · 2026-10-13

## What was checked

`tests/e2e/keyboard.spec.ts` uses Chromium at 390 × 844 pixels and operates the built page through keyboard events, without pointer clicks or programmatic focus. The first path tabs to Enter, opens the room with Enter, selects 661 with Space, selects the yard and skips its active camera move with Escape, turns the focused scene with an arrow key, holds and toggles Compare, opens and closes “Describe this view,” activates Skip movement, and returns to reading. Focus, selected states, rendered dates, and status text are checked along the way.

The second path forces WebGL2 creation to fail after keyboard entry. Before the fix, disabling the focused Enter button during loading left focus on the document body. When the retry button appeared, the next Tab skipped it. The failure handler now focuses “Try the room again” if the visitor entered with focus on Enter and focus was lost during loading. It leaves focus alone if the visitor moved to another control while the room loaded. The test confirms the retry button is focused, then Tab reaches “Read without 3D” and Enter focuses the reading heading. The existing room test separately checks that a context loss after entry returns focus to the reading heading.

## Graphics keyboard follow-up · 2026-10-17

The 390 × 844 path now uses ArrowRight on the focused in-room **Normal** radio to select **Low** after reaching 661 CE at the yard. It waits for the new canvas, checks that the Low radio remains checked and focused, 661 and yard remain selected, and only one canvas exists. The next Tab still reaches “Describe this view,” and the existing path still returns to reading with the keyboard. Both focused keyboard tests passed in local Chromium with the WebGL2 software fallback. This is an emulated small viewport and keyboard check, not a real phone or screen-reader result.

Run after `npm run build`:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run e2e -- tests/e2e/keyboard.spec.ts
```

Both keyboard paths pass. This Chromium check covers the sampled flow, not every tab stop or browser and assistive technology combination. A manual screen-reader pass, real-phone check, and review of all focus announcements remain open.
