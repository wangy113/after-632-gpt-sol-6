import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { preview } from 'vite';
import assetConfig from '../assets.config.json' with { type: 'json' };

// Run `npm run build && node scripts/measure-low-aa.mjs`. This compares
// settled Low-tier pictures and render work, not device frame time or quality.
const viewport = { width: 1440, height: 900 };
const outputDirectory = new URL('../docs/phase4/', import.meta.url);
const sky = assetConfig.skies.find(record => record.id === 'qwantani_morning_puresky');
assert.ok(sky, 'Pinned sky is missing from assets.config.json');
const variants = [
  { name: 'default', aa: 'msaa', query: '' },
  { name: 'off', aa: 'off', query: '&aa=off' },
  { name: 'fxaa', aa: 'fxaa', query: '&aa=fxaa' },
];
const poses = [
  { name: '632-doorway', date: '632', place: 'doorway' },
  { name: '661-pegs', date: '661', place: 'pegs' },
  { name: '680-yard', date: '680', place: 'yard' },
];
const expectedAssets = [
  ...assetConfig.textures.flatMap(texture => ['Diffuse', 'nor_gl', 'arm'].map(map =>
    `${texture.id}/${texture.low.maps[map].file}`)),
  `sky/${sky.low.file.file}`,
].sort();

function assetPath(url) {
  const pathname = new URL(url).pathname;
  const marker = '/assets/polyhaven/';
  const index = pathname.indexOf(marker);
  return index < 0 ? null : pathname.slice(index + marker.length);
}

function capturePath(variant, pose) {
  return fileURLToPath(new URL(`low-aa-${variant}-${pose}.png`, outputDirectory));
}

function matchedView(view) {
  const { date, place, position, yaw, pitch, backend, tier, sky: skyId,
    cssWidth, cssHeight, bufferWidth, bufferHeight } = view;
  return { date, place, position, yaw, pitch, backend, tier, sky: skyId,
    cssWidth, cssHeight, bufferWidth, bufferHeight };
}

