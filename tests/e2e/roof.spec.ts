import { expect, test } from '@playwright/test';

const mapKinds = ['diff', 'nor_gl', 'arm'];
const roofId = 'reed_roof_04';

function assetPath(url: string): string | null {
  const marker = '/assets/polyhaven/';
  const pathname = new URL(url).pathname;
  const index = pathname.indexOf(marker);
  return index < 0 ? null : pathname.slice(index + marker.length);
}

function expectedAssets(tier: 'baseline' | 'low', reed: boolean): string[] {
  const suffix = tier === 'low' ? '512.webp' : '1k.jpg';
  const ids = ['clay_plaster', 'clay_floor_001', ...(reed ? [roofId] : [])];
  return [
    ...ids.flatMap(id => mapKinds.map(kind => `${id}/${id}_${kind}_${suffix}`)),
    `sky/qwantani_morning_puresky_${tier === 'low' ? '512' : '1k'}.hdr`,
  ].sort();
}

test('only exact roof=reed loads the tier-matched underside maps and changes the ceiling', async ({ browser }) => {
  test.setTimeout(150_000);
  const captures = new Map<string, Buffer>();
  for (const { query, tier, roof } of [
    { query: '', tier: 'baseline', roof: 'plain' },
    { query: '&roof=unknown', tier: 'baseline', roof: 'plain' },
    { query: '&roof=Reed', tier: 'baseline', roof: 'plain' },
    { query: '&roof=reed', tier: 'baseline', roof: 'reed' },
    { query: '&tier=low&roof=reed', tier: 'low', roof: 'reed' },
  ] as const) {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      const assets: { path: string; status: number }[] = [];
      const requestFailures: string[] = [];
      const pageErrors: string[] = [];
      page.on('response', response => {
        const path = assetPath(response.url());
        if (path) assets.push({ path, status: response.status() });
      });
      page.on('requestfailed', request => requestFailures.push(`${request.url()}: ${request.failure()?.errorText}`));
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(`/?gl=1${query}`);
      expect(assets).toEqual([]);
      await page.getByRole('button', { name: 'Enter the room' }).click();
      const canvas = page.locator('#scene-frame canvas');
      await expect(canvas).toHaveAttribute('data-backend', 'WebGL2 fallback');
      await expect(canvas).toHaveAttribute('data-tier', tier);
      await expect(canvas).toHaveAttribute('data-roof', roof);
      await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);
      expect(assets.map(asset => asset.path).sort()).toEqual(expectedAssets(tier, roof === 'reed'));
      expect(assets.every(asset => asset.status === 200)).toBe(true);

      // Look at the same fixed ceiling pose, where the underside is visible.
      for (let step = 0; step < 6; step += 1) await page.locator('[data-look="up"]').click();
      await expect(canvas).toHaveAttribute('data-pitch', '0.420');
      await expect.poll(async () => Number(await canvas.getAttribute('data-frames'))).toBeGreaterThan(1);
      if (query === '' || query === '&roof=reed') {
        captures.set(roof, await canvas.screenshot({ type: 'png' }));
      }
      expect(requestFailures).toEqual([]);
      expect(pageErrors).toEqual([]);
    } finally {
      await context.close();
    }
  }
  expect(captures.get('plain')!.equals(captures.get('reed')!)).toBe(false);
});

test('the reed preview retains date, place, idle, and return cleanup behavior', async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/?gl=1&tier=low&roof=reed');
  await page.getByRole('button', { name: 'Enter the room' }).click();
  const canvas = page.locator('#scene-frame canvas');
  await expect(canvas).toHaveAttribute('data-roof', 'reed');
  await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);

  await page.locator('[data-room-date="661"]').click();
  await expect(canvas).toHaveAttribute('data-date', '661');
  await page.locator('[data-room-place="head"]').click();
  await expect(canvas).toHaveAttribute('data-place', 'head');
  await page.locator('[data-room-date="680"]').click();
  await expect(canvas).toHaveAttribute('data-date', '680');
  await expect(canvas).toHaveAttribute('data-roof', 'reed');
  await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);

  await page.locator('[data-graphics-choice="room"] [data-graphics-tier="baseline"]').check();
  await expect(canvas).toHaveAttribute('data-tier', 'baseline');
  await expect(canvas).toHaveAttribute('data-roof', 'reed');
  await expect(canvas).toHaveAttribute('data-date', '680');
  await expect(canvas).toHaveAttribute('data-place', 'head');
  await expect(canvas).toHaveCount(1);
  const address = new URL(page.url());
  expect(address.searchParams.get('roof')).toBe('reed');
  expect(address.searchParams.has('tier')).toBe(false);

  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const frames = await canvas.getAttribute('data-frames');
  await page.waitForTimeout(300);
  await expect(canvas).toHaveAttribute('data-frames', frames!);
  await page.getByRole('button', { name: 'Return to reading' }).click();
  await expect(canvas).toHaveCount(0);
  await expect(page.locator('#reading-title')).toBeFocused();
  expect(pageErrors).toEqual([]);
});

test('a failed reed map leaves no partial room and restores the entry control', async ({ page }) => {
  await page.route('**/assets/polyhaven/reed_roof_04/reed_roof_04_nor_gl_1k.jpg', route => {
    route.fulfill({ status: 404, body: '' });
  });
  await page.goto('/?gl=1&roof=reed');
  const enter = page.locator('#enter-room');
  await enter.click();
  await expect(page.locator('#scene-frame canvas')).toHaveCount(0);
  await expect(enter).toBeEnabled();
  await expect(enter).toBeFocused();
});
