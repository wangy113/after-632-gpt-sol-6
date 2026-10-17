import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { preview } from 'vite';
import assetConfig from '../assets.config.json' with { type: 'json' };

// Run against a built dist/. Compare fixed prototype light with each sky's
// analyzed sun at matched camera poses. SwiftShader is a reproducible preview,
// not evidence about a physical device or a preferred default.
const viewport = { width: 1440, height: 900 };
const outputDirectory = new URL('../docs/phase4/', import.meta.url);
const skies = assetConfig.skies;
const textures = assetConfig.textures.filter(record =>
  record.role === 'room-walls' || record.role === 'room-floor');
assert.equal(skies.length, 2, 'Expected the two pinned sky candidates');
assert.equal(textures.length, 2, 'Expected the wall and floor records');

const variants = ['baseline', 'low'].flatMap(tier =>
  skies.flatMap(sky => ['fixed', 'sky'].map(light => ({
    name: `${tier === 'baseline' ? 'normal' : 'low'}-${sky.id}-${light}`,
    tier, sky, light,
  }))));
const poses = [
  { name: '632-doorway', date: '632', place: 'doorway' },
  { name: '680-yard', date: '680', place: 'yard' },
];

function assetPath(url) {
  const marker = '/assets/polyhaven/';
  const pathname = new URL(url).pathname;
  const index = pathname.indexOf(marker);
  return index < 0 ? null : pathname.slice(index + marker.length);
}

function expectedAssets(variant) {
  const low = variant.tier === 'low';
  return [
    ...textures.flatMap(texture => ['Diffuse', 'nor_gl', 'arm'].map(kind => {
      const pin = low ? texture.low.maps[kind] : texture.maps[kind];
      const file = low ? pin.file : pin.url.slice(pin.url.lastIndexOf('/') + 1);
      return `${texture.id}/${file}`;
    })),
    `sky/${low ? variant.sky.low.file.file : variant.sky.file.url.slice(variant.sky.file.url.lastIndexOf('/') + 1)}`,
  ].sort();
}

function capturePath(variant, pose) {
  return fileURLToPath(new URL(`sky-light-${variant.name}-${pose.name}.png`, outputDirectory));
}

function matchedView(view) {
  const { date, place, position, yaw, pitch, backend, tier, sky,
    cssWidth, cssHeight, bufferWidth, bufferHeight } = view;
  return { date, place, position, yaw, pitch, backend, tier, sky,
    cssWidth, cssHeight, bufferWidth, bufferHeight };
}

