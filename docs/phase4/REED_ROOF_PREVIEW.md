# Opt-in reed roof underside · 2026-10-17

The plan names a reed roof material, while the prototype currently has a plain gray roof and beams. Exact `?roof=reed` adds Poly Haven's CC0 [`reed_roof_04`](https://polyhaven.com/a/reed_roof_04) to a downward-facing sheet on the **inside underside only**. The original roof box, outer surface, beams, lights, date objects, and antialiasing stay as they were. Ordinary and unrecognized `roof` URLs keep the plain underside and request no reed maps. The two public comparison links are [Normal reed](https://wangy113.github.io/after-632-gpt-sol-6/?roof=reed) and [Low reed](https://wangy113.github.io/after-632-gpt-sol-6/?tier=low&roof=reed); enter the room and look up.

The [asset manifest](../../assets.config.json) pins the 1024 × 1024 Diffuse, OpenGL normal, and ARM JPGs by Poly Haven Files API URL, byte count, and MD5. Low uses three reproducible 512 × 512 WebPs from the same sources using the existing Sharp 0.35.5 recipe, with sizes and SHA-256 hashes pinned. Source maps total **2,246,323 bytes**; Low derivatives total **1,258,390 bytes**, or 56.0% as many source-file bytes. `npm run fetch:assets`, `npm run generate:low-textures`, and `npm run check:assets` verify the committed files. The reading page credits the candidate and its CC0 license.

## Matched local views

Run `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run measure:reed-roof` to rebuild and refresh these twelve images. The script uses a 1440 × 900 viewport at DPR 1, reduced motion, and Chromium SwiftShader's WebGL2 fallback. It compares each plain/reed pair at the same date, place, camera pose, sky, 864 × 486 drawing buffer, and lighting. Six, five, and four upward look steps make the roof visible from the doorway, head, and pegs respectively. These camera choices are for material comparison; they are not a student comprehension test.

| Matched pose | Normal plain | Normal reed | Low plain | Low reed |
| --- | --- | --- | --- | --- |
| 632 doorway, up | [PNG](reed-roof-normal-plain-632-doorway-up.png) | [PNG](reed-roof-normal-reed-632-doorway-up.png) | [PNG](reed-roof-low-plain-632-doorway-up.png) | [PNG](reed-roof-low-reed-632-doorway-up.png) |
| 661 head, up | [PNG](reed-roof-normal-plain-661-head-up.png) | [PNG](reed-roof-normal-reed-661-head-up.png) | [PNG](reed-roof-low-plain-661-head-up.png) | [PNG](reed-roof-low-reed-661-head-up.png) |
| 680 pegs, up | [PNG](reed-roof-normal-plain-680-pegs-up.png) | [PNG](reed-roof-normal-reed-680-pegs-up.png) | [PNG](reed-roof-low-plain-680-pegs-up.png) | [PNG](reed-roof-low-reed-680-pegs-up.png) |

| Local visit | Poly Haven room assets | Encoded asset response bodies | Settled 632 doorway-up draws / triangles / render calls |
| --- | ---: | ---: | ---: |
| Normal plain | 7 | 2,390,880 bytes | 15 / 2,141 / 2 |
| Normal reed | 10 | 4,637,203 bytes | 16 / 2,143 / 2 |
| Low plain | 7 | 1,105,820 bytes | 15 / 2,141 / 2 |
| Low reed | 10 | 2,364,210 bytes | 16 / 2,143 / 2 |

The reed sheet adds one draw and two submitted triangles at each sampled pose; the settled renderer-call count stays at two. Its three additional encoded map bodies add **2,246,323 bytes** to this fresh local Normal visit or **1,258,390 bytes** to Low. The script found HTTP 200 for every expected asset and no page or request errors. The built first view is **47,954 / 300,000 bytes** and the full built site is **10,124,055 / 15,000,000 bytes**. Built-site size includes both opt-in roof variants even when an ordinary visitor never requests them. These measurements do not establish device frame rate or GPU memory use.

Across the matched plain/reed images, 44.64% of pixels change at the 632 doorway-up view, 35.96% at the 661 head-up view, and 18.17% at the 680 pegs-up view in both tiers. These fractions describe the size of the changed image area, not material quality. The reed texture makes the formerly flat ceiling visibly coarse and dark, while the beams remain flat gray. A darker horizontal row in the source texture repeats across the ceiling at this 1.6 m tiling, especially from the head position. Low looks slightly softer at these DPR 1 captures, with the same visible structure. The date-specific props and wall/floor maps stay in their prior positions.

## Decision and limits

Keep the plain roof on ordinary visits. The reed candidate is useful for comparing material direction, but the repeated dark rows, gray beams, provisional lighting, additional transfers, and absent physical-device measurements need review before adoption. A participant or instructor should first describe what the ceiling suggests without prompting, then compare it against the plan's intended imagined room. The [optional real-device add-on](REAL_DEVICE_TIER_TEST.md#optional-reed-roof-material-add-on) records a paired test path and leaves results blank. The texture is a stock visual candidate, **not evidence of a seventh-century roof**. The local WebGL2 captures do not verify WebGPU behavior, phone clarity, or screen-reader speech.
