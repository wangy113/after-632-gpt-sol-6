# Screen-reader navigation check sheet

**Status:** Ready for a tester with a real screen reader; no screen-reader pass has been run. The build environment has Chromium but no screen reader, desktop/audio session, or speech output. Axe and Chromium's accessibility tree cannot verify spoken announcements.

**Site:** https://wangy113.github.io/after-632-gpt-sol-6/ (use the current public build with JavaScript enabled).

Before starting, record the screen reader and version, browser and version, operating system, date, and any settings that change navigation. Use the reader's normal heading, next-item, and button activation commands. Record the words actually spoken, not just whether the visual page changed.

| Step | Navigate and listen for | What the tester heard / issue |
| --- | --- | --- |
| 1. Reading headings | From the top, find `After 632` (H1), `Three moments in one history` (H2), the 632/661/680 moment headings (H3), then `Sources` (H2). The room heading should be absent before entry. | |
| 2. Reading path | Activate **Read without 3D**. Check whether focus and announcement land on `Three moments in one history`. Open the 680 scene notes and follow a source link. Check that the imagined scene text and “In the record” text are distinguishable. | |
| 3. Enter | Return to the top and activate **Enter the room**. Check whether `632 CE · Inside the imagined room` is announced as a heading. Find the **Room date** group with `632 CE · Absent` pressed, then **Place to stand** with `Doorway` pressed. | |
| 4. View alternative | Focus the scene frame. Its name should identify the doorway, and its description should give the room and orientation help. Open **Describe this view**; listen for the 632 doorway description, a separate “In the record” statement, and its source link. | |
| 5. Change state | Activate `661 CE · Added`, then `Head of room`. Check that the selected/pressed states and the open view description update to 661 and the new place without repeated or conflicting announcements. | |
| 6. Compare | Activate **Keep 632 CE visible** and listen for its pressed state and the 632 comparison; activate it again to restore 661. Also try the adjacent **Hold to see 632 CE** using the screen reader's button command. Record exactly what happens: a virtual activation may not produce a physical press-and-hold event. | |
| 7. Return | Activate **Return to reading**. Check whether focus and announcement land on `Three moments in one history`, and whether the three dated passages remain reachable. | |

For any problem, note the step, exact announcement or silence, focused control, keys/gestures used, and whether it repeats. In particular, report if the Hold button appears to activate but does nothing; the persistent Compare button is the available alternative until that behavior is checked and resolved. Leave this sheet marked **not run** until an actual tester completes it. An accessibility-tree snapshot or a keyboard-only browser test does not count as this pass.
