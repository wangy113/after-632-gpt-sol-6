import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import assetConfig from '../assets.config.json' with { type: 'json' };

const outputDirectory = fileURLToPath(new URL('../docs/phase0/', import.meta.url));
const server = await createServer({ logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser;

try {
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('Vite did not open a local port');

  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  await mkdir(outputDirectory, { recursive: true });
  let referencePose;

  for (const sky of assetConfig.skies) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    page.on('pageerror', error => console.error(`Page error for ${sky.id}: ${error.message}`));
    page.on('requestfailed', request => console.error(`Request failed for ${sky.id}: ${request.url()} (${request.failure()?.errorText})`));
    try {
      await page.goto(`http://127.0.0.1:${address.port}/?gl=1&sky=${sky.id}`);
      await page.getByRole('button', { name: 'Enter the room' }).click();
      try {
        await page.waitForFunction(id => {
          const canvas = document.querySelector('#scene-frame canvas');
          return canvas?.dataset.backend === 'WebGL2 fallback'
            && canvas.dataset.sky === id
            && canvas.dataset.date === '632'
            && canvas.dataset.place === 'doorway'
            && canvas.width >= 864
            && Number(canvas.dataset.frames) >= 1;
        }, sky.id);
      } catch (error) {
        console.error(`Room status for ${sky.id}: ${await page.locator('#scene-status').textContent()}`);
        console.error(`Canvas state for ${sky.id}: ${JSON.stringify(await page.locator('#scene-frame canvas').evaluateAll(canvases => canvases.map(canvas => ({ ...canvas.dataset, width: canvas.width, height: canvas.height }))))}`);
        throw error;
      }
      await page.locator('[data-room-place="yard"]').click();
      await page.waitForFunction(() => {
        const canvas = document.querySelector('#scene-frame canvas');
        return canvas?.dataset.place === 'yard'
          && canvas.dataset.moving === 'false'
          && canvas.dataset.position === '0.000,1.600,4.400';
      });

      const canvas = page.locator('#scene-frame canvas');
      const startingFrame = Number(await canvas.getAttribute('data-frames'));
      await page.locator('#scene-frame').focus();
      for (let index = 0; index < 4; index++) await page.locator('#scene-frame').press('ArrowUp');
      await page.waitForFunction(before => {
        const image = document.querySelector('#scene-frame canvas');
        return image?.dataset.pitch === '0.360' && Number(image.dataset.frames) > before;
      }, startingFrame);

      const pose = await canvas.evaluate(image => ({
        backend: image.dataset.backend,
        date: image.dataset.date,
        place: image.dataset.place,
        position: image.dataset.position,
        yaw: image.dataset.yaw,
        pitch: image.dataset.pitch,
        width: image.width,
        height: image.height,
      }));
      if (referencePose && JSON.stringify(pose) !== JSON.stringify(referencePose)) {
        throw new Error(`Sky capture pose changed: ${JSON.stringify(pose)}`);
      }
      referencePose = pose;
      const filename = `sky-${sky.id}.png`;
      await writeFile(join(outputDirectory, filename), await canvas.screenshot({ type: 'png' }));
      console.log(`Captured ${filename}: ${JSON.stringify(pose)}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser?.close();
  await server.close();
}
