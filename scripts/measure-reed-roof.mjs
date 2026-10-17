import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { preview } from 'vite';
import assetConfig from '../assets.config.json' with { type: 'json' };

// Compare the optional roof at matched settled poses. These captures do not
// measure device performance or establish whether the material is appropriate.
const viewport = { width: 1440, height: 900 };
const outputDirectory = new URL('../docs/phase4/', import.meta.url);
const roomTextures = assetConfig.textures.filter(record =>
  record.role === 'room-walls' || record.role === 'room-floor');
const roofTexture = assetConfig.textures.find(record => record.role === 'roof-underside');
const sky = assetConfig.skies.find(record => record.id === 'qwantani_morning_puresky');
assert.equal(roomTextures.length, 2, 'Expected wall and floor records');
assert.ok(roofTexture, 'Pinned roof underside texture is missing');
assert.ok(sky, 'Pinned morning sky is missing');

const variants = [
  { name: 'normal-plain', tier: 'baseline', roof: 'plain', query: '' },
  { name: 'normal-reed', tier: 'baseline', roof: 'reed', query: '&roof=reed' },
  { name: 'low-plain', tier: 'low', roof: 'plain', query: '&tier=low' },
  { name: 'low-reed', tier: 'low', roof: 'reed', query: '&tier=low&roof=reed' },
];
const poses = [
  { name: '632-doorway-up', date: '632', place: 'doorway', upClicks: 6 },
  { name: '661-head-up', date: '661', place: 'head', upClicks: 5 },
  { name: '680-pegs-up', date: '680', place: 'pegs', upClicks: 4 },
];

function assetPath(url) {
  const pathname = new URL(url).pathname;
  const marker = '/assets/polyhaven/';
  const index = pathname.indexOf(marker);
  return index < 0 ? null : pathname.slice(index + marker.length);
}

function expectedAssets(variant) {
  const records = variant.roof === 'reed' ? [...roomTextures, roofTexture] : roomTextures;
  const suffix = variant.tier === 'low' ? 'low' : 'maps';
  return [
    ...records.flatMap(record => ['Diffuse', 'nor_gl', 'arm'].map(kind => {
      const pin = suffix === 'low' ? record.low.maps[kind] : record.maps[kind];
      const file = suffix === 'low' ? pin.file : pin.url.slice(pin.url.lastIndexOf('/') + 1);
      return `${record.id}/${file}`;
    })),
    `sky/${variant.tier === 'low' ? sky.low.file.file : sky.file.url.slice(sky.file.url.lastIndexOf('/') + 1)}`,
  ].sort();
}

function capturePath(variant, pose) {
  return fileURLToPath(new URL(`reed-roof-${variant}-${pose}.png`, outputDirectory));
}

function matchedView(view) {
  const { date, place, position, yaw, pitch, backend, tier, sky: skyId,
    cssWidth, cssHeight, bufferWidth, bufferHeight } = view;
  return { date, place, position, yaw, pitch, backend, tier, sky: skyId,
    cssWidth, cssHeight, bufferWidth, bufferHeight };
}

