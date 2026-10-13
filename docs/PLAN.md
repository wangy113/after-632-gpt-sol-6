# After 632: plan for a photoreal meeting room in three dates

## Context

The current build is an editorial web page with a pre-rendered courtyard panorama. Its dates differ mainly by sunlight. It does not deliver the core experience, and it is being retired.

The new goal: students explore one photoreal place at three dates and **identify what each date is about** from what is **absent, missing, and added** in the space. There are no people and no symbolic sun. The three dates are:

1. **632 CE, succession.** After Muhammad's death, Abu Bakr became the first caliph. Supporters of Ali understood rightful leadership differently. A short, careful passage, never a reenacted argument.
2. **661 CE, political struggle.** Ali's death and the rise of Umayyad rule show the disagreement becoming a contest over political authority. The space remains recognizably the same.
3. **680 CE, Karbala and remembrance.** Husayn's death at Karbala becomes central to Shi'a memory of injustice and legitimate leadership. Restraint and text, never a battle.

The plan follows the Quake Street earthquake lab (`wangy113/earthquake-lab-opus-5.5`): the same plan format, three.js r186 with WebGPU and a WebGL2 fallback, and Poly Haven CC0 assets fetched from a pinned config.

**Decisions confirmed in the brainstorm:**
- **Setting:** an imagined meeting room that opens onto a small yard, in an Arabian oasis town. It is an interpretive setting, not a reconstruction of any documented place.
- **No people:** no figures, voices, or crowds. Students read what people leave behind.
- **Light carries no meaning:** one sky, one sun, the same hour at every date. Only the traces change.
- **One lead lens per date:** 632 asks what is absent, 661 what is added, and 680 what is missing. "What stays" runs through all three. At the exit, students apply all the lenses to two news reports.
- **Real objects, clearly labeled:** museum records support object labels. Photographs enter the room only after their date and rights are verified; the current 661 coin is an interpretive replica.
- **Fresh build:** the current app is retired. Only the verified source and news records and the historical guardrails carry over.

## Is it possible? Yes

Checked against the live Poly Haven API and the three 0.186.1 package on 2026-10-13.

- **Walls, floor and roof (textures, 1k):**
  - Walls: `clay_plaster`, `patterned_clay_wall`, `clay_block_wall`
  - Floor: `clay_floor_001`
  - Yard ground: `dry_ground_01`, `mud_cracked_dry_03`, `sand_01`
  - Roof underside: `reed_roof_04`, `riet_01`
  - Trunk beams and palms: `palm_bark`, `palm_tree_bark`
  - Seat, pegs and door: `rough_wood`, `raw_plank_wall`
  - Mats and bags: `hessian_230`
- **Sky:** 59 pure-sky HDRIs. The Qwantani series covers dawn to night from one site. Phase 0 picks one clear morning sky; candidates are `qwantani_mid_morning_puresky`, `qwantani_morning_puresky` and `syferfontein_18d_clear_puresky`.
- **Props (models):** `wicker_basket_02` (about 18k polygons), `wooden_bucket_01` and `wooden_bucket_02` (5k to 7k), and `ceramic_pot` (3.6k, glazed, so it is re-tinted matte). Rocks are heavy, so they are simplified on load as in Quake Street.
- **Gaps to design around:**
  - **People:** there are none on Poly Haven, which suits the brief.
  - **Palms:** none exist. The trees on offer are other species, mostly 0.3M to 17M polygons. Palms are generated in code instead, porting the leaflet and rachis math from the old `scripts/render-courtyard.py` `palm()`.
  - **Small objects:** there are no mats, cushions, letters, clay seals or coins. These are simple models: mats as sagging planes with hessian or reed textures, cups and jars from `LatheGeometry`, and the interpretive coin replica as a modeled disc.
  - **Traces:** dust rings, wear paths, footprints and pale outlines are decals. Their alpha textures are authored or generated.
