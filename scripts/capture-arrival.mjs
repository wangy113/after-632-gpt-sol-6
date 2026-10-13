import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const output = fileURLToPath(new URL('../public/stills/632-arrival.webp', import.meta.url));
const server = await createServer({
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0 },
});
let browser;

try {
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('Vite did not open a local port');

  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`http://127.0.0.1:${address.port}/?gl=1`);
  await page.getByRole('button', { name: 'Enter the room' }).click();
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#scene-frame canvas');
    return canvas?.dataset.backend === 'WebGL2 fallback'
      && canvas.dataset.sky === 'qwantani_morning_puresky'
      && canvas.dataset.date === '632'
      && canvas.dataset.place === 'doorway'
      && canvas.width >= 864
      && Number(canvas.dataset.frames) >= 1;
  });

  // Capture the composited canvas: WebGL does not preserve its drawing buffer for toDataURL.
  const png = await page.locator('#scene-frame canvas').screenshot({ type: 'png' });
  const webp = await page.evaluate(async base64 => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d').drawImage(image, 0, 0);
    const dataUrl = canvas.toDataURL('image/webp', 0.82);
    if (!dataUrl.startsWith('data:image/webp;base64,')) throw new Error('WebP encoding is unavailable');
    return dataUrl.split(',')[1];
  }, png.toString('base64'));

  await mkdir(fileURLToPath(new URL('../public/stills/', import.meta.url)), { recursive: true });
  await writeFile(output, Buffer.from(webp, 'base64'));
  process.stdout.write(`Captured 632 doorway still at ${output}\n`);
} finally {
  await browser?.close();
  await server.close();
}
