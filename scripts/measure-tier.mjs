import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

// Compare settled views at a high device pixel ratio. This checks drawing-buffer
// work and render counters; it is not a frame-time or device performance test.
const viewport = { width: 1440, height: 900 };
const deviceScaleFactor = 2;
const capture = process.argv.includes('--capture');
const captureDirectory = new URL('../docs/phase4/', import.meta.url);
const server = await preview({
  logLevel: 'error',
  preview: { host: '127.0.0.1', port: 0, strictPort: true },
});
let browser;

try {
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Vite preview did not open a local port');
  const origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  async function measure(tier) {
    const page = await browser.newPage({ viewport, deviceScaleFactor, reducedMotion: 'reduce' });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    try {
      await page.goto(`${origin}/?gl=1&metrics=1${tier === 'low' ? '&tier=low' : ''}`);
      await page.getByRole('button', { name: 'Enter the room' }).click();
      const canvas = page.locator('#scene-frame canvas');

      async function waitForFrame(date, place, after = -1) {
        await page.waitForFunction(({ date, place, after }) => {
          const element = document.querySelector('#scene-frame canvas');
          return element?.dataset.backend === 'WebGL2 fallback'
            && element.dataset.date === date
            && element.dataset.place === place
            && element.dataset.moving === 'false'
            && element.dataset.dateTransition === 'false'
            && Number(element.dataset.frames) > after
            && Number(element.dataset.drawCalls) > 0
            && Number(element.dataset.triangles) > 0
            && Number(element.dataset.renderCalls) > 0;
        }, { date, place, after }, { timeout: 15_000 });
      }

      async function frameCount() {
        return Number(await canvas.getAttribute('data-frames'));
      }

      async function clickAndWait(selector, date, place) {
        const before = await frameCount();
        await page.locator(selector).click();
        await waitForFrame(date, place, before);
      }

      async function sample(date, place) {
        // A matched right/left pair requests fresh frames at the settled pose.
        const startingYaw = await canvas.getAttribute('data-yaw');
        await clickAndWait('[data-look="right"]', date, place);
        await clickAndWait('[data-look="left"]', date, place);
        const result = await canvas.evaluate(element => {
          const { width: cssWidth, height: cssHeight } = element.getBoundingClientRect();
          return {
            date: element.dataset.date,
            place: element.dataset.place,
            position: element.dataset.position,
            yaw: element.dataset.yaw,
            pitch: element.dataset.pitch,
            backend: element.dataset.backend,
            cssWidth,
            cssHeight,
            bufferWidth: element.width,
            bufferHeight: element.height,
            pixels: element.width * element.height,
            drawCalls: Number(element.dataset.drawCalls),
            triangles: Number(element.dataset.triangles),
            renderCalls: Number(element.dataset.renderCalls),
          };
        });
        assert.equal(result.yaw, startingYaw, `${tier} camera yaw changed at ${date} ${place}`);
        return { tier, ...result };
      }

      await waitForFrame('632', 'doorway');
      const doorway = await sample('632', 'doorway');
      if (capture) {
        await mkdir(captureDirectory, { recursive: true });
        await canvas.screenshot({ path: fileURLToPath(new URL(`tier-632-doorway-${tier}.png`, captureDirectory)) });
      }
      await clickAndWait('[data-room-date="680"]', '680', 'doorway');
      await clickAndWait('[data-room-place="yard"]', '680', 'yard');
      const yard = await sample('680', 'yard');
      assert.deepEqual(pageErrors, [], `${tier} page errors`);
      return [doorway, yard];
    } finally {
      await page.close();
    }
  }

  const baseline = await measure('baseline');
  const low = await measure('low');
  const comparisons = [];
  for (let index = 0; index < baseline.length; index++) {
    const normal = baseline[index];
    const reduced = low[index];
    assert.equal(normal.backend, 'WebGL2 fallback');
    assert.equal(reduced.backend, 'WebGL2 fallback');
    assert.deepEqual(
      [normal.date, normal.place, normal.position, normal.yaw, normal.pitch],
      [reduced.date, reduced.place, reduced.position, reduced.yaw, reduced.pitch],
      'Compared camera poses differ',
    );
    assert.ok(Math.abs(normal.cssWidth - reduced.cssWidth) < 1, 'Canvas CSS widths differ');
    assert.ok(Math.abs(normal.cssHeight - reduced.cssHeight) < 1, 'Canvas CSS heights differ');
    assert.ok(Math.abs(normal.bufferWidth / normal.cssWidth - 1.5) < 0.02, 'Baseline DPR cap is not 1.5');
    assert.ok(Math.abs(normal.bufferHeight / normal.cssHeight - 1.5) < 0.02, 'Baseline DPR cap is not 1.5');
    assert.ok(Math.abs(reduced.bufferWidth / reduced.cssWidth - 1) < 0.02, 'Low DPR cap is not 1');
    assert.ok(Math.abs(reduced.bufferHeight / reduced.cssHeight - 1) < 0.02, 'Low DPR cap is not 1');
    assert.ok(reduced.pixels < normal.pixels, 'Low tier did not reduce drawing-buffer pixels');
    assert.ok(reduced.renderCalls <= normal.renderCalls, 'Low tier added a render call');
    comparisons.push({
      view: `${normal.date} ${normal.place}`,
      baselinePixels: normal.pixels,
      lowPixels: reduced.pixels,
      lowToBaseline: `${(100 * reduced.pixels / normal.pixels).toFixed(1)}%`,
    });
  }

  console.log(`Chromium ${browser.version()}, ${viewport.width}×${viewport.height} viewport, emulated DPR ${deviceScaleFactor}, reduced motion, WebGL2 fallback via SwiftShader`);
  console.table([...baseline, ...low].map(({ tier, date, place, backend, cssWidth, cssHeight, bufferWidth, bufferHeight, pixels, drawCalls, triangles, renderCalls }) => ({
    tier, view: `${date} ${place}`, backend,
    css: `${cssWidth.toFixed(1)}×${cssHeight.toFixed(1)}`,
    buffer: `${bufferWidth}×${bufferHeight}`,
    pixels, drawCalls, triangles, renderCalls,
  })));
  console.table(comparisons);
  if (capture) console.log('Saved matched 632 doorway canvas screenshots to docs/phase4/.');
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