- **three r186 has what this needs:**
  - `WebGPURenderer` with TSL and the automatic WebGL2 fallback.
  - `RenderPipeline` with `GTAONode` and `TRAANode`.
  - `LightProbeGrid`, an irradiance volume baked on the GPU, with versions for `WebGPURenderer` and `WebGLRenderer`. It gives indoor bounce light without Blender. Phase 0 confirms it on the WebGL2 fallback.
  - `HDRLoader` (half float), `KTX2Loader`, `GLTFLoader` and `UltraHDRLoader`.
- **Sizes:** a 1k PBR set (diffuse, nor_gl and arm maps) is 1.0 to 2.8 MB as JPG. A 1k HDRI is about 1 MB, a 2k HDRI about 4 MB. The whole visit budget is 15 MB.
- **API terms:** name the app in the User-Agent. Assets are CC0, and Poly Haven is credited on the page.

## The experience

A plain meeting room opens through a wide doorway onto a small yard with a palm and a well. Morning sun falls through the doorway onto the floor. It is the same at every date.

1. **Arrival.** A still of the room loads first, before any 3D. It shows the title, the opening question ("When a community loses the person who united it, what gives someone else the authority to lead?") and the line "An imagined room. No one appears here. Look for what people leave behind." There are two buttons: **Enter** and **Read without 3D**.
2. **632, Absent.** The student stands in the doorway. Mats lie in a loose, unfinished circle and the place at the head of the room is empty. Cups sit untouched. Footprints lead out the door. A lens chip reads "Look for what is absent." The 60-word passage is one tap away.
3. **661, Added.** A short dissolve shows "29 years later" from the same spot. The circle is gone and the mats face one plain seat. A low table holds a sealed letter and **a labeled interpretive coin replica**. The pegs by the door are empty, each leaving a pale outline. The student can hold **Compare** to see 632 from the exact same spot.
4. **680, Missing.** "19 years later." The seat is still there. By the door, the travel bags and waterskin are gone, leaving a clean patch on the dusty floor and an empty hook. Nothing is added. The palm in the yard is taller.
5. **Into the present.** The student leaves the room for a plain page with two dated Yemen reports, the Zaydi and Twelver context note, and the invitation: "What does this older history help you notice, and what would you still need to learn about this conflict?" An optional line offers the lenses for reading the reports: who is absent from a report, what is missing from its history, what it adds. Nothing about Yemen is shown in 3D.
6. **Always available:**
   - any date in any order
   - four places to stand
   - Compare
   - "Things here" labels and "Describe this view"
   - Read without 3D, Sources, Pause and Skip movement

There are no points, checklists, text boxes or graded answers.

| Date | Lead lens | Students should be able to say | Changes in the room (about 3 per date) |
|---|---|---|---|
| 632 | Absent | The community had to decide who leads and on what grounds. Leading members chose Abu Bakr. Ali's supporters believed leadership belonged with Muhammad's family. | The head of the room is empty. The circle of mats is unresolved. Footprints lead out the door. |
| 661 | Added | The disagreement became a contest for political power. Ali was killed, and Mu'awiya founded Umayyad rule from Damascus. | Mats face one plain seat. A sealed letter and an interpretive coin replica sit on the table. Empty pegs leave pale outlines. |
| 680 | Missing | Husayn refused the new ruler and was killed at Karbala. His death became central to Shi'a memory of injustice and legitimate leadership. | The seat remains. The travel things are gone, leaving a clean patch and an empty hook. Nothing is added. |
| All | Stays | Sunni and Shi'a Muslims share central beliefs and practices. These dates show where a disagreement began. | The walls, beams, well and jar stay the same. The palm grows taller. |

