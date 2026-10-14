# Idle rendering check · 2026-10-14

The plan says the room should draw no frames once a view settles. The canvas `data-frames` counter increases after each scheduled render callback, so the browser check uses it to detect continued drawing requests.

In Chromium's WebGL2 fallback with SwiftShader, the check opens the 632 doorway, looks right once, then moves to the head of the room. At each settled point it lets two animation frames pass, records the counter, and verifies it stays unchanged for 300 ms. It also verifies that looking and moving each increase the counter, and waits for `data-moving="false"` before measuring the completed move. The focused check and full 34-test browser suite passed; the existing scheduler needed no change.

Run after `npm run build`:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run e2e -- tests/e2e/room.spec.ts -g 'stops drawing after entry'
```

This measures application render callbacks in one visible browser tab at a fixed viewport. It is not GPU-level instrumentation or a frame-rate result on the planned laptop, Chromebook, or phone.
