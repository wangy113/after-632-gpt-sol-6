import { chromium } from '@playwright/test';
import { preview } from 'vite';

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
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await page.goto(`http://127.0.0.1:${address.port}/?gl=1&metrics=1`);
  await page.getByRole('button', { name: 'Enter the room' }).click();
  const canvas = page.locator('#scene-frame canvas');

  async function frameCount() {
    return Number(await canvas.getAttribute('data-frames'));
  }

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
        && Number(element.dataset.triangles) > 0;
    }, { date, place, after }, { timeout: 15_000 });
  }

  async function clickAndWait(selector, date, place) {
    const before = await frameCount();
    await page.locator(selector).click();
    await waitForFrame(date, place, before);
  }

  async function sample(date, place) {
    const startingYaw = await canvas.getAttribute('data-yaw');
    await clickAndWait('[data-look="right"]', date, place);
    await clickAndWait('[data-look="left"]', date, place);
    const result = await canvas.evaluate(element => ({
      date: element.dataset.date,
      place: element.dataset.place,
      position: element.dataset.position,
      yaw: element.dataset.yaw,
      pitch: element.dataset.pitch,
      buffer: `${element.width}×${element.height}`,
      drawCalls: Number(element.dataset.drawCalls),
      triangles: Number(element.dataset.triangles),
      renderCalls: Number(element.dataset.renderCalls),
    }));
    if (result.yaw !== startingYaw) throw new Error(`Camera yaw changed at ${date} ${place}`);
    return result;
  }

  const rows = [];
  await waitForFrame('632', 'doorway');
  for (const date of ['632', '661', '680']) {
    if (date !== '632') await clickAndWait(`[data-room-date="${date}"]`, date, 'yard');
    if (date !== '632') await clickAndWait('[data-room-place="doorway"]', date, 'doorway');
    rows.push(await sample(date, 'doorway'));
    await clickAndWait('[data-room-place="yard"]', date, 'yard');
    rows.push(await sample(date, 'yard'));
  }
  console.log(`Chromium ${browser.version()}, 1440×900 viewport, DPR 1, reduced motion, WebGL2 fallback via SwiftShader`);
  console.table(rows);
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