**Every changed object has a two-part label.** The first part, *In this room*, describes what is invented. The second, *In the record*, gives the sourced fact and its link. Examples:
- **632, footprints:** leading Muslims met elsewhere in Medina and chose Abu Bakr while Muhammad's family, including Ali, prepared his burial. Needs a source beyond the textbook.
- **661, coin:** the British Museum catalogs an Arab-Sasanian silver coin minted in 660 at Nihavand (1922,0424.3865). Its record is linked; the scene coin is a labeled interpretive replica, and no museum image is copied.
- **661, letter:** Mu'awiya ruled from Damascus. Early Arabic sources credit his reign with a chancellery and postal service, without dating their creation to 661. The sealed message is invented.
- **661, pegs:** the civil war of 656 to 661, including the battles of the Camel and Siffin (textbook §8.8).
- **680, travel things:** in 680 Husayn left Medina rather than pledge allegiance to Yazid.

**Draft passages.** All are 60 words or fewer and need instructor review. They draw on Parkinson ch. 8, §§8.8 and 8.9.
- **632 (55 words):** "Muhammad died in 632. Leading members of the community chose his companion Abu Bakr as caliph, or leader. For them, the community could select its leader. Supporters of Ali, Muhammad's cousin and son-in-law, believed leadership belonged with the Prophet's family, and some held that Muhammad had named Ali. Each view answered: what makes authority rightful?"
- **661 (58 words):** "Ali became caliph in 656, but his rule was contested and civil war followed. In 661 a Khariji, from a group that had broken with Ali, killed him. Mu'awiya, Syria's governor, became caliph and ruled from Damascus. His Umayyad family kept power and ended selection by consensus. The disagreement over leadership had become a contest for political power."
- **680 (59 words):** "In 680 Mu'awiya's son Yazid became caliph. Husayn, Ali's son and Muhammad's grandson, refused to accept him. At Karbala, in Iraq, Yazid's forces killed Husayn and a small group of his family and followers. Shi'a Muslims came to remember his death as a turning point: a stand for rightful leadership against injustice. They commemorate it each year on Ashura."

**Guardrails for the room:**
- No depiction of Muhammad, Ali, Husayn, worshippers or fighters.
- No pulpit, throne or personal relic (cloak, sandals, staff, sword, seal ring).
- No writing materials in 632. They point to a contested deathbed account.
- No banners, and no green, black or red cloth.
- No weapons on display, no damage and no blood.
- No dividing wall, forked path or crack across the room.
- No staged mourning gathering in 680.
- 680 must not mirror 632's layout. That echo would imply one line of injustice from 632, which is one tradition's reading.
- No modern objects in the room.
- The "imagined room" label is always visible.

## Architecture

### Stack (exact versions pinned in package-lock)
- **three 0.186.1**, the same as Quake Street:
  - `three/webgpu` with TSL.
  - Quake Street's WebGPU probe, falling back to WebGL2.
  - `RenderPipeline` with GTAO and TRAA, and AgX tone mapping.
  - `LightProbeGrid` for bounce light.
- **Tooling:** Vite and TypeScript, pinned in Phase 0 (Quake Street uses Vite 7.1.12). Vitest and Playwright with Chromium from `/opt/pw-browsers`, plus axe-core.
- **meshoptimizer 0.25.0:** simplifies Poly Haven models on load, as in Quake Street.
- **sharp:** converts textures to WebP at build time. KTX2 through `toktx` is used if Phase 0 shows it is worth it.
- **Not needed:** no physics engine, no UI framework, no backend.

### Five layers

```
build time:  content JSON -> validated -> static reading page + app data
per frame:   input -> state -> camera -> change set -> render (only while something moves)
```

1. **Content (`content/`, build time).**
   - Passages, change sets, two-part labels, "Describe this view" text, sources, news, and real-object records all live in JSON.
   - The JSON is validated: 60-word passages, every change labeled and sourced, one lead lens per date, dated links for museum references, and a license for every displayed collection photograph.
   - The same JSON renders the static reading page used without JavaScript. No historical text lives in TypeScript.
2. **State (`src/state/`, pure TS).**
   - Holds the date, place to stand, Compare held, inspected object, mode (3D or reading), motion policy (system reduced motion or user pause), and quality tier.
   - It is a small reducer.
   - **Rule:** `state/` never imports three or the DOM, so it is tested in Node. This is Quake Street's `sim/` rule.