async function comparePixels(control, candidate, pose) {
  const first = await sharp(capturePath(control, pose)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const second = await sharp(capturePath(candidate, pose)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual(first.info, second.info, `${pose}: image dimensions differ`);
  let changed = 0;
  let meaningfullyChanged = 0;
  let total = 0;
  let maximum = 0;
  for (let index = 0; index < first.data.length; index += 3) {
    let pixelMaximum = 0;
    for (let channel = 0; channel < 3; channel++) {
      const difference = Math.abs(first.data[index + channel] - second.data[index + channel]);
      pixelMaximum = Math.max(pixelMaximum, difference);
      total += difference;
    }
    if (pixelMaximum > 0) changed++;
    if (pixelMaximum >= 8) meaningfullyChanged++;
    maximum = Math.max(maximum, pixelMaximum);
  }
  const pixels = first.info.width * first.info.height;
  return {
    tier: control.startsWith('normal') ? 'Normal' : 'Low',
    pose,
    changedPercent: `${(100 * changed / pixels).toFixed(2)}%`,
    pixelsChangedAtLeast8: meaningfullyChanged,
    meanChannelDifference: (total / first.data.length).toFixed(2),
    maxChannelDifference: maximum,
  };
}

await mkdir(outputDirectory, { recursive: true });
const server = await preview({ logLevel: 'error', preview: { host: '127.0.0.1', port: 0, strictPort: true } });
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
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    const assetResponses = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(`Request failed: ${request.url()}`));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
      if (assetPath(response.url())) assetResponses.push(response);
    });
    try {
      await page.goto(`${origin}/?gl=1&metrics=1${variant.query}`);
      await page.getByRole('button', { name: 'Enter the room' }).click();
      const canvas = page.locator('#scene-frame canvas');

      async function waitForPose(date, place, after = -1) {
        await page.waitForFunction(({ date, place, after, variant }) => {
          const image = document.querySelector('#scene-frame canvas');
          return image?.dataset.backend === 'WebGL2 fallback'
            && image.dataset.tier === variant.tier
            && image.dataset.roof === variant.roof
            && image.dataset.date === date
            && image.dataset.place === place
            && image.dataset.moving === 'false'
            && image.dataset.dateTransition === 'false'
            && Number(image.dataset.frames) > after;
        }, { date, place, after, variant }, { timeout: 20_000 });
      }

      async function clickAndWait(selector, date, place) {
        const before = Number(await canvas.getAttribute('data-frames'));
        await page.locator(selector).click();
        await waitForPose(date, place, before);
      }

      await waitForPose('632', 'doorway');
      const views = {};
      for (const pose of poses) {
        if (pose.date !== await canvas.getAttribute('data-date')) {
          await clickAndWait(`[data-room-date="${pose.date}"]`, pose.date,
            await canvas.getAttribute('data-place'));
        }
        if (pose.place !== await canvas.getAttribute('data-place')) {
          await clickAndWait(`[data-room-place="${pose.place}"]`, pose.date, pose.place);
        }
        for (let index = 0; index < pose.upClicks; index++) {
          await clickAndWait('[data-look="up"]', pose.date, pose.place);
        }
        const view = await canvas.evaluate(image => {
          const rect = image.getBoundingClientRect();
          return {
            date: image.dataset.date, place: image.dataset.place,
            position: image.dataset.position, yaw: image.dataset.yaw, pitch: image.dataset.pitch,
            backend: image.dataset.backend, tier: image.dataset.tier, roof: image.dataset.roof,
            sky: image.dataset.sky, cssWidth: rect.width, cssHeight: rect.height,
            bufferWidth: image.width, bufferHeight: image.height,
            drawCalls: Number(image.dataset.drawCalls), triangles: Number(image.dataset.triangles),
            renderCalls: Number(image.dataset.renderCalls),
          };
        });
        assert.ok(Number(view.pitch) > 0.25, `${variant.name} ${pose.name}: ceiling pose was not reached`);
        assert.equal(view.sky, sky.id);
        assert.ok(Math.abs(view.bufferWidth / view.cssWidth - 1) < 0.02);
        await canvas.screenshot({ path: capturePath(variant.name, pose.name) });
        views[pose.name] = view;
      }

      const assets = await Promise.all(assetResponses.map(async response => {
        const { responseBodySize } = await response.request().sizes();
        assert.ok(responseBodySize > 0, `${variant.name}: empty asset ${response.url()}`);
        return { path: assetPath(response.url()), bytes: responseBodySize };
      }));
      assets.sort((a, b) => a.path.localeCompare(b.path));
      assert.deepEqual(assets.map(asset => asset.path), expectedAssets(variant),
        `${variant.name}: unexpected room assets`);
      assert.deepEqual(errors, [], `${variant.name}: browser errors`);
      return { variant: variant.name, views, assets, assetBodyBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0) };
    } finally {
      await context.close();
    }
  }

  const rows = [];
  for (const variant of variants) rows.push(await measure(variant));
  for (const [control, candidate] of [[rows[0], rows[1]], [rows[2], rows[3]]]) {
    for (const pose of poses) {
      assert.deepEqual(matchedView(candidate.views[pose.name]), matchedView(control.views[pose.name]),
        `${candidate.variant} ${pose.name}: camera or canvas differs from control`);
    }
    assert.equal(candidate.assets.length, control.assets.length + 3,
      `${candidate.variant}: expected three additional reed maps`);
  }
  console.log(`Chromium ${browser.version()}, ${viewport.width}×${viewport.height}, DPR 1, reduced motion, SwiftShader WebGL2 fallback`);
  console.table(rows.flatMap(row => poses.map(pose => ({
    variant: row.variant, pose: pose.name,
    buffer: `${row.views[pose.name].bufferWidth}×${row.views[pose.name].bufferHeight}`,
    drawCalls: row.views[pose.name].drawCalls,
    triangles: row.views[pose.name].triangles,
    renderCalls: row.views[pose.name].renderCalls,
  }))));
  console.table(rows.map(row => ({ variant: row.variant, assetBodyBytes: row.assetBodyBytes,
    assets: row.assets.length })));
  const differences = [];
  for (const pose of poses) {
    differences.push(await comparePixels('normal-plain', 'normal-reed', pose.name));
    differences.push(await comparePixels('low-plain', 'low-reed', pose.name));
  }
  console.table(differences);
  console.log('Twelve matched PNGs saved to docs/phase4/. Pixel differences are raw channel counts, not quality scores. HTTP body bytes exclude code and arrival media.');
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
