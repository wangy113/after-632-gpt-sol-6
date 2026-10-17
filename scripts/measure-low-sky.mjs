import assert from 'node:assert/strict';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { preview } from 'vite';
import assetConfig from '../assets.config.json' with { type: 'json' };

// Run against an already-built dist/. Keep the Low maps, drawing buffer, lights,
// and camera fixed while comparing each sky's 1k control with its 512 HDR.
const viewport = { width: 1440, height: 900 };
const outputDirectory = new URL('../docs/phase4/', import.meta.url);
const skyDirectory = new URL('../public/assets/polyhaven/sky/', import.meta.url);
const mapNames = ['Diffuse', 'nor_gl', 'arm'];
const roomTextures = assetConfig.textures.filter(record =>
  record.role === 'room-walls' || record.role === 'room-floor');
assert.equal(roomTextures.length, 2, 'Expected the wall and floor records used by ordinary visits');

function assetPath(url) {
  const pathname = new URL(url).pathname;
  const marker = '/assets/polyhaven/';
  const index = pathname.indexOf(marker);
  return index < 0 ? null : pathname.slice(index + marker.length);
}

function skyFile(sky, resolution) {
  return resolution === '1k'
    ? `${sky.id}_1k.hdr`
    : sky.low.file.file;
}

function expectedAssets(sky, resolution) {
  return [
    ...roomTextures.flatMap(texture => mapNames.map(map =>
      `${texture.id}/${texture.low.maps[map].file}`)),
    `sky/${skyFile(sky, resolution)}`,
  ].sort();
}

function sameView(view) {
  const { date, place, position, yaw, pitch, backend, cssWidth, cssHeight,
    bufferWidth, bufferHeight, renderCalls } = view;
  return { date, place, position, yaw, pitch, backend, cssWidth, cssHeight,
    bufferWidth, bufferHeight, renderCalls };
}

function capturePath(skyId, resolution, pose) {
  return fileURLToPath(new URL(`sky-low-${skyId}-${resolution}-${pose}.png`, outputDirectory));
}

