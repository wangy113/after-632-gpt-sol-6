// Loaded by the app for ?probe=1; can also be pasted into the Console before entry.
// JS completed-frame pacing is not GPU render time or a display-frame benchmark.
(() => {
  'use strict';

  window.__after632TierProbe?.stop();
  const root = document.querySelector('#scene-frame');
  if (!root) throw new Error('Open the After 632 reading page before installing the tier probe.');

  const installedAt = performance.now();
  const actions = [];
  const idleSamples = [];
  const seenFrames = new WeakMap();
  let pending = null;
  let active = true;
  let panel = null;
  let readyNotice = null;
  let panelStyle = null;
  let panelSummary = null;
  let panelStatus = null;

  const canvas = () => root.querySelector('canvas');
  const round = value => Math.round(value * 10) / 10;
  const percentile = (sorted, fraction) => sorted[Math.ceil(sorted.length * fraction) - 1];

  function pacing(times) {
    const intervals = times.slice(1).map((time, index) => time - times[index]);
    const sorted = [...intervals].sort((left, right) => left - right);
    return {
      completedFrames: times.length,
      intervals: intervals.length,
      medianMs: sorted.length ? round(percentile(sorted, 0.5)) : null,
      p95Ms: sorted.length ? round(percentile(sorted, 0.95)) : null,
      maxMs: sorted.length ? round(sorted.at(-1)) : null,
      over16_7Ms: intervals.filter(value => value > 16.7).length,
      over33_3Ms: intervals.filter(value => value > 33.3).length,
    };
  }

  function finish(status, time = performance.now()) {
    if (!pending) return;
    const { times, kind, target, startedAt } = pending;
    actions.push({
      kind,
      target,
      status,
      firstFrameMs: times.length ? round(times[0] - startedAt) : null,
      settledMs: status === 'settled' ? round(time - startedAt) : null,
      ...pacing(times),
    });
    pending = null;
    updatePanelSummary();
  }

  function updatePanelSummary() {
    if (!panelSummary) return;
    const settled = actions.filter(action => action.status === 'settled').length;
    panelSummary.textContent = `${settled} settled action${settled === 1 ? '' : 's'} and ${idleSamples.length} idle sample${idleSamples.length === 1 ? '' : 's'} recorded.`;
  }

  function announce(message) {
    if (panelStatus) panelStatus.textContent = message;
  }

  function clicked(event) {
    const button = event.target instanceof Element
      ? event.target.closest('#enter-room, [data-room-date], [data-room-place]')
      : null;
    if (!button || button.disabled) return;
    const current = canvas();
    let kind;
    let target;
    if (button.id === 'enter-room' && !current) {
      kind = 'room open';
      target = '632 doorway';
    } else if (button.dataset.roomDate && current?.dataset.date !== button.dataset.roomDate) {
      kind = 'date change';
      target = button.dataset.roomDate;
    } else if (button.dataset.roomPlace && current?.dataset.place !== button.dataset.roomPlace) {
      kind = 'place move';
      target = button.dataset.roomPlace;
    } else {
      return;
    }
    finish('interrupted');
    pending = {
      kind,
      target,
      startedAt: performance.now(),
      startingFrame: Number(current?.dataset.frames ?? 0),
      startingCanvas: current,
      times: [],
    };
  }

  function frameRecorded(records) {
    for (const record of records) {
      const element = record.target;
      if (element !== canvas()) continue;
      const frame = Number(element.dataset.frames);
      if (!Number.isFinite(frame) || frame <= (seenFrames.get(element) ?? 0)) continue;
      seenFrames.set(element, frame);
      if (!pending) continue;
      if (pending.kind !== 'room open' && element !== pending.startingCanvas) continue;
      if (pending.kind === 'room open' && element === pending.startingCanvas) continue;
      if (pending.kind !== 'room open' && frame <= pending.startingFrame) continue;
      if (pending.kind === 'date change' && element.dataset.date !== pending.target) continue;
      if (pending.kind === 'place move' && element.dataset.place !== pending.target) continue;

      const now = performance.now();
      pending.times.push(now);
      const settled = pending.kind === 'room open'
        ? !document.querySelector('#room-view')?.hidden
        : pending.kind === 'date change'
          ? element.dataset.dateTransition === 'false'
          : element.dataset.moving === 'false';
      if (settled) finish('settled', now);
    }
  }

  const observer = new MutationObserver(frameRecorded);
  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['data-frames'] });
  document.addEventListener('click', clicked, true);

  function snapshot() {
    const element = canvas();
    const rect = element?.getBoundingClientRect();
    const counter = name => element?.dataset[name] === undefined ? null : Number(element.dataset[name]);
    return {
      url: location.href,
      userAgent: navigator.userAgent,
      devicePixelRatio,
      viewport: `${innerWidth}×${innerHeight}`,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      motionPaused: document.querySelector('#pause-motion')?.getAttribute('aria-pressed') === 'true',
      documentHidden: document.hidden,
      roomOpen: Boolean(element),
      backend: element?.dataset.backend ?? null,
      tier: element?.dataset.tier ?? null,
      aa: element?.dataset.aa ?? null,
      date: element?.dataset.date ?? null,
      place: element?.dataset.place ?? null,
      moving: element?.dataset.moving ?? null,
      dateTransition: element?.dataset.dateTransition ?? null,
      css: rect ? `${round(rect.width)}×${round(rect.height)}` : null,
      drawingBuffer: element ? `${element.width}×${element.height}` : null,
      drawingBufferPixels: element ? element.width * element.height : null,
      completedFrames: counter('frames'),
      drawCalls: counter('drawCalls'),
      triangles: counter('triangles'),
      renderCalls: counter('renderCalls'),
    };
  }

  async function idle() {
    if (document.hidden) throw new Error('Keep the browser tab visible for an idle sample.');
    const element = canvas();
    if (!element) throw new Error('Enter the room before sampling idle frames.');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const start = Number(element.dataset.frames ?? 0);
    const settledAtStart = element.dataset.moving === 'false' && element.dataset.dateTransition === 'false';
    if (!settledAtStart) throw new Error('Wait for the current move or date change to settle before sampling idle frames.');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const end = Number(element.dataset.frames ?? 0);
    const result = {
      tier: element.dataset.tier,
      date: element.dataset.date,
      place: element.dataset.place,
      settledAtStart,
      sameCanvas: element === canvas(),
      framesAtStart: start,
      framesAfter1s: end,
      idleFrameDelta: end - start,
    };
    idleSamples.push(result);
    updatePanelSummary();
    console.log('After 632 idle sample (JS completed frames):', result);
    return result;
  }

  function resources() {
    const entries = performance.getEntriesByType('resource')
      .filter(entry => entry.startTime >= installedAt);
    const assets = entries.filter(entry => new URL(entry.name).pathname.includes('/assets/polyhaven/'));
    return {
      resourceEntries: entries.length,
      resourceTransferBytes: entries.reduce((sum, entry) => sum + entry.transferSize, 0),
      roomAssetEntries: assets.length,
      roomAssetEncodedBodyBytes: assets.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
      roomAssetTransferBytes: assets.reduce((sum, entry) => sum + entry.transferSize, 0),
      assets: assets.map(entry => ({
        path: new URL(entry.name).pathname,
        encodedBodyBytes: entry.encodedBodySize,
        transferBytes: entry.transferSize,
      })),
      note: 'Resource Timing counts only entries since probe installation. A cached response may have zero transfer bytes.',
    };
  }

  function report() {
    const current = snapshot();
    const warnings = [];
    if (!active) warnings.push('The probe is stopped; new clicks and frames are no longer recorded.');
    if (current.documentHidden) warnings.push('The tab is hidden; frame samples are not valid.');
    if (current.reducedMotion || current.motionPaused) warnings.push('Motion is reduced or paused; move and date changes may complete in one frame.');
    if (current.drawCalls === null) warnings.push('Open with ?metrics=1 to include renderer counters.');
    if (pending) warnings.push('An action is still in progress; wait for it to settle before exporting.');
    const result = {
      schemaVersion: 1,
      capturedAt: new Date().toISOString(),
      measurement: 'JS completed-frame pacing, not GPU render time or displayed fps',
      warnings,
      snapshot: current,
      actions: [...actions, ...(pending ? [{
        kind: pending.kind, target: pending.target, status: 'pending',
        elapsedMs: round(performance.now() - pending.startedAt), ...pacing(pending.times),
      }] : [])],
      idleSamples: [...idleSamples],
      resources: resources(),
    };
    console.log('After 632 tier probe:', result);
    return result;
  }

  async function copy() {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable; use Download JSON.');
    const result = report();
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    return result;
  }

  function download() {
    const result = report();
    const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    const stamp = result.capturedAt.replace(/[:.]/g, '-');
    link.href = blobUrl;
    link.download = `after632-tier-${result.snapshot.tier ?? 'unopened'}-${result.snapshot.aa ?? 'unknown'}-${stamp}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return result;
  }

  function stop() {
    if (!active) return;
    active = false;
    finish('stopped');
    observer.disconnect();
    document.removeEventListener('click', clicked, true);
    panel?.remove();
    readyNotice?.remove();
    panelStyle?.remove();
  }

  window.__after632TierProbe = { snapshot, idle, report, copy, download, stop };
  if (new URLSearchParams(location.search).get('probe') === '1') {
    panelStyle = document.createElement('style');
    panelStyle.textContent = `
      #tier-probe-panel { margin-block: 1rem; padding: 1rem; border: 2px solid #244b50; background: #fffdf8; }
      #tier-probe-panel h3 { margin-top: 0; }
      #tier-probe-panel .tier-probe-actions { display: flex; flex-wrap: wrap; gap: .6rem; }
      #tier-probe-panel button { min-height: 44px; padding: .5rem .75rem; border: 2px solid #244b50; background: #244b50; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
      #tier-probe-panel button:focus-visible { outline: 3px solid #ad552f; outline-offset: 4px; }
      #tier-probe-panel button:disabled { cursor: wait; opacity: .65; }
      #tier-probe-panel p { max-width: 70ch; }
      #tier-probe-status:empty { display: none; }
    `;
    document.head.append(panelStyle);

    readyNotice = document.createElement('p');
    readyNotice.id = 'tier-probe-ready';
    readyNotice.setAttribute('role', 'status');
    readyNotice.textContent = 'Tier recorder ready. Enter the room; export controls appear below the room controls.';
    document.querySelector('.entry-actions')?.after(readyNotice);

    panel = document.createElement('section');
    panel.id = 'tier-probe-panel';
    panel.setAttribute('aria-labelledby', 'tier-probe-title');
    panel.innerHTML = `
      <h3 id="tier-probe-title">Tier test recorder</h3>
      <p>Choose Enter, 661 CE, then Head of room. Sample one idle second after movement settles, then save the JSON for this run.</p>
      <p>These are JavaScript render callback timings, not displayed frame rate or GPU time. Capture a separate browser Performance trace without this recorder for frame-rate decisions.</p>
      <p id="tier-probe-summary"></p>
      <div class="tier-probe-actions">
        <button type="button" id="tier-probe-idle">Sample idle second</button>
        <button type="button" id="tier-probe-copy">Copy JSON</button>
        <button type="button" id="tier-probe-download">Download JSON</button>
      </div>
      <p id="tier-probe-status" role="status"></p>
    `;
    document.querySelector('#room-view .look-controls')?.after(panel);
    panelSummary = panel.querySelector('#tier-probe-summary');
    panelStatus = panel.querySelector('#tier-probe-status');
    updatePanelSummary();

    const idleButton = panel.querySelector('#tier-probe-idle');
    idleButton.addEventListener('click', async () => {
      idleButton.disabled = true;
      announce('Sampling one idle second. Keep this tab visible and still.');
      try {
        const sample = await idle();
        announce(`Idle sample recorded: ${sample.idleFrameDelta} additional room frames.`);
      } catch (error) {
        announce(`Idle sample unavailable: ${error.message}`);
      } finally {
        idleButton.disabled = false;
      }
    });
    panel.querySelector('#tier-probe-copy').addEventListener('click', async () => {
      try {
        await copy();
        announce('Tier report copied as JSON. Nothing was uploaded.');
      } catch (error) {
        announce(`Could not copy the report: ${error.message}`);
      }
    });
    panel.querySelector('#tier-probe-download').addEventListener('click', () => {
      try {
        download();
        announce('Tier report downloaded as JSON. Nothing was uploaded.');
      } catch (error) {
        announce(`Could not download the report: ${error.message}`);
      }
    });
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.warn('After 632 tier probe: reduced motion is on; enable motion for movement and date pacing samples.');
  }
  console.log('After 632 tier probe ready. Enter the room, change a date and place, then call __after632TierProbe.idle() and __after632TierProbe.report().');
})();