3. **World (`src/world/`).**
   - The room and yard are built once.
   - Each changeable object has an id and a per-date state: present, absent, or present with a trace decal.
   - A date change toggles visibility and decals. Nothing is rebuilt.
   - The palm has an age parameter.
4. **Render (`src/render/`).**
   - **Renderer:** the renderer probe.
   - **Sky:** one sky, with its sun measured at build time.
   - **Bounce light:** one `LightProbeGrid` bake at load. The changes between dates are small objects, so one bake serves all dates. Phase 0 confirms this.
   - **Post:** GTAO and TRAA.
   - **Quality tiers:** High, Balanced and Low.
   - **Scheduler:** renders on demand. It draws frames while the camera moves, during a dissolve, and for the TRAA settle frames. After that it draws nothing.
5. **UI and debug (`src/ui/`, `src/debug/`).**
   - DOM overlays enhance the static page: date rail, places to stand, Compare, labels, describe view, teacher view and exit.
   - `window.__room` hooks for tests, as with Quake Street's `__lab`.

### The room and yard
- **Sizes:** the room is about 8 by 5 m inside, under a 3 m ceiling of palm-trunk beams with a reed underside. The yard is about 8 by 6 m behind a low wall. These are composition choices, not claims.
- **Geometry:** walls are boxes with world-unit UVs (Quake Street's `boxGeometry`), with uneven tops and soft bevels. Beams are tapered cylinders. Static parts are merged by material (`mergeStatic`).
- **Light:**
  - **Sky:** one pure-sky HDRI, with a fixed rotation chosen so a patch of sun falls through the doorway onto the floor.
  - **Sun:** measured once by Quake Street's `analyzeSky`, ported to a Node script. It writes direction, color, intensity and horizon color, and a clamped environment map so the sun is not counted twice.
  - **Bounce light:** `LightProbeGrid` with probes about 0.75 m apart indoors and one bounce on High and Balanced.
- **Four places to stand:**
  - the doorway (the default)
  - the head of the room
  - by the door pegs and hooks
  - the yard, looking back at the room

  Each has bounded look angles. Moving between them is a 0.8 s glide, or a cut under reduced motion.
- **Compare:** while held, it swaps in the previous date's change set at the same camera, with no transition. It works with mouse, touch and keyboard (hold C, or a toggle button).
- **Date change:** a 0.8 s screen-space cross-dissolve between the two states at the same viewpoint, with a caption such as "29 years later." It is instant under reduced motion or Pause.

### Real objects
- **The 661 coin:**
  - The British Museum catalogs an Arab-Sasanian silver coin from 660 CE (1922,0424.3865). This is a historical reference, not a claim that the coin was in the room.
  - No CC0 obverse and reverse pair has been verified for a coin securely dated by 661. The room coin is therefore a clearly labeled interpretive replica, without a collection photograph.
  - A photographed museum coin can replace the replica only after its mint date, accession and both image rights are checked.
- **Optional second object:** a photograph, in the 680 label, of Mu'awiya's dam inscription at Ta'if (677 to 678), which names him commander of the faithful. To verify.
- **Inspection:** any photographed real object opens in a close-up viewer showing its museum, accession number, date, image license and link. The coin replica instead links to its separate museum reference.

### Repository layout

```
index.html                 template; static content injected at build
content/                   experience.json, changes.json, objects.json, sources.json, news.json
assets.config.json         pinned Poly Haven ids, resolutions and roles
scripts/                   fetch-polyhaven.mjs, bake-sky.mjs, optimize-textures.mjs, shot.mjs,
                           check-content.ts, check-assets.mjs
src/main.ts
src/state/                 store.ts, dates.ts, motion.ts            (no three, no DOM)
src/world/                 room.ts, yard.ts, palm.ts, props.ts, traces.ts, changes.ts,
                           assets.ts, geometry.ts
src/render/                renderer.ts, sky.ts, gi.ts, pipeline.ts, tiers.ts, scheduler.ts
src/ui/                    overlay.ts, dates.ts, places.ts, compare.ts, labels.ts, describe.ts, exit.ts
src/debug/                 hooks.ts (window.__room, URL flags)
public/assets/             polyhaven/ (optimized, committed), objects/, stills/
tests/unit/ (Vitest)       tests/e2e/ (Playwright)
docs/                      PLAN.md, DECISIONS.md, phase0/ ... screenshots
```

URL flags, following Quake Street: `?date=661`, `?place=yard`, `?tier=low`, `?gl=1`, `?post=0`, `?gi=0`, `?teach=1`.

### What carries over

| From | Code | New home | Change |
|---|---|---|---|
| Quake Street | `src/render/renderer.ts` `createRenderer`, `webgpuUsable` | `src/render/renderer.ts` | none |
| Quake Street | `src/render/lighting.ts` `loadHdri` (half float) | `src/render/sky.ts` | none |
| Quake Street | `src/render/sky.ts` `analyzeSky`, `skyRotation` | `scripts/bake-sky.mjs` | runs once at build time, writes `sky.json` |
| Quake Street | `src/world/assets.ts` `pbrMaterial`, `loadModel`, `loadManifest` | `src/world/assets.ts` | none |
| Quake Street | `src/world/geometry.ts` `boxGeometry`, `mergeStatic`, `simplifyModel`, `fitModel` | `src/world/geometry.ts` | none |
| Quake Street | `scripts/fetch-polyhaven.mjs` | `scripts/fetch-polyhaven.mjs` | adds size budgets |
| Quake Street | `scripts/shot.mjs` | `scripts/shot.mjs` | renders the reading-page stills |
| Quake Street | `src/main.ts` GTAO and TRAA pipeline block | `src/render/pipeline.ts` | adds tiers |
| Quake Street | `src/debug/lab.ts`, Playwright SwiftShader flags | `src/debug/hooks.ts`, `playwright.config.ts` | none |
| After 632 | `content/sources.json`, `content/news.json` | `content/` | re-verify every link and date |
| After 632 | `escapeHtml` and the build-time validation idea in `scripts/content.ts` | `scripts/check-content.ts` | new schema |
| After 632 | `.github/workflows/pages.yml`, `checks.yml` | same | adds asset checks |
| After 632 | `palm()` leaflet math in `scripts/render-courtyard.py` | `src/world/palm.ts` | ported to TS |

Everything else in the current repo is dropped: the editorial layout and styles, the panorama viewer, the Blender renders, and the sun crossfades. The old build stays in git history. The live site keeps showing it until this branch merges.

## Phases

Each phase ends with something runnable and a check. Demo checkpoints come at the end of Phases 0, 1 and 2.

**Phase 0. Gray box, pedagogy test and spikes**
- Scaffold the project: Vite, TypeScript, three r186, Vitest and Playwright. Port the Quake Street helpers. Add `assets.config.json` and the fetch script.
- Build a gray-box room and yard: plain shapes, all three change sets, the four places to stand, Compare, and the draft passages. No textures.
- **Pedagogy before pixels:** show the gray box to 3 to 5 students or colleagues and ask "What changed? What might it mean?" Record whether each date's lead change is noticed and how it is read.
- Spikes:
  - Sky pick, as A/B screenshots.
  - `LightProbeGrid` bake time in SwiftShader, on the demo laptop and on a Chromebook.
  - Whether one bake serves all dates.
  - WebP against KTX2.
  - WebGPU and WebGL2 on Safari, iPad and Chromebook.
  - Coin sourcing.
- Check: `docs/DECISIONS.md` records the results and screenshots, and the gray-box test notes.

**Phase 1. Vertical slice: photoreal room at 632 (first demo)**
- Full materials, light, bounce light, GTAO and TRAA. The 632 change set, two places to stand, the 632 passage and labels.
- The reading page with an engine-rendered still. The WebGL-unavailable fallback. The `__room` hooks.
- Check: the brief's first milestone, one complete space and one historically checked date. Measure clarity and performance on real devices before adding dates.

**Phase 2. Three dates and comparing**
- The 661 and 680 change sets, trace decals, the interpretive coin replica and its sourced label.
- Compare and the dissolve. The palm's age. "Describe this view" and every two-part label.
- Check:
  - Dates work in any order, and Compare is instant.
  - Reduced motion makes everything instant.
  - Students name each date's lead change in a short photoreal test.

**Phase 3. The present and the sources**
- The exit page: two re-verified reports, the Zaydi and Twelver note with the Brookings source, the lenses for reading reports, and the invitation.
- The source shelf and credits (Poly Haven, museum, textbook under CC BY-SA 4.0).
- Check: release content checks pass: two verified reports, every label sourced, and every displayed collection photograph licensed.

**Phase 4. Accessibility, tiers and performance**
- Keyboard and screen reader passes, reduced motion, focus handling on fallback and context loss.
- Tiers chosen automatically, with `?tier=`. The Low tier uses DPR 1, no GTAO, FXAA, 512 textures and a smaller bake.
- Optional reviewed narration with captions.
- Check: the acceptance matrix on the demo laptop, a Chromebook and a phone. Budgets are met.

**Phase 5. Review and pilot**
- Instructor or historian review of the passages and labels.
- A symbol review with the instructor and, ideally, Sunni and Shi'a readers.
- A student pilot: do students identify the three differences, and does the visit take about six minutes?
- Check: findings are fixed or recorded in `DECISIONS.md`.

**Phase 6. Production**
- Commit the optimized assets with their license records. Regenerate the stills with `npm run stills`.
- Deploy through the existing Pages workflow. Update README and `HANDOFF.md`.
- Check: a clean checkout builds. The live URL passes a smoke test: assets, fallback, keyboard, every date, and the outgoing reports.

## Budgets
- **First view:** 300 KB or less (HTML, CSS and the arrival still WebP), readable before any 3D loads.
- **Whole visit:** 15 MB or less, including code, textures and the sky. Licensed collection images, if added, load on demand.
- **Frame rate:** 60 fps on the demo laptop (Balanced) and 30 fps on a Chromebook or phone (Low). No frames are drawn once the view settles.
- **Draw calls and triangles:** under about 150 draw calls and 800k triangles per frame on Balanced, counting the shadow pass.

## Verification
- **`npm test`** (Vitest, Node):
  - Content: passages of 60 words or fewer, every change has both label parts and a source, one lead lens per date, museum references carry a dated link, and displayed collection photographs carry a license.
  - State: dates in any order, Compare returns to the current date, reduced motion is instant, the newest date always wins.
  - World: each object's visibility per date, and trace decals appear only where something is missing.
  - The palm generator is deterministic and within its triangle budget.
  - `bake-sky.mjs` finds the sun in a synthetic HDR.
- **`npm run e2e`** (Playwright, SwiftShader, through `window.__room`):
  - The reading page is complete with JavaScript off.
  - Each date and place opens instantly, with screenshots saved to `test-results/`.
  - Compare toggles the change set.
  - The coin label links to the museum record used as its historical reference.
  - Missing WebGL and a lost context both fall back to the reading page and keep focus.
  - axe scans pass at 1440, 390 and 320 px, with no console errors.
- **Asset checks:** `npm run check:content` and `npm run check:assets` (size budgets, CC0 and license records).
- **Manual:** runs on the demo laptop, a Chromebook and a phone, a screen reader pass, and the Phase 0 and Phase 5 student tests.

## Open items
- **Sources beyond the textbook,** before students see these claims:
  - Ali's absence from the 632 choice
  - Husayn's refusal in Medina in 680
  - Sunni honor for Husayn, for the 680 note
- **Coin availability:** securely dated examples exist by 661, but CC0 photographs of both sides have not been verified. The current gray-box scene uses a replica.
- **Instructor and community review** of the symbols and passages.