async function comparePixels(skyId, pose) {
  const control = await sharp(capturePath(skyId, '1k', pose)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const reduced = await sharp(capturePath(skyId, '512', pose)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(control.info.width, reduced.info.width, `${skyId} ${pose}: screenshot widths differ`);
  assert.equal(control.info.height, reduced.info.height, `${skyId} ${pose}: screenshot heights differ`);
  assert.equal(control.info.channels, 3);
  assert.equal(reduced.info.channels, 3);
  let changedPixels = 0;
  let maxChannelDifference = 0;
  for (let index = 0; index < control.data.length; index += 3) {
    let pixelChanged = false;
    for (let channel = 0; channel < 3; channel++) {
      const difference = Math.abs(control.data[index + channel] - reduced.data[index + channel]);
      if (difference > 0) pixelChanged = true;
      maxChannelDifference = Math.max(maxChannelDifference, difference);
    }
    if (pixelChanged) changedPixels++;
  }
  const pixelCount = control.info.width * control.info.height;
  return {
    sky: skyId, pose,
    changedPixels,
    changedFraction: `${(100 * changedPixels / pixelCount).toFixed(2)}%`,
    maxRgbChannelDifference: maxChannelDifference,
  };
}

await mkdir(outputDirectory, { recursive: true });
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

  async function measure(sky, resolution) {
    // A new context ensures each row represents seven real network responses.
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    const requestFailures = [];
    const assetResponses = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('requestfailed', request => requestFailures.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => {
      if (assetPath(response.url())) assetResponses.push(response);
    });

    try {
      const resolutionQuery = resolution === '1k' ? '&skyResolution=1k' : '';
      await page.goto(`${origin}/?gl=1&metrics=1&tier=low&sky=${sky.id}${resolutionQuery}`);
      await page.getByRole('button', { name: 'Enter the room' }).click();
      const canvas = page.locator('#scene-frame canvas');

      async function frameCount() {
        return Number(await canvas.getAttribute('data-frames'));
      }

      async function waitForPose(date, yaw, pitch, before = -1) {
        await page.waitForFunction(({ date, yaw, pitch, before }) => {
          const image = document.querySelector('#scene-frame canvas');
          return image?.dataset.backend === 'WebGL2 fallback'
            && image.dataset.tier === 'low'
            && image.dataset.date === date
            && image.dataset.place === 'yard'
            && image.dataset.sky !== undefined
            && image.dataset.position === '0.000,1.600,4.400'
            && image.dataset.yaw === yaw
            && image.dataset.pitch === pitch
            && image.dataset.moving === 'false'
            && image.dataset.dateTransition === 'false'
            && Number(image.dataset.frames) > before
            && Number(image.dataset.drawCalls) > 0
            && Number(image.dataset.triangles) > 0
            && Number(image.dataset.renderCalls) > 0;
        }, { date, yaw, pitch, before }, { timeout: 15_000 });
      }

      async function settleAtPose(date, yaw, pitch) {
        // Three's draw and triangle counters can vary even across repeated
        // same-pose frames here, so retain their range as a diagnostic.
        const samples = [];
        for (let index = 0; index < 4; index++) {
          let before = await frameCount();
          await page.locator('[data-look="right"]').click();
          await waitForPose(date, (Number(yaw) + 0.22).toFixed(3), pitch, before);
          before = await frameCount();
          await page.locator('[data-look="left"]').click();
          await waitForPose(date, yaw, pitch, before);
          samples.push(await canvas.evaluate(image => ({
            drawCalls: Number(image.dataset.drawCalls),
            triangles: Number(image.dataset.triangles),
          })));
        }
        return {
          drawCalls: [Math.min(...samples.map(sample => sample.drawCalls)), Math.max(...samples.map(sample => sample.drawCalls))],
          triangles: [Math.min(...samples.map(sample => sample.triangles)), Math.max(...samples.map(sample => sample.triangles))],
        };
      }

      async function capture(name, date, yaw, pitch) {
        const counterRanges = await settleAtPose(date, yaw, pitch);
        const view = await canvas.evaluate(image => {
          const rect = image.getBoundingClientRect();
          return {
            date: image.dataset.date,
            place: image.dataset.place,
            position: image.dataset.position,
            yaw: image.dataset.yaw,
            pitch: image.dataset.pitch,
            backend: image.dataset.backend,
            sky: image.dataset.sky,
            tier: image.dataset.tier,
            cssWidth: rect.width,
            cssHeight: rect.height,
            bufferWidth: image.width,
            bufferHeight: image.height,
            drawCalls: Number(image.dataset.drawCalls),
            triangles: Number(image.dataset.triangles),
            renderCalls: Number(image.dataset.renderCalls),
          };
        });
        assert.equal(view.sky, sky.id);
        assert.equal(view.tier, 'low');
        assert.ok(Math.abs(view.bufferWidth / view.cssWidth - 1) < 0.02);
        assert.ok(Math.abs(view.bufferHeight / view.cssHeight - 1) < 0.02);
        await canvas.screenshot({ path: capturePath(sky.id, resolution, name) });
        return { ...view, counterRanges };
      }

      await page.waitForFunction(() => {
        const image = document.querySelector('#scene-frame canvas');
        return image?.dataset.backend === 'WebGL2 fallback' && Number(image.dataset.frames) > 0;
      });
      await page.locator('[data-room-place="yard"]').click();
      await waitForPose('632', '0.000', '-0.120');

      // The Phase 0 sky comparison pose looks above the room roof.
      for (let index = 0; index < 4; index++) await page.locator('[data-look="up"]').click();
      await waitForPose('632', '0.000', '0.360');
      const up = await capture('632-up', '632', '0.000', '0.360');

      // This documented turned yard pose puts the dated palm against the sky.
      await page.locator('[data-look="reset"]').click();
      for (let index = 0; index < 6; index++) await page.locator('[data-look="left"]').click();
      for (let index = 0; index < 6; index++) await page.locator('[data-look="up"]').click();
      await waitForPose('632', '-1.320', '0.500');
      const palm632 = await capture('632-palm', '632', '-1.320', '0.500');

      await page.locator('[data-room-date="680"]').click();
      await waitForPose('680', '-1.320', '0.500');
      const palm680 = await capture('680-palm', '680', '-1.320', '0.500');

      const assets = await Promise.all(assetResponses.map(async response => {
        assert.equal(response.status(), 200, `${sky.id} ${resolution}: ${response.url()}`);
        const { responseBodySize } = await response.request().sizes();
        assert.ok(responseBodySize > 0, `${sky.id} ${resolution}: empty response body ${response.url()}`);
        return { path: assetPath(response.url()), bytes: responseBodySize };
      }));
      assert.deepEqual(assets.map(asset => asset.path).sort(), expectedAssets(sky, resolution),
        `${sky.id} ${resolution}: requested room assets`);
      assert.deepEqual(pageErrors, [], `${sky.id} ${resolution}: page errors`);
      assert.deepEqual(requestFailures, [], `${sky.id} ${resolution}: request failures`);

      const file = resolution === '1k' ? sky.file : sky.low.file;
      const sourceBytes = (await stat(new URL(skyFile(sky, resolution), skyDirectory))).size;
      assert.equal(sourceBytes, file.sizeBytes, `${sky.id} ${resolution}: recorded source bytes`);
      const skyPath = `sky/${skyFile(sky, resolution)}`;
      const skyResponseBytes = assets.find(asset => asset.path === skyPath).bytes;
      const mapResponseBytes = assets.filter(asset => asset.path !== skyPath)
        .reduce((sum, asset) => sum + asset.bytes, 0);
      return {
        sky: sky.id,
        resolution,
        views: { up, palm632, palm680 },
        sourceBytes,
        skyResponseBytes,
        mapResponseBytes,
        sevenAssetResponseBytes: skyResponseBytes + mapResponseBytes,
      };
    } finally {
      await context.close();
    }
  }

  const rows = [];
  for (const sky of assetConfig.skies) {
    const reduced = await measure(sky, '512');
    const control = await measure(sky, '1k');
    for (const pose of ['up', 'palm632', 'palm680']) {
      assert.deepEqual(sameView(reduced.views[pose]), sameView(control.views[pose]),
        `${sky.id}: ${pose} camera, canvas, or renderer work changed with HDR resolution`);
    }
    assert.equal(reduced.mapResponseBytes, control.mapResponseBytes,
      `${sky.id}: Low map transfer changed with HDR resolution`);
    rows.push(control, reduced);
  }

  console.log(`Chromium ${browser.version()}, ${viewport.width}×${viewport.height} viewport, DPR 1, reduced motion, SwiftShader WebGL2 fallback`);
  console.table(rows.map(({ sky, resolution, sourceBytes, skyResponseBytes, mapResponseBytes, sevenAssetResponseBytes }) => ({
    sky, resolution, skySourceBytes: sourceBytes, skyHttpBodyBytes: skyResponseBytes,
    sixLowMapHttpBodyBytes: mapResponseBytes, sevenAssetHttpBodyBytes: sevenAssetResponseBytes,
  })));
  console.table(rows.flatMap(({ sky, resolution, views }) => Object.entries(views).map(([pose, view]) => ({
    sky, resolution, pose,
    drawCalls: view.counterRanges.drawCalls.join('–'),
    triangles: view.counterRanges.triangles.join('–'),
    renderCalls: view.renderCalls,
  }))));
  for (let index = 0; index < rows.length; index += 2) {
    const control = rows[index];
    const reduced = rows[index + 1];
    console.log(`${control.sky}: 512 HDR source ${(100 * reduced.sourceBytes / control.sourceBytes).toFixed(1)}% of 1k; sky encoded HTTP body ${(100 * reduced.skyResponseBytes / control.skyResponseBytes).toFixed(1)}%; seven asset bodies ${(100 * reduced.sevenAssetResponseBytes / control.sevenAssetResponseBytes).toFixed(1)}%.`);
  }
  const pixelDifferences = [];
  for (const sky of assetConfig.skies) {
    for (const pose of ['632-up', '632-palm', '680-palm']) {
      pixelDifferences.push(await comparePixels(sky.id, pose));
    }
  }
  console.table(pixelDifferences);
  console.log('Encoded response bodies exclude headers, app code, and the arrival still. Twelve matched PNGs saved under docs/phase4/.');
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
