# Real-device Normal and Low test sheet

The [plan](../PLAN.md#budgets) calls for 60 fps on the demo laptop at its planned Balanced tier and 30 fps on a Chromebook or phone at Low, with no frames drawn after the view settles. The current visible choices are **Normal** and **Low**; Normal is not yet the planned Balanced pipeline. No physical-device results have been collected. Use this sheet to record them before considering automatic tier selection.

## Set up each device

Test the actual demo laptop, Chromebook, and phone at their usual display resolution. Record model, OS/browser versions, display refresh rate if known, power/battery mode, device pixel ratio, viewport, network, and whether the browser reports WebGPU or WebGL2 fallback. Do not use device emulation or `?gl=1` for the primary runs. Keep the tab visible and other heavy tasks closed. Use the same orientation, zoom, lighting, and power settings when comparing the two tiers on one device. Note thermal throttling or an unusually warm device.

| Device | Ordinary Normal URL | Ordinary Low URL |
| --- | --- | --- |
| Demo laptop | `https://wangy113.github.io/after-632-gpt-sol-6/` | `https://wangy113.github.io/after-632-gpt-sol-6/?tier=low` |
| Chromebook | Same Normal URL | Same Low URL |
| Phone | Same Normal URL | Same Low URL |

Use these ordinary URLs for cold transfers and displayed-frame traces. Add both `metrics=1` and `probe=1` only for the separate on-page recorder runs below. A canvas `data-tier` of `baseline` means the visible Normal choice. Keep **Pause motion** off and system reduced motion off for the animation timing runs. If a tester needs reduced motion, honor that setting, test the instant transitions separately, and mark animation timing unavailable. A phone can use Chrome's remote device inspector from a desktop for Android, or Safari's Develop inspector from a Mac for iPhone; keep the phone's tab in front while collecting timing. Record the inspector/profiler used, since an attached inspector may affect timing.

## Measure transfer separately

For each device and tier, make one cold-cache Network-panel run on the **ordinary URL above, without `metrics` or `probe`**. Enable **Preserve log** across navigation. Clear the site's cache or use the panel's disabled-cache setting, clear its log, then navigate to the URL. Before entering the room, record both the **HTML + CSS + arrival still** transfer subtotal (the plan's 300 KB first-view scope) and the **all-request first-view** total. Separately record navigation start to the arrival still's response end and, if a browser screenshot/paint timeline exposes it, navigation start to the still becoming visible. A completed image response is not proof that the image was painted; mark visibility timing unverified if the tool cannot show it.

Enter the 632 doorway, visit 661 and 680, use the places and Compare, then follow **Into the present** to `exit.html` before recording **whole-visit transferred bytes** and failed requests. Keep the Network log through that navigation. Count same-origin HTML, CSS, script, still, maps, sky, and exit page in the plan's 15 MB visit scope. Note whether the panel counts headers and whether any request was served from cache. The budgets concern encoded content; panel “Transferred” totals may also count headers, so retain encoded-body totals if the panel provides them. Do not compare a cached zero-byte transfer to a cold visit.

The on-page recorder below also records Resource Timing entries made *after it starts*. Those entries help identify the seven requested room assets, but exclude the arrival load and may report zero transfer for cached resources. Use the cold-cache Network log for the visit budget.

## Measure animation on a warmed visit

Run each tier three times on each device (six device/tier cells, eighteen runs). Warm the site's cache once before these runs, then reload the **recorder URL** for every run: Normal `https://wangy113.github.io/after-632-gpt-sol-6/?metrics=1&probe=1` or Low `https://wangy113.github.io/after-632-gpt-sol-6/?metrics=1&probe=1&tier=low`. Alternate tier order when practical and note the order. Keep the viewport and power setting steady. These steps use physical taps/clicks; the recorder only observes them.

1. Open the recorder URL on the reading page **before** selecting **Enter the room**. Wait for the **Tier recorder ready** notice beside the entry controls so room-open timing is captured. The opt-in room panel will offer **Sample idle second**, **Copy JSON**, and **Download JSON**; no Console paste is needed. Do not begin on an already open room when measuring room-open time.
2. Select **Enter the room**. Wait for the 632 doorway to settle. Select **661 CE**, wait for the dissolve, then select **Head of room**, wait for the glide. Leave **Pause motion** off. A transition with only one recorded frame is an invalid animation sample; check reduced motion, tab visibility, and whether the transition actually ran.
3. While the room is visible and settled, select **Sample idle second** and leave the tab untouched for its one-second sample. Then use **Download JSON** to save the complete report, or **Copy JSON** to place it in the session notes. Keep its warnings with the data. The report includes click-to-first-frame and click-to-settled times, completed app-frame interval median/p95/max and counts over 16.7/33.3 ms, backend, CSS and drawing-buffer sizes, and the asset request list. Save the raw JSON for each run.
4. For visual comparison, inspect the **Pegs / hooks** place at 661 and 680, and the **Yard looking back** at 680 on both tiers. First write what you can distinguish without prompting; then check whether the 661 waterskin, 680 empty hook and pale wall trace, 680 floor mark, and yard palm remain legible. Note softness, jagged edges, missing detail, or a cropped cue. Use the same orientation and place on both tiers. See the [textured prototype packet](../phase0/TEXTURED_REVIEW_PACKET.md) for matched reference views; those images are not physical-device results.

The recorder times **completed JavaScript room render callbacks**, not GPU duration or frames actually presented by the display. The date change also prepares two offscreen targets synchronously before its 0.8-second dissolve; click-to-first-frame captures that wait, while frame intervals and renderer counters omit those two offscreen renders. The idle delta shows whether the app scheduled more renders over one quiet second; it cannot establish GPU sleep.

For any claim about the 60/30 fps targets, make **three separate warmed browser Performance/Frames captures** on each device and tier using the **ordinary URL without `metrics` or `probe`**. Trace the active 661 dissolve and Head of room glide separately, excluding time spent reading or idle. Record the tool and exact track or overlay, active-transition frame times or rate, dropped frames, and whether it reports compositor frames or actual display presentation. A browser frame track may not prove which frames reached the physical panel; state that limit. If the tool cannot isolate active room frames, leave the target **unverified** rather than converting the recorder's JavaScript intervals to fps. Keep these captures separate from cold-cache and recorder runs so instrumentation does not change the frame-rate measurement.

## Blank record

Copy this block for each of the six device/tier cells. Keep the raw recorder JSON, Network log, and available frame traces with the sheet. No values below are findings.

| Device/tier context | Entry |
| --- | --- |
| Device model; OS/browser/version |  |
| Ordinary and recorder URLs; test order; date/time |  |
| Viewport; DPR; refresh rate; orientation/zoom |  |
| Power/battery/temperature; network; inspector |  |
| Reduced motion; Pause motion; backend |  |
| Cold HTML + CSS + still / all-first-view / whole-visit bytes through exit; HTTP failures; cache notes |  |
| Arrival image response-end / visible-paint timing and tool, or unverified |  |
| Visual first impressions at 661 pegs, 680 pegs, 680 yard |  |
| Specific Low detail concerns at the matched views |  |
| Performance tool/track and what its frame count means; result, if available |  |
| Target status and reason: met / missed / unverified |  |

| Recorder run | 632 room-open first / settled ms | 661 date first / settled ms; p95 interval; >16.7 / >33.3 count | Head move first / settled ms; p95 interval; >16.7 / >33.3 count | Drawing buffer; idle frame delta; JSON file/ID |
| --- | --- | --- | --- | --- |
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

| Separate uninstrumented trace | Active 661 dissolve: frame times/rate; dropped frames | Active Head move: frame times/rate; dropped frames | Trace file/ID; tool/track limits |
| --- | --- | --- | --- |
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |

Keep failed or interrupted runs in the record with a reason; repeat them rather than filling a missing value. Compare paired tiers on the same device before deciding whether to change quality defaults. A real-device result alone does not replace the outstanding instructor/community, participant, and screen-reader reviews.

## Optional Low antialiasing add-on

Use this add-on if deciding whether FXAA should become the Low default. Keep the Normal/Low runs above as the tier baseline. On each physical device, compare these exact links at the same orientation, zoom, power setting, and room pose. Reload the link for each run; using the visible Graphics radios clears the `aa` option.

| Low option | Ordinary URL for cold visit and frame trace | Recorder URL for JavaScript timings |
| --- | --- | --- |
| Current default | `https://wangy113.github.io/after-632-gpt-sol-6/?tier=low` | `https://wangy113.github.io/after-632-gpt-sol-6/?metrics=1&probe=1&tier=low` |
| No antialiasing reference | `https://wangy113.github.io/after-632-gpt-sol-6/?tier=low&aa=off` | `https://wangy113.github.io/after-632-gpt-sol-6/?metrics=1&probe=1&tier=low&aa=off` |
| FXAA candidate | `https://wangy113.github.io/after-632-gpt-sol-6/?tier=low&aa=fxaa` | `https://wangy113.github.io/after-632-gpt-sol-6/?metrics=1&probe=1&tier=low&aa=fxaa` |

For each option, check the 661 waterskin and pegs, the 680 empty hook and wall trace, and the 680 yard edge and palm. Write an unprompted first impression before checking those details. Watch the 661-to-680 dissolve from the pegs for edge shimmer, blur, or a brightness jump. To compare timing, make three warmed recorder runs per option and alternate option order; the ordinary Low runs above can supply its three samples if conditions match. Use the matching recorder URL and save JSON through its room panel. Capture three further warmed Performance/Frames traces on the matching **ordinary URL without `metrics` or `probe`**, isolating the active pegs dissolve and Head of room move from idle time. Record that tool's frame result and limits separately from the recorder's JavaScript intervals. Record measured memory only if the device's browser tool exposes it, with the tool and method; otherwise mark memory **unverified**. Note any context loss, tab reload, or unusually warm device.

Copy this blank block for each device. Keep raw recorder JSON and traces with it. These fields contain no device findings.

| Device; browser/backend; date; orientation; power setting | Entry |
| --- | --- |
| Context and inspector/profiler |  |

| Low option | Three recorder JSON IDs/order | 661 pegs, 680 pegs, 680 yard: first impression and detail/edge notes | 661→680 pegs dissolve notes | Three ordinary-URL trace IDs, active-frame result and tool/track limits | Memory result and tool, or unverified; failures |
| --- | --- | --- | --- | --- | --- |
| Current default |  |  |  |  |  |
| No AA |  |  |  |  |  |
| FXAA |  |  |  |  |  |

Preferred option and reason, or **unverified**: __________

The [local Low AA images](LOW_FXAA_PREVIEW.md) are references for framing, not physical-device evidence. Keep the current Low default until a device comparison supports a change.

## Optional reed roof material add-on

Use this only if considering the [reed underside candidate](REED_ROOF_PREVIEW.md) for ordinary visits. Compare each tier's plain roof with its exact `roof=reed` URL on the same physical device at the same orientation, power setting, and cache condition. The material adds three maps, so use a cold Network log for transfer, then separate warmed uninstrumented Performance/Frames traces for motion. If collecting JavaScript timing as well, use the corresponding `metrics=1&probe=1&roof=reed` URL and keep that report separate from the displayed-frame trace.

| Tier | Plain URL | Reed URL |
| --- | --- | --- |
| Normal | `https://wangy113.github.io/after-632-gpt-sol-6/` | `https://wangy113.github.io/after-632-gpt-sol-6/?roof=reed` |
| Low | `https://wangy113.github.io/after-632-gpt-sol-6/?tier=low` | `https://wangy113.github.io/after-632-gpt-sol-6/?tier=low&roof=reed` |

At 632 doorway, 661 head, and 680 pegs, look upward from each default place orientation and compare the roof's apparent material, repeated horizontal rows, beam integration, and whether the dated cues below remain easy to find. Ask for an unprompted description first; do not tell the tester what construction the texture is supposed to represent. Record the device, browser/backend, plain and reed URL, cold transferred bytes, raw trace IDs and limits, and the tester's own words. If memory cannot be measured by that browser, mark it unverified. Keep the plain roof until material, instructor, and physical-device observations support a change; no results have been collected here.