async function pixelDifference(first, second, pose) {
  const left = await sharp(capturePath(first, pose)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const right = await sharp(capturePath(second, pose)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual(
    [left.info.width, left.info.height, left.info.channels],
    [right.info.width, right.info.height, right.info.channels],
    `${pose}: PNG dimensions differ`,
  );
  assert.equal(left.info.channels, 3);
  let changedPixels = 0;
  let changedAtLeast8 = 0;
  let maxChannelDifference = 0;
  let totalChannelDifference = 0;
  for (let index = 0; index < left.data.length; index += 3) {
    let greatestPixelDifference = 0;
    for (let channel = 0; channel < 3; channel++) {
      const difference = Math.abs(left.data[index + channel] - right.data[index + channel]);
      greatestPixelDifference = Math.max(greatestPixelDifference, difference);
      totalChannelDifference += difference;
    }
    if (greatestPixelDifference > 0) changedPixels++;
    if (greatestPixelDifference >= 8) changedAtLeast8++;
    maxChannelDifference = Math.max(maxChannelDifference, greatestPixelDifference);
  }
  const pixelCount = left.info.width * left.info.height;
  return {
    pair: `${first} → ${second}`,
    pose,
    changedPixels,
    changedPercent: `${(100 * changedPixels / pixelCount).toFixed(2)}%`,
    pixelsChangedAtLeast8: changedAtLeast8,
    meanRgbChannelDifference: (totalChannelDifference / left.data.length).toFixed(2),
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

  async function measure(variant) {
    // A fresh context gives each mode the same uncached seven room responses.
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    const requestFailures = [];
    const httpErrors = [];
    const assetResponses = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('requestfailed', request => requestFailures.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => {
      if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
      if (assetPath(response.url())) assetResponses.push(response);
    });

    try {
      await page.goto(`${origin}/?gl=1&metrics=1&tier=low${variant.query}`);
      await page.getByRole('button', { name: 'Enter the room' }).click();
      const canvas = page.locator('#scene-frame canvas');

      async function frameCount() {
        return Number(await canvas.getAttribute('data-frames'));
      }

      async function waitForPose(date, place, after = -1) {
        await page.waitForFunction(({ date, place, aa, after }) => {
          const image = document.querySelector('#scene-frame canvas');
          return image?.dataset.backend === 'WebGL2 fallback'
            && image.dataset.tier === 'low'
            && image.dataset.aa === aa
            && image.dataset.date === date
            && image.dataset.place === place
            && image.dataset.moving === 'false'
            && image.dataset.dateTransition === 'false'
            && Number(image.dataset.frames) > after
            && Number(image.dataset.drawCalls) > 0
            && Number(image.dataset.triangles) > 0
            && Number(image.dataset.renderCalls) > 0;
        }, { date, place, aa: variant.aa, after }, { timeout: 15_000 });
      }

      async function clickAndWait(selector, date, place) {
        const before = await frameCount();
        await page.locator(selector).click();
        await waitForPose(date, place, before);
      }

      async function capture(pose) {
        // Refresh the settled pose once, so counters describe comparable frames.
        const startYaw = await canvas.getAttribute('data-yaw');
        await clickAndWait('[data-look="right"]', pose.date, pose.place);
        await clickAndWait('[data-look="left"]', pose.date, pose.place);
        const view = await canvas.evaluate(image => {
          const rect = image.getBoundingClientRect();
          return {
            date: image.dataset.date,
            place: image.dataset.place,
            position: image.dataset.position,
            yaw: image.dataset.yaw,
            pitch: image.dataset.pitch,
            backend: image.dataset.backend,
            tier: image.dataset.tier,
            aa: image.dataset.aa,
            sky: image.dataset.sky,
            cssWidth: rect.width,
            cssHeight: rect.height,
            bufferWidth: image.width,
            bufferHeight: image.height,
            drawCalls: Number(image.dataset.drawCalls),
            triangles: Number(image.dataset.triangles),
            renderCalls: Number(image.dataset.renderCalls),
          };
        });
        assert.equal(view.yaw, startYaw, `${variant.name} ${pose.name}: yaw did not reset`);
        assert.equal(view.sky, sky.id, `${variant.name} ${pose.name}: wrong sky`);
        assert.ok(Math.abs(view.bufferWidth / view.cssWidth - 1) < 0.02,
          `${variant.name} ${pose.name}: drawing buffer does not match DPR 1`);
        assert.ok(Math.abs(view.bufferHeight / view.cssHeight - 1) < 0.02,
          `${variant.name} ${pose.name}: drawing buffer does not match DPR 1`);
        await canvas.screenshot({ path: capturePath(variant.name, pose.name) });
        return view;
      }

      await waitForPose('632', 'doorway');
      const views = { '632-doorway': await capture(poses[0]) };
      await clickAndWait('[data-room-date="661"]', '661', 'doorway');
      await clickAndWait('[data-room-place="pegs"]', '661', 'pegs');
      views['661-pegs'] = await capture(poses[1]);
      await clickAndWait('[data-room-date="680"]', '680', 'pegs');
      await clickAndWait('[data-room-place="yard"]', '680', 'yard');
      views['680-yard'] = await capture(poses[2]);

      const assets = await Promise.all(assetResponses.map(async response => {
        assert.equal(response.status(), 200, `${variant.name}: ${response.url()}`);
        const { responseBodySize } = await response.request().sizes();
        assert.ok(responseBodySize > 0, `${variant.name}: empty response body ${response.url()}`);
        return { path: assetPath(response.url()), bytes: responseBodySize };
      }));
      assets.sort((a, b) => a.path.localeCompare(b.path));
      assert.deepEqual(assets.map(asset => asset.path), expectedAssets,
        `${variant.name}: wrong room asset request set`);
      assert.deepEqual(pageErrors, [], `${variant.name}: page errors`);
      assert.deepEqual(requestFailures, [], `${variant.name}: request failures`);
      assert.deepEqual(httpErrors, [], `${variant.name}: HTTP errors`);
      return { variant: variant.name, views, assets, sevenAssetResponseBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
        pageErrors: pageErrors.length, requestFailures: requestFailures.length, httpErrors: httpErrors.length };
    } finally {
      await context.close();
    }
  }

  const rows = [];
  for (const variant of variants) rows.push(await measure(variant));
  for (const pose of poses) {
    for (const row of rows.slice(1)) {
      assert.deepEqual(matchedView(row.views[pose.name]), matchedView(rows[0].views[pose.name]),
        `${row.variant} ${pose.name}: pose, backend, sky, or drawing buffer differs from default`);
    }
  }
  for (const row of rows.slice(1)) {
    assert.deepEqual(row.assets, rows[0].assets, `${row.variant}: encoded room asset transfer differs`);
  }

  console.log(`Chromium ${browser.version()}, ${viewport.width}×${viewport.height} viewport, DPR 1, reduced motion, SwiftShader WebGL2 fallback`);
  console.table(rows.flatMap(row => poses.map(pose => {
    const view = row.views[pose.name];
    return {
      variant: row.variant, pose: pose.name, backend: view.backend, aa: view.aa,
      buffer: `${view.bufferWidth}×${view.bufferHeight}`,
      drawCalls: view.drawCalls, triangles: view.triangles, renderCalls: view.renderCalls,
    };
  })));
  console.table(rows.map(({ variant, sevenAssetResponseBytes, pageErrors, requestFailures, httpErrors }) => ({
    variant, sevenAssetResponseBytes, pageErrors, requestFailures, httpErrors,
  })));
  console.table(rows[0].assets);
  const pixelDifferences = [];
  for (const pose of poses) {
    pixelDifferences.push(await pixelDifference('default', 'off', pose.name));
    pixelDifferences.push(await pixelDifference('default', 'fxaa', pose.name));
    pixelDifferences.push(await pixelDifference('off', 'fxaa', pose.name));
  }
  console.table(pixelDifferences);
  console.log('Nine matched PNGs saved to docs/phase4/. Encoded response bodies exclude headers, code, and arrival media. Pixel differences are raw RGB comparisons, not a quality score or device performance result.');
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
