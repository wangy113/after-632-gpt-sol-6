# Build decisions

## 632 gray-box view · 2026-10-13

- The mats, cups, empty head position, and footprints are interpretive scene details. They do not depict a documented meeting place or route. Every detail has an “In this room” explanation beside a sourced “In the record” statement.
- The same explanations appear under the static 632 passage, so a reader without JavaScript can reach them and their citations.
- The existing Parkinson textbook supports the broad 632 succession account. Mahjabeen Dhala's Cambridge University Press excerpt, Introduction p. 1, supports the narrower statement that some companions met at Saqifa before Muhammad's burial. The scene does not claim Ali was preparing the burial during that meeting; the checked source does not establish that timing.
- The default doorway camera tilts down 0.30 radians so the loose mat circle and departing footprints are visible at entry. The room and yard keep the same neutral lighting as the earlier gray box.
- The [Chromium WebGL2 gray-box capture](phase0/632-graybox.png) records the doorway composition. WebGPU hardware, mobile layout, and a screen reader still need manual checks.

## 661 evidence records · 2026-10-13

- Donald P. Little's [Britannica article on Muʿāwiyah I](https://www.britannica.com/biography/Muawiyah-I), “Caliphate,” supports Damascus as his capital and says early Arabic sources credit him with a chancellery and postal service intended to improve communication. It does not date those institutions to 661. The sealed letter is fictional and makes no claim to be a surviving message. The plan's specific governor-of-Medina claim was removed from the label because this source does not establish it.
- The [British Museum's Arab-Sasanian silver coin, 1922,0424.3865](https://www.britishmuseum.org/collection/object/C_1922-0424-3865), is cataloged as minted at Nihavand in 660 CE (AH 40; YE 29). It establishes a coin of this type before the 661 scene, but no find from the imagined room. A coin merely dated to the 660s or 670s could have been minted after 661, so that range alone cannot justify placing one in the scene.
- Both sides of a suitable coin have not been verified under CC0. The 660 museum specimen is a catalog reference only; its image is not included. The `coin-661` room object is explicitly an interpretive replica. If a securely dated coin with usable photographs is found later, its date, accession, both image licenses and links must be checked before replacing the replica.
- A [656 Bishapur coin photograph](https://commons.wikimedia.org/wiki/File:Islamic_coin,_Time_of_the_Rashidun._Khosrau_type._AH_31-41_AD_651-661.jpg) is licensed CC BY-SA, outside the plan's CC0 image requirement. [LACMA M.2002.1.450](https://collections.lacma.org/object/116558) is dated 674–683, after the 661 scene. Neither image was imported.

## 661 gray-box view · 2026-10-13

- At this checkpoint, the 632 and 661 groups were built once inside the same room and toggled by two date buttons. Switching was immediate and kept the camera fixed. The 680 scene and Compare controls were still later work.
- The first four 661 object groups matched the sourced labels. The plain coin disc carried no museum image or invented ancient writing. The letter was unmarked, and the seat had no ornament or personal association.
- The 661 labels also appear under the static passage when JavaScript is off. The room date buttons expose their pressed state, and the current passage link follows the selected date.
- The [Chromium WebGL2 gray-box capture](phase0/661-graybox.png) records the 661 doorway composition. The screenshot and automated browser checks do not replace instructor or community review of the symbols.

## 632/661 Compare · 2026-10-13

- Compare in the 661 room shows the earlier 632 change set immediately from the same camera. It does not change the selected date or rebuild the room. The 661 date button remains selected while the visible notes, lens, and view description follow the 632 scene; releasing Compare restores the 661 view and notes.
- A hold button supports mouse, touch, and keyboard press-and-hold. Holding C while the room is active is an alternate shortcut. A separate native toggle button supports persistent comparison and exposes its pressed state. The hold ends on release or cancellation, and leaving the room clears Compare.
- Compare is unavailable in 632 because it has no preceding scene. At this checkpoint, the 680 passage was in the reading page, but its room view awaited a change set.

## 680 historical record and gray-box view · 2026-10-13

- Wilferd Madelung's [Encyclopaedia Iranica article on Husayn](https://www.iranicaonline.org/articles/hosayn-b-ali-i/), in the paragraph beginning “After Moʿāwia’s death,” says that in 680 Yazid ordered the governor of Medina to compel Husayn's allegiance and Husayn left for Mecca to seek asylum. This supports the specific journey claim in the 680 label. Parkinson's textbook, section 8.9, supports the broader account of Husayn's refusal, death at Karbala, and later Shi'a commemoration. Neither source places a bag, waterskin, hook, or meeting room in Husayn's life.
- Ordinary travel things are placed by the door in the imagined 661 room so visitors can compare their presence with their absence in 680. The 680 scene keeps the plain seat and room arrangement, and shows a clean floor patch and an empty hook where the things had been. The palm grows taller to mark elapsed time; the light stays fixed. The belongings and traces are invented, and none is a personal relic of Husayn.
- The 680 room depicts no battle, injury, mourning gathering, or person. Its arrangement does not return to the 632 circle. The 680 labels and description keep the imagined scene separate from the cited historical account. Instructor and community review of the passage and symbolism remains open.
- The updated [661 doorway capture](phase0/661-graybox.png) and [680 doorway capture](phase0/680-graybox.png) show the travel things and their floor trace from the same camera. The empty hook is visible when turning toward the door wall; the palm crown requires turning toward the yard and looking up.

## Four places to stand · 2026-10-13

- The doorway remains the entry view. The head of the room faces the doorway, the peg position faces the hooks, and the yard faces back into the room. These are standing points in the same imagined scene; selecting one does not change the historical date or Compare state.
- Camera moves take 0.8 seconds and use the doorway opening as a waypoint between the room and yard. A new selection replaces an unfinished move. Reduced motion cuts to the chosen position, and closing the room cancels the move and releases the canvas.
- Each place allows one bounded turn in either direction and limits vertical looking. Reset view faces that place's default direction. The selected place and orientation are described beside the view for keyboard and screen-reader use.
- The [head](phase0/680-head-graybox.png), [pegs](phase0/680-pegs-graybox.png), and [yard](phase0/680-yard-graybox.png) gray-box captures record their 680 compositions. These do not settle the planned material, lighting, mobile, or screen-reader checks.

## Date cross-dissolve · 2026-10-13

- A selected-date change captures the outgoing and incoming room at one camera pose, then blends those two images for 0.8 seconds in the existing canvas. The date, lens, and notes update immediately; a short caption such as “29 years later” accompanies the visual change.
- Compare, reduced motion, a new place or look direction, resize, and leaving the room end the dissolve immediately. A rapid second date choice cuts to the newest date. The same renderer and world remain in use, and idle frames stop once the view settles.
- The [632-to-661 gray-box blend](phase0/661-dissolve-graybox.png) shows both dated arrangements from the yard during the transition. This verifies the WebGL2 fallback visually; WebGPU hardware and mobile devices still need manual checks.

## Describe this view · 2026-10-13

- `content/views.json` holds a scene description for the starting camera direction at each of the 12 date and place combinations. Each date selects a validated label from `content/changes.json` for a separate “In the record” sentence and source link. The new text does not treat the invented room as historical evidence.
- The room uses a native disclosure. While it is open, date, place, Compare, and camera turns update its text. A turned camera gets a broad description of its current direction; the dated starting-view detail is labeled separately with Reset view instructions. A moving camera gets a temporary movement description until it arrives.
- The 12 starting-view descriptions and their record links also appear under the passages without JavaScript. Keyboard behavior and the resulting document structure were checked in Chromium; a manual screen-reader review remains open.

## Skip movement · 2026-10-13

- The room's existing methods snap an active camera glide to its chosen standing place and end an active date dissolve on its chosen date. The Skip movement button invokes both and clears transition state; Escape does the same while focus is in the room.
- The control applies only to the current transition. It leaves the system reduced-motion preference and future transitions alone. If no transition is active, it reports that there is no movement to skip.

## Wall and floor material preview · 2026-10-13

- The [Poly Haven clay_plaster](https://polyhaven.com/a/clay_plaster) and [clay_floor_001](https://polyhaven.com/a/clay_floor_001) candidates add 1k CC0 texture sets to the wall and floor surfaces. The room and yard keep the same geometry and lighting across all dates, so the dated traces remain the changes to inspect. The reading page credits the assets and links to [Poly Haven's CC0 terms](https://polyhaven.com/license).
- These are stock artist textures used to judge legibility and atmosphere. Weathered plaster and a painted clay floor do not establish the materials of any seventh-century meeting room. The yard ground also uses the floor candidate for this preview; a separate yard surface remains future work. The roof, props, and sky retain prototype materials.
- Visual and historical suitability still need review, including whether the new surfaces obscure the mats, footprints, and 680 clean patch. This preview does not settle the planned photoreal finish, real-device performance, or instructor and community review.

## Clear-morning sky candidates · 2026-10-13

- Two CC0 Qwantani pure-sky HDRIs are pinned as candidates. The [same-view A/B captures and provenance](phase0/SKY_COMPARISON.md) show each in the 632 yard at a fixed upward pose. Only the background changes; the room lights and materials stay fixed. Morning appears lighter than mid-morning in the sampled sky area.
- Qwantani morning is the provisional default because its lighter sky may improve legibility while matching the plan's clear-morning direction. `?sky=qwantani_mid_morning_puresky` keeps the darker candidate available for comparison. The HDRI is a background only; ambient and directional room lights stay fixed. The stock skies are visual references, not historical evidence. Human review of legibility and restraint, the planned doorway sun patch, and real-device lighting performance remains open.

## Small-screen room entry · 2026-10-13

- The [390 × 844 layout audit](phase0/MOBILE_LAYOUT_AUDIT.md) found that the scene was cut off on the first screen after entering the room. The Compare controls and help now follow the canvas in document order, leaving date and place selection before it. The full scene fits in the initial viewport at both 632 and 661, with no horizontal overflow in the emulated mobile browser.
- This is a browser viewport check. Real-phone behavior and screen-reader navigation still need manual review.

## Automated accessibility pass · 2026-10-13

- [Eight axe-core scans](phase0/ACCESSIBILITY_AUDIT.md) now cover the static reading page and entered room at 1440, 390, and 320 pixels, plus expanded reading and room notes at 320 pixels. The scans use the built page in Chromium and pass with no reported violations.
- The expanded 680 room notes exposed a heading-order issue: item headings jumped from the room's `h2` to `h4`. Room item headings are now `h3`; reading item headings remain `h4` below their date's `h3`.
- The automated result does not validate the WebGL image or replace a manual keyboard and screen-reader review. Those checks remain open.
