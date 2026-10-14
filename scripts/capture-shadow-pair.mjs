import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

const outputDirectory = fileURLToPath(new URL('../docs/phase0/', import.meta.url));
const server = await preview({
  logLevel: 'error',
  preview: { host: '127.0.0.1', port: 0, strictPort: true },
});
let browser;

try {
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Vite preview did not open a local port');
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  const captures = [];
  for (const shadows of [false, true]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    try {
      const url = new URL(`http://127.0.0.1:${address.port}/`);
      url.searchParams.set('gl', '1');
      url.searchParams.set('metrics', '1');
      url.searchParams.set('sky', 'qwantani_morning_puresky');
      if (shadows) url.searchParams.set('shadows', '1');
      await page.goto(url.href);
      if (new URL(page.url()).searchParams.get('shadows') !== (shadows ? '1' : null)) {
        throw new Error(`Unexpected shadow query flag for ${shadows ? 'on' : 'off'} capture`);
      }
      await page.getByRole('button', { name: 'Enter the room' }).click();
      const canvas = page.locator('#scene-frame canvas');

      async function waitForFrame(after) {
        await page.waitForFunction(previous => {
          const element = document.querySelector('#scene-frame canvas');
          return element?.dataset.backend === 'WebGL2 fallback'
            && element.dataset.sky === 'qwantani_morning_puresky'
            && element.dataset.date === '632'
            && element.dataset.place === 'doorway'
            && element.dataset.moving === 'false'
            && element.dataset.dateTransition === 'false'
            && element.width >= 864
            && Number(element.dataset.frames) > previous
            && Number(element.dataset.renderCalls) > 0;
        }, after, { timeout: 15_000 });
      }

      await waitForFrame(0);
      const beforeTurn = Number(await canvas.getAttribute('data-frames'));
      await page.locator('[data-look="right"]').click();
      await waitForFrame(beforeTurn);
      const beforeReturn = Number(await canvas.getAttribute('data-frames'));
      await page.locator('[data-look="left"]').click();
      await waitForFrame(beforeReturn);

      const pose = await canvas.evaluate(element => ({
        backend: element.dataset.backend,
        sky: element.dataset.sky,
        date: element.dataset.date,
        place: element.dataset.place,
        position: element.dataset.position,
        yaw: element.dataset.yaw,
        pitch: element.dataset.pitch,
        width: element.width,
        height: element.height,
      }));
      if (pose.position !== '0.000,1.600,0.500' || pose.yaw !== '0.000' || pose.pitch !== '-0.300') {
        throw new Error(`Doorway camera changed: ${JSON.stringify(pose)}`);
      }
      if (captures.length && JSON.stringify(pose) !== JSON.stringify(captures[0].pose)) {
        throw new Error(`Shadow pair poses differ: ${JSON.stringify(pose)}`);
      }
      const renderCalls = Number(await canvas.getAttribute('data-render-calls'));
      const png = await canvas.screenshot({ type: 'png' });
      if (errors.length) throw new Error(`Page errors for shadows ${shadows}: ${errors.join('; ')}`);
      captures.push({ shadows, pose, renderCalls, png });
    } finally {
      await page.close();
    }
  }

  if (captures[0].renderCalls !== 2 || captures[1].renderCalls !== 3) {
    throw new Error(`Expected one additional shadow render call; got ${captures.map(item => item.renderCalls).join(' / ')}`);
  }
  if (captures[0].png.equals(captures[1].png)) throw new Error('Shadow captures are identical');
  await mkdir(outputDirectory, { recursive: true });
  for (const capture of captures) {
    const filename = `632-doorway-shadow-${capture.shadows ? 'on' : 'off'}.png`;
    await writeFile(join(outputDirectory, filename), capture.png);
    console.log(`Captured ${filename}: ${JSON.stringify(capture.pose)}, render calls ${capture.renderCalls}`);
  }
  console.log(`Chromium ${browser.version()}, 1440×900 viewport, DPR 1, reduced motion, WebGL2 fallback via SwiftShader`);
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