async function pixelDifference(control, candidate, pose) {
  const first = await sharp(capturePath(control, pose)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const second = await sharp(capturePath(candidate, pose)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual(first.info, second.info, `${candidate.name} ${pose.name}: image dimensions differ`);
  let changedPixels = 0;
  let changedAtLeast8 = 0;
  let channelDifference = 0;
  let maximum = 0;
  for (let index = 0; index < first.data.length; index += 3) {
    let pixelMaximum = 0;
    for (let channel = 0; channel < 3; channel++) {
      const difference = Math.abs(first.data[index + channel] - second.data[index + channel]);
      pixelMaximum = Math.max(pixelMaximum, difference);
      maximum = Math.max(maximum, difference);
      channelDifference += difference;
    }
    if (pixelMaximum > 0) changedPixels++;
    if (pixelMaximum >= 8) changedAtLeast8++;
  }
  assert.ok(changedAtLeast8 > 0, `${candidate.name} ${pose.name}: lighting did not visibly change`);
  return {
    tier: candidate.tier, sky: candidate.sky.id, pose: pose.name,
    changedPercent: `${(100 * changedPixels / (first.info.width * first.info.height)).toFixed(2)}%`,
    pixelsChangedAtLeast8: changedAtLeast8,
    meanChannelDifference: (channelDifference / first.data.length).toFixed(2),
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

  async function capture(variant) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    const responses = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(`Request failed: ${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
      if (assetPath(response.url())) responses.push(response);
    });
    try {
      await page.goto(`${origin}/?gl=1&metrics=1&shadows=1&sky=${variant.sky.id}&light=${variant.light}${variant.tier === 'low' ? '&tier=low' : ''}`);
      assert.equal(responses.length, 0, 'Room assets should wait for entry');
      await page.getByRole('button', { name: 'Enter the room' }).click();
      const canvas = page.locator('#scene-frame canvas');

      async function waitForPose(date, place, after = -1) {
        await page.waitForFunction(({ date, place, after, variant }) => {
          const image = document.querySelector('#scene-frame canvas');
          return image?.dataset.backend === 'WebGL2 fallback'
            && image.dataset.tier === variant.tier
            && image.dataset.sky === variant.sky.id
            && image.dataset.light === variant.light
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

      const views = {};
      await waitForPose('632', 'doorway');
      for (const pose of poses) {
        if (pose.date !== await canvas.getAttribute('data-date')) {
          await clickAndWait(`[data-room-date="${pose.date}"]`, pose.date, await canvas.getAttribute('data-place'));
        }
        if (pose.place !== await canvas.getAttribute('data-place')) {
          await clickAndWait(`[data-room-place="${pose.place}"]`, pose.date, pose.place);
        }
        const view = await canvas.evaluate(image => {
          const rect = image.getBoundingClientRect();
          return {
            date: image.dataset.date, place: image.dataset.place,
            position: image.dataset.position, yaw: image.dataset.yaw, pitch: image.dataset.pitch,
            backend: image.dataset.backend, tier: image.dataset.tier,
            sky: image.dataset.sky, light: image.dataset.light,
            cssWidth: rect.width, cssHeight: rect.height,
            bufferWidth: image.width, bufferHeight: image.height,
            drawCalls: Number(image.dataset.drawCalls), triangles: Number(image.dataset.triangles),
            renderCalls: Number(image.dataset.renderCalls),
          };
        });
        assert.ok(view.drawCalls > 0 && view.triangles > 0, `${variant.name} ${pose.name}: no geometry rendered`);
        assert.ok(view.renderCalls > 2, `${variant.name} ${pose.name}: diagnostic shadow pass missing`);
        await canvas.screenshot({ path: capturePath(variant, pose) });
        views[pose.name] = view;
      }

      const assets = await Promise.all(responses.map(async response => {
        const { responseBodySize } = await response.request().sizes();
        assert.ok(responseBodySize > 0, `${variant.name}: empty asset ${response.url()}`);
        return { path: assetPath(response.url()), bytes: responseBodySize };
      }));
      assets.sort((a, b) => a.path.localeCompare(b.path));
      assert.deepEqual(assets.map(asset => asset.path), expectedAssets(variant),
        `${variant.name}: unexpected room assets`);
      assert.deepEqual(errors, [], `${variant.name}: browser errors`);
      return { ...variant, views, assetCount: assets.length,
        assetBodyBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0) };
    } finally {
      await context.close();
    }
  }

  const rows = [];
  for (const variant of variants) rows.push(await capture(variant));
  const differences = [];
  for (const sky of skies) {
    for (const tier of ['baseline', 'low']) {
      const control = rows.find(row => row.sky.id === sky.id && row.tier === tier && row.light === 'fixed');
      const candidate = rows.find(row => row.sky.id === sky.id && row.tier === tier && row.light === 'sky');
      assert.ok(control && candidate);
      assert.equal(control.assetCount, 7);
      assert.equal(candidate.assetCount, 7);
      assert.equal(candidate.assetBodyBytes, control.assetBodyBytes,
        `${candidate.name}: light preview changed transferred room bytes`);
      for (const pose of poses) {
        assert.deepEqual(matchedView(candidate.views[pose.name]), matchedView(control.views[pose.name]),
          `${candidate.name} ${pose.name}: viewpoint or drawing buffer changed`);
        differences.push(await pixelDifference(control, candidate, pose));
      }
    }
  }
  console.log(`Chromium ${browser.version()}, ${viewport.width}×${viewport.height}, DPR 1, reduced motion, SwiftShader WebGL2 fallback, diagnostic shadows`);
  console.table(rows.map(row => ({ variant: row.name, assets: row.assetCount, bodyBytes: row.assetBodyBytes,
    doorwayDrawCalls: row.views['632-doorway'].drawCalls,
    yardDrawCalls: row.views['680-yard'].drawCalls })));
  console.table(differences);
  console.log('Sixteen matched PNGs saved to docs/phase4/. Pixel differences are raw channel counts, not quality scores. HTTP body bytes exclude code and arrival media.');
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
