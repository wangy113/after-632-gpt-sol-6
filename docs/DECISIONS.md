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

- The 632 and 661 groups are built once inside the same room and toggled by the two date buttons. Switching is immediate and keeps the camera fixed. The 680 scene and Compare controls remain later work.
- All four 661 object groups match the sourced labels. The plain coin disc carries no museum image or invented ancient writing. The letter is unmarked, and the seat has no ornament or personal association.
- The 661 labels also appear under the static passage when JavaScript is off. The room date buttons expose their pressed state, and the current passage link follows the selected date.
- The [Chromium WebGL2 gray-box capture](phase0/661-graybox.png) records the 661 doorway composition. The screenshot and automated browser checks do not replace instructor or community review of the symbols.

## 632/661 Compare · 2026-10-13

- Compare in the 661 room shows the earlier 632 change set immediately from the same camera. It does not change the selected date or rebuild the room. The 661 date button remains selected while the visible notes, lens, and view description follow the 632 scene; releasing Compare restores the 661 view and notes.
- A hold button supports mouse, touch, and keyboard press-and-hold. Holding C while the room is active is an alternate shortcut. A separate native toggle button supports persistent comparison and exposes its pressed state. The hold ends on release or cancellation, and leaving the room clears Compare.
- Compare is unavailable in 632 because it has no preceding scene. The 680 passage remains in the reading page; a 680 room view awaits its own change set.
