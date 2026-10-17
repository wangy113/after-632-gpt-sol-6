# Real-device Normal and Low test sheet

The [plan](../PLAN.md#budgets) calls for 60 fps on the demo laptop at its planned Balanced tier and 30 fps on a Chromebook or phone at Low, with no frames drawn after the view settles. The current visible choices are **Normal** and **Low**; Normal is not yet the planned Balanced pipeline. No physical-device results have been collected. Use this sheet to record them before considering automatic tier selection.

## Set up each device

Test the actual demo laptop, Chromebook, and phone at their usual display resolution. Record model, OS/browser versions, display refresh rate if known, power/battery mode, device pixel ratio, viewport, network, and whether the browser reports WebGPU or WebGL2 fallback. Do not use device emulation or `?gl=1` for the primary runs. Keep the tab visible and other heavy tasks closed. Use the same orientation, zoom, lighting, and power settings when comparing the two tiers on one device. Note thermal throttling or an unusually warm device.

| Device | Normal URL | Low URL |
| --- | --- | --- |
| Demo laptop | `https://wangy113.github.io/after-632-gpt-sol-6/?metrics=1` | `https://wangy113.github.io/after-632-gpt-sol-6/?metrics=1&tier=low` |
| Chromebook | Same Normal URL | Same Low URL |
| Phone | Same Normal URL | Same Low URL |

`?metrics=1` exposes the room's renderer counters. A canvas `data-tier` of `baseline` means the visible Normal choice. Keep **Pause motion** off and system reduced motion off for the animation timing runs. If a tester needs reduced motion, honor that setting, test the instant transitions separately, and mark animation timing unavailable. A phone can use Chrome's remote device inspector from a desktop for Android, or Safari's Develop inspector from a Mac for iPhone; keep the phone's tab in front while collecting timing. Record the inspector/profiler used, since an attached inspector may affect timing.

## Measure transfer separately

For each device and tier, make one cold-cache Network-panel run on the public URL. Clear the site's cache or use the panel's disabled-cache setting, clear its log, then navigate to the URL. Before entering the room, record both the **HTML + CSS + arrival still** transfer subtotal (the plan's 300 KB first-view scope) and the **all-request first-view** total. Enter and wait for 632 doorway, then record the **whole-visit transferred bytes** for same-origin requests and any failed requests. Include HTML, CSS, script, still, maps, and sky in the whole-visit number (the plan's 15 MB scope). Note whether the panel counts headers and whether any request was served from cache. The budgets concern encoded content; panel “Transferred” totals may also count headers, so retain encoded-body totals if the panel provides them. Do not compare a cached zero-byte transfer to a cold visit.

The probe below also records Resource Timing entries made *after it was installed*. Those entries help identify the seven requested room assets, but exclude the arrival load and may report zero transfer for cached resources. Use the cold-cache Network log for the visit budget.

## Measure animation on a warmed visit

Run each tier three times on each device (six device/tier cells, eighteen runs). Warm the site's cache once before these runs, then reload the tier URL for every run. Alternate tier order when practical and note the order. Keep the viewport and power setting steady. These steps use physical taps/clicks; the probe only observes them.

1. On the reading page, open the browser Console, paste the complete contents of [`scripts/device-tier-probe.js`](../../scripts/device-tier-probe.js), and run it **before** selecting **Enter the room**. On a phone, use the browser's remote inspector. Confirm “After 632 tier probe ready.” Do not install it on an already open room when measuring room-open time.
2. Select **Enter the room**. Wait for the 632 doorway to settle. Select **661 CE**, wait for the dissolve, then select **Head of room**, wait for the glide. Leave **Pause motion** off. A transition with only one recorded frame is an invalid animation sample; check reduced motion, tab visibility, and whether the transition actually ran.
3. In the Console, run `await __after632TierProbe.idle()` while the tab is visible and untouched. Record the returned frame delta. Then run `__after632TierProbe.report()`. Save its full output or copy it into the session notes. It includes click-to-first-frame and click-to-settled times, completed app-frame interval median/p95/max and counts over 16.7/33.3 ms, backend, CSS and drawing-buffer sizes, and the asset request list. Call `__after632TierProbe.stop()` when done.
4. For visual comparison, inspect the **Pegs / hooks** place at 661 and 680, and the **Yard looking back** at 680 on both tiers. First write what you can distinguish without prompting; then check whether the 661 waterskin, 680 empty hook and pale wall trace, 680 floor mark, and yard palm remain legible. Note softness, jagged edges, missing detail, or a cropped cue. Use the same orientation and place on both tiers. See the [textured prototype packet](../phase0/TEXTURED_REVIEW_PACKET.md) for matched reference views; those images are not physical-device results.

The probe times **completed JavaScript room render callbacks**, not GPU duration or frames actually presented by the display. The date change also prepares two offscreen targets synchronously before its 0.8-second dissolve; click-to-first-frame captures that wait, while frame intervals do not. The idle delta shows whether the app scheduled more renders over one quiet second; it cannot establish GPU sleep. For any claim about the 60/30 fps targets, capture a separate browser Performance/Frames trace or FPS overlay on the physical device during the same 661 dissolve and Head of room glide. Record the tool, its measured presented-frame rate or frame times, and any dropped frames. If that measurement is unavailable, leave the target **unverified** rather than converting the probe's intervals to fps.

## Blank record

Copy this block for each of the six device/tier cells. Keep the raw Console report and Network log with the sheet, if possible. No values below are findings.

| Device/tier context | Entry |
| --- | --- |
| Device model; OS/browser/version |  |
| Tier URL; test order; date/time |  |
| Viewport; DPR; refresh rate; orientation/zoom |  |
| Power/battery/temperature; network; inspector |  |
| Reduced motion; Pause motion; backend |  |
| Cold HTML + CSS + still / all-first-view / whole-visit bytes; HTTP failures; cache notes |  |
| Visual first impressions at 661 pegs, 680 pegs, 680 yard |  |
| Specific Low detail concerns at the matched views |  |
| Performance tool and actual presented-frame result, if available |  |
| Target status and reason: met / missed / unverified |  |

| Warm run | 632 room-open first / settled ms | 661 date first / settled ms; p95 interval; >16.7 / >33.3 count | Head move first / settled ms; p95 interval; >16.7 / >33.3 count | Drawing buffer; idle frame delta; report ID |
| --- | --- | --- | --- | --- |
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

Keep failed or interrupted runs in the record with a reason; repeat them rather than filling a missing value. Compare paired tiers on the same device before deciding whether to change quality defaults. A real-device result alone does not replace the outstanding instructor/community, participant, and screen-reader reviews.

## Optional Low antialiasing add-on

Use this add-on if deciding whether FXAA should become the Low default. Keep the Normal/Low runs above as the tier baseline. On each physical device, compare these exact links at the same orientation, zoom, power setting, and room pose. Reload the link for each run; using the visible Graphics radios clears the `aa` option.

| Low option | URL |
| --- | --- |
| Current default | `https://wangy113.github.io/after-632-gpt-sol-6/?metrics=1&tier=low` |
| No antialiasing reference | `https://wangy113.github.io/after-632-gpt-sol-6/?metrics=1&tier=low&aa=off` |
| FXAA candidate | `https://wangy113.github.io/after-632-gpt-sol-6/?metrics=1&tier=low&aa=fxaa` |

For each option, check the 661 waterskin and pegs, the 680 empty hook and wall trace, and the 680 yard edge and palm. Write an unprompted first impression before checking those details. Watch the 661-to-680 dissolve from the pegs for edge shimmer, blur, or a brightness jump. To compare timing, make three warmed runs per option and alternate option order; the ordinary Low runs above can supply its three samples if conditions match. Use the same Console probe and a browser Performance/Frames trace during the date change and Head of room move. Record the actual presented-frame result separately from the probe's JavaScript intervals. Record measured memory only if the device's browser tool exposes it, with the tool and method; otherwise mark memory **unverified**. Note any context loss, tab reload, or unusually warm device.

Copy this blank block for each device. Keep raw probe reports and traces with it. These fields contain no device findings.

| Device; browser/backend; date; orientation; power setting | Entry |
| --- | --- |
| Context and inspector/profiler |  |

| Low option | Three warm run IDs/order | 661 pegs, 680 pegs, 680 yard: first impression and detail/edge notes | 661→680 pegs dissolve notes | Presented-frame trace result and tool | Memory result and tool, or unverified; failures |
| --- | --- | --- | --- | --- | --- |
| Current default |  |  |  |  |  |
| No AA |  |  |  |  |  |
| FXAA |  |  |  |  |  |

Preferred option and reason, or **unverified**: __________

The [local Low AA images](LOW_FXAA_PREVIEW.md) are references for framing, not physical-device evidence. Keep the current Low default until a device comparison supports a change.
