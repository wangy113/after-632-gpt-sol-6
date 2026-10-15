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

## Small-screen keyboard path · 2026-10-13

- The [390 × 844 keyboard audit](phase0/KEYBOARD_AUDIT.md) follows entry, date and place selection, movement skip, scene turning, Compare, a disclosure, and return to reading using keyboard input. It also checks initial renderer failure and recovery through the reading link.
- Initial renderer failure previously left focus on the body because the focused Enter button was disabled during loading. On that failure, focus now returns to the enabled retry button if it was on Enter before loading and has not moved to another control. A context loss after the room opens still focuses the reading heading.
- The automated path passed after the fix. A manual screen-reader review and real-device checks remain open.

## Compare click-only activation · 2026-10-14

- A [click-only activation check](phase0/COMPARE_VIRTUAL_ACTIVATION.md) showed that the Hold button did nothing when it received `click` without pointer or physical key events. This can occur with an assistive-technology button command, although no real screen reader is available here to confirm its event sequence.
- An unaccompanied click on Hold now switches the existing persistent comparison on or off. Pointer, touch, Space, Enter, and C holds remain temporary. A click following a physical hold is ignored so release does not leave Compare on. The Hold button's pressed state now reflects the visible comparison, and its help text explains the single-activation option.
- Browser checks cover the click-only surrogate and physical releases. Spoken announcements and actual assistive-technology activation remain open for a tester using the [screen-reader check sheet](phase0/SCREEN_READER_CHECK.md).

## First-view byte budget · 2026-10-14

- `npm run check:assets` now reads the built HTML's stylesheet links and `#arrival-still` source, and sums those files with `dist/index.html`. The current first view is **44,297 / 300,000 bytes**: 27,392 HTML, 3,725 CSS, and 13,180 WebP. The full built visit remains **5,016,889 / 15,000,000 bytes**.
- The check follows the built references rather than fixed filenames, and fails for missing, external, or out-of-build references. It also stops if the arrival image gains `srcset` or a `<picture>` source, or linked CSS gains `@import` or `url()`, until those resources are budgeted. Isolated fixtures confirmed changed references change the total and that missing, oversized, or uncounted resources fail. The plan defines this first-view budget as HTML, CSS, and arrival still; it does not include the initial JavaScript module. The current stylesheet has no imported assets.

## Idle room rendering · 2026-10-14

- The [idle rendering check](phase0/IDLE_RENDER_CHECK.md) samples the canvas `data-frames` counter after the 632 doorway settles, after looking right, and after moving to the head of the room. Each action increases the counter, then it stays unchanged during a 300 ms quiet interval. The scheduler already stops requesting frames at those settled points, so no application change was needed.
- A follow-up check confirms that a 632-to-661 date dissolve actually starts and ends, then the counter stays still. Persistent Compare to 632 and back to 661 each render the changed view and also settle without further frames. No scheduler change was needed for these paths.
- The counter measures scheduled render callbacks in Chromium's WebGL2 fallback with SwiftShader. GPU work and frame rates on the demo laptop, Chromebook, and phone remain unmeasured.

## Diagnostic shadow pair · 2026-10-14

- The [matched 632 doorway captures](phase0/GEOMETRY_BASELINE.md#matched-doorway-shadow-images--2026-10-14) show a hard-edged bright floor patch, darker wall and floor surfaces, and lower mat and cup contrast with `?shadows=1`. The three imagined traces remain visible, but a narrow bright left-wall line needs investigation. Keep shadows off for normal visits while this visual treatment is refined; the single software-rendered pose does not establish the planned lighting or real-device performance.

## Diagnostic left-wall line · 2026-10-14

- [Same-pose shadow probes](phase0/GEOMETRY_BASELINE.md#left-wall-shadow-line-probe--2026-10-14) show that raising shadow-map resolution from 1024² to 2048² does not remove the line at the left/back wall junction. A temporary shadow bias of −0.001 makes it brighter; +0.001 makes it a little fainter. The shadow-off image has no line, and the wall boxes overlap rather than leaving an open gap. This implicates the shadow depth comparison at the junction, but does not distinguish wall caster/receiver geometry from depth precision or filtering.
- Restore the baseline diagnostic setting after each probe, keep normal visits shadow-free, and defer any permanent bias or lighting change until the corner and the scene's three traces are reviewed together.

## Wall corner shadow participation · 2026-10-14

- The [same-pose caster/receiver probes](phase0/GEOMETRY_BASELINE.md#leftback-wall-caster-and-receiver-probe--2026-10-14) identify the left wall as the caster and the back wall as the receiver for the narrow bright line. Removing left-wall casting widens the bright area on the back wall; removing back-wall reception brightens that whole wall. Removing back-wall casting produces a byte-identical image. Neither flag change is a suitable visual fix.
- The exact edge mechanism remains open: overlapping wall geometry, shadow depth precision, or filtering could set the thin bright boundary. Restore both wall flags and keep the diagnostic and normal visit settings unchanged until a focused junction-geometry probe and scene-wide light review are complete.

## Flush wall junction probe · 2026-10-14

- [The matched flush-junction capture](phase0/GEOMETRY_BASELINE.md#flush-leftback-wall-junction-probe--2026-10-14) shortens the diagnostic left wall by 10 cm at its rear edge, removing its depth overlap with the back wall while keeping its front edge fixed. The bright corner line becomes a faint dotted trace rather than disappearing, and no broad light wedge appears at the sampled doorway pose. This shows the junction dimensions affect the shadow boundary.
- The flush test leaves coplanar wall faces at the contact strip, so it does not isolate geometry from depth precision or filtering and is not a permanent fix. Restore the original wall dimensions; normal visits and the baseline shadow diagnostic remain unchanged.

## Cap-free flush junction probe · 2026-10-14

- [Removing the diagnostic flush wall's hidden rear cap](phase0/GEOMETRY_BASELINE.md#cap-free-flush-junction-probe--2026-10-14) restores a continuous bright line along the back-wall corner. The cap-free image differs from the capped flush image only around that line; it does not create a broad light wedge. The cap cannot be the sole source of the line and appears to suppress part of it through shadowing at this pose.
- Neither temporary geometry is a suitable permanent fix. Restore the original wall and shadow settings; a later focused shadow-filter or joined-corner test should precede any wider use of the diagnostic shadows.

## VSM shadow comparison · 2026-10-14

- [The matched VSM image](phase0/GEOMETRY_BASELINE.md#vsm-shadow-comparison--2026-10-14) has no visible left/back wall line at the 632 doorway pose. The bright floor patch remains prominent with a slightly softer edge, while the mat circle, three cups, and footprints remain visible. This is a visual candidate, not a lighting decision across dates or devices.
- VSM took 5 renderer calls versus PCF's 3 in the same shadow-on capture because of its blur passes. Its caster behavior also differs, so the image alone does not prove filtering caused the improvement. Restore PCF for the opt-in diagnostic and keep normal visits shadow-free until cost and wider visual checks support a choice.

## VSM doorway submission cost · 2026-10-14

- [Fresh matched 632 doorway measurements](phase0/GEOMETRY_BASELINE.md#vsm-doorway-submission-counts--2026-10-14) give PCF 90 draws / 4,393 submitted triangles / 3 renderer calls and temporary VSM 99 / 4,479 / 5. The increase matches two fullscreen blur draws plus seven mat boxes joining VSM's shadow pass. Both fit the plan's numerical draw and triangle limits at this gray-box pose.
- These counters omit pixel work, render-target bandwidth, GPU and frame time, and real-device performance. Restore baseline PCF and leave normal visits shadow-free; the separately opt-in VSM preview below lets reviewers see the candidate without changing the existing diagnostic default.

## Opt-in shadow-filter preview · 2026-10-14

- Offer VSM through `?shadows=1&shadowFilter=vsm` for direct review. `?shadows=1` keeps the existing PCF diagnostic, and normal visits have no shadow pass. The VSM option changes no room geometry or lighting settings.
- This exposes the candidate for visual feedback; it does not adopt shadows for regular visits or establish the Balanced-tier performance target. The doorway, pegs, and travel-corner reviews below assess more views; the strong floor patch and real-device performance still need review.

## 661 doorway shadow-filter review · 2026-10-14

- [Matched PCF and VSM captures](phase0/GEOMETRY_BASELINE.md#matched-661-doorway-filter-review--2026-10-14) keep the seat, mat rows, table, and right-side travel things in the same places. VSM removes the apparent narrow left/back wall line at this pose but makes the mats' fine striping less apparent. The bright floor patch remains prominent in both.
- This doorway view cannot establish whether the tiny letter and coin are readable, and it does not show the pegs or hook. The later 680 doorway and pegs reviews, summarized below, cover those other views; keep both filters diagnostic-only.

## Cross-view shadow-filter decision · 2026-10-14

- Matched PCF/VSM captures now cover the [doorway](phase0/GEOMETRY_BASELINE.md#matched-680-doorway-filter-review--2026-10-14), [pegs](phase0/GEOMETRY_BASELINE.md#matched-632-pegs-pcfvsm-completion--2026-10-14), and [travel corner](phase0/GEOMETRY_BASELINE.md#matched-632-travel-corner-pcfvsm-completion--2026-10-14) at 632, 661, and 680. VSM makes the thin doorway wall line less apparent, but the broad angular sunlit floor area remains prominent and fine striping on the 661/680 mats becomes flatter. At the pegs, filter differences stay at the far-right seam, away from the dated props. At the travel corner, both filters keep the 661 bags and 680 curved oval trace distinct; VSM brings no clear gain for those focal objects.
- Keep shadows off for normal visits: the strong floor lighting and reduced contrast in shadowed views remain unresolved. Keep PCF as the opt-in `?shadows=1` diagnostic default because it preserves more mat detail and avoids VSM's extra work in these captures. Keep `?shadows=1&shadowFilter=vsm` as a separate preview of its softer doorway line, not as the chosen filter. At the matched 632 doorway, VSM costs 99 draws / 4,479 submitted triangles / 5 renderer calls versus PCF's 90 / 4,393 / 3. These software-rendered samples do not measure GPU or frame time, real-device performance, or student legibility.
- The next visual issue is the dominant angular sunlit floor area in the 680 doorway. Investigate its balance against the distinct, nearly white curved oval trace at a matched camera pose before changing production lighting or the trace material.

## Opt-in floor-mark opacity preview · 2026-10-14

- The [doorway and travel-corner opacity probes](phase0/GEOMETRY_BASELINE.md#680-doorway-floor-mark-opacity-probe--2026-10-14) show that `0.30` exposes more floor texture than baseline `0.45`, while the 680 mark stays visible and keeps its hard oval edge. Offer the lower-opacity candidate through the exact `floorMarkOpacity=0.30` URL option for direct comparison; other values retain `0.45`.
- Keep baseline opacity for regular visits until viewer feedback establishes whether the mark reads as a cleaned area. The URL option makes the candidate available for review without resolving its shape or the separate broad doorway light patch.

## Opt-in soft-edge floor-mark preview · 2026-10-15

- The [matched soft-edge probe](phase0/GEOMETRY_BASELINE.md#680-soft-edge-floor-mark-probe--2026-10-15) fades the outside 20% of the `0.30` mark into the floor at the 680 doorway and travel corner. Its center and surrounding surfaces remain effectively unchanged, but the mark is still a broad pale oval. Offer this treatment through the exact `floorMarkOpacity=0.30&floorMarkEdge=soft` URL combination for direct comparison. `floorMarkEdge=soft` alone leaves the baseline `0.45` mark unchanged; the existing `floorMarkOpacity=0.30` URL keeps its hard edge.
- Keep both alternatives diagnostic-only. The images do not establish whether visitors understand either one as a cleaned area, and neither addresses the separate angular doorway light patch. Normal visits retain opacity `0.45` and shadows off.

## Normal-lighting three-date review readiness

- Matched shadow-free images now cover the [doorway](phase0/GEOMETRY_BASELINE.md#matched-shadow-free-three-date-doorway), [travel corner](phase0/GEOMETRY_BASELINE.md#matched-shadow-free-three-date-travel-corner--2026-10-15), [pegs wall](phase0/GEOMETRY_BASELINE.md#completed-shadow-free-three-date-pegs-wall), and a [turned yard view](phase0/GEOMETRY_BASELINE.md#matched-shadow-free-yard-palm) across 632, 661, and 680. The pegs wall is bare in 632, gains a waterskin and pegs in 661, then shows an empty hook and unchanged smaller pegs in 680. The 632 and 661 yard images match byte for byte; the 680 palm changes, though the close frame crops the crown top. These screenshots establish what the prototype draws at matched poses, not what a visitor understands.
- The [current textured-prototype packet](phase0/TEXTURED_REVIEW_PACKET.md) presents the normal-lighting images without naming intended cues before first impressions. Keep normal visits at shadow-free baseline floor-mark opacity `0.45`; the hard and soft `0.30` URLs remain review options. The next decision about the floor mark and dated cues needs participant responses, with the separate [floor-mark variant sheet](phase0/680_FLOOR_MARK_REVIEW_SHEET.md) used for that focused comparison. No participant responses or real screen-reader observations have been supplied.

## Reporting exit source selection · 2026-10-14 (America/Chicago)

- The [source review](phase0/REPORTING_EXIT_SOURCES.md) checks two dated, readable publisher reports: a 17 September 2026 *Guardian* report with displaced Yemenis' accounts near Taiz, and a 29 September 2026 *Associated Press* interview with the UN envoy on talks with Houthi negotiators and the internationally recognized government. Their different speakers support the planned question about what a report includes and leaves out. Figures and front-line descriptions belong to their publication dates; the exit must show those dates and recheck the links before release.
- Bruce Riedel's 2021 Brookings primer supports the Zaydi/Twelver distinction and places Zayd ibn Ali's uprising in 740, after the room's last date. A 2018 Minority Rights Group profile explicitly distinguishes Zaydi Muslims from the Houthi movement. Treat the older room history as context for questions, not a direct explanation of the present war. Keep the reports and context note on a plain page outside the 3D room.
- This commits research and source boundaries only. The exit page, its final wording, and instructor/community review remain open; no contemporary claim or news image was added to the prototype.

## Separate plain reporting exit · 2026-10-14 (America/Chicago)

- Build `exit.html` as a separate static Vite page. Native links from the room and reading page work without JavaScript; leaving the room unloads its canvas through the existing `pagehide` cleanup. The exit has no room script, canvas, modern 3D object, news image, answer box, or scoring.
- `content/reporting.json` holds the two report citations, publication dates, concise descriptions, the Zaydi/Twelver note and its two context citations, the plan's exact invitation, and optional reading lenses. Build validation requires two unique dated HTTPS reports and two source-linked context claims. Keep the stories' changing counts inside their dated linked articles; the exit does not restate them as current facts.
- The checked publisher links and [source limits](phase0/REPORTING_EXIT_SOURCES.md) support this preview wording. Its historical bridge is a question, not a direct Karbala-to-Yemen causal claim. Final instructor/community review and real participant and screen-reader passes remain open.

## Phase 3 source and credit audit · 2026-10-15 (America/Chicago)

- The [source audit](phase3/SOURCE_CREDIT_AUDIT.md) found that the 680 passage's family-casualty detail needed a second citation. Parkinson supports Husayn's death and the small band, while Madelung identifies relatives killed at Karbala. Keep the planned passage wording and add the existing Madelung record as an additional passage source. The room's invented traces retain their separate disclaimers.
- Record Parkinson's book title as a container title and Affordable Learning Georgia as its publisher. Keep the textbook's CC BY-SA 4.0 link in the reading-page credits, identify the British Museum coin as a catalog-only reference, and make the alternate Poly Haven sky's CC0 attribution explicit. No collection photograph is used.
- Add the offline `npm run check:content` gate for built citations, credits, report dates, and the current no-photo treatment. Recheck the four reporting sources and update their check date to 15 October 2026. Human historical, community, participant, device, and screen-reader reviews remain separate open work.

## Explicit Low rendering preview · 2026-10-15 (America/Chicago)

- Offer the first Phase 4 option through exact `?tier=low`, capped at DPR 1. Regular visits and unrecognized values retain the 1.5 cap. Keep tier choice manual until real-device measurements support automatic selection; diagnostic shadows remain a separate opt-in URL flag.
- The [matched WebGL2 measurement and doorway captures](phase4/LOW_TIER_PREVIEW.md) show 419,904 Low drawing-buffer pixels versus 944,784 baseline pixels at an emulated DPR 2, or 44.4% as many. Draw calls, triangles, and renderer calls match at sampled 632 doorway and 680 yard poses. The Low image has slightly softer edges, with no missing geometry observed.
- At this earlier DPR-only checkpoint, both options loaded the same pinned 1k textures and sky, so it saved no asset bytes. GTAO, FXAA, and a bake were not present. Smaller texture variants were added in the next decision; automatic selection, antialiasing review, and real-device frame-time and readability checks remain Phase 4 work.

## Pinned 512-pixel Low textures · 2026-10-15 (America/Chicago)

- Keep the normal room on the six pinned 1k Poly Haven JPG maps. Exact `?tier=low` now selects six 512-pixel WebP derivatives of those same maps alongside its existing DPR 1 cap. Poly Haven's Files API offers no native 512-pixel maps for these assets, so the derivatives are generated from the verified 1k sources with Sharp 0.35.5. Use quality 90 WebP for diffuse color and lossless WebP for normal and ARM data. The recipe, source pins, output sizes, and SHA-256 hashes live in `assets.config.json`; `npm run generate:low-textures` reproduces and verifies them.
- The [matched asset and rendering check](phase4/LOW_512_TEXTURES.md) found 1,806,383 source bytes for the six normal maps and 941,300 for Low, saving 865,083 bytes (47.9%). Fresh local browser contexts requested exactly the intended six maps and the same 1k sky for each tier, with HTTP 200 and no page or request errors. Encoded texture-plus-sky response bodies fell from 2,390,880 to 1,525,797 bytes (36.2%). The sky's compressed response body is smaller than its 1,118,343-byte source file; do not mix those measures.
- At matched 632 doorway and 680 yard poses in software-rendered Chromium, baseline and Low retain the earlier 1296 × 729 versus 864 × 486 drawing buffers, with equal sampled draw, triangle, and renderer-call counts. DPR 1 screenshot pairs isolate the texture change: Low looks a little smoother, and no missing room materials, props, marks, or seams were observed. Both variants are included in the 5,966,614-byte built site, below the 15 MB budget; the 45,817-byte first view is unchanged.
- Keep the 1k sky in both tiers and leave automatic tier selection, antialiasing changes, and any smaller bake for later. There is no bake in this prototype. Software captures and response-body bytes do not establish real-device frame rate, memory use, or visitor readability.
