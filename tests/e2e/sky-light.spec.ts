import { expect, test } from '@playwright/test';

const morningSky = 'qwantani_morning_puresky';
const laterSky = 'qwantani_mid_morning_puresky';
const mapKinds = ['diff', 'nor_gl', 'arm'];

function assetPath(url: string): string | null {
  const marker = '/assets/polyhaven/';
  const pathname = new URL(url).pathname;
  const index = pathname.indexOf(marker);
  return index < 0 ? null : pathname.slice(index + marker.length);
}

function expectedAssets(tier: 'baseline' | 'low', skyId: string): string[] {
  const suffix = tier === 'low' ? '512.webp' : '1k.jpg';
  return [
    ...['clay_plaster', 'clay_floor_001'].flatMap(id =>
      mapKinds.map(kind => `${id}/${id}_${kind}_${suffix}`)),
    `sky/${skyId}_${tier === 'low' ? '512' : '1k'}.hdr`,
  ].sort();
}

test('only exact light=sky changes the lighting while preserving the seven tier-matched assets', async ({ browser }) => {
  test.setTimeout(210_000);
  const doorwayCaptures = new Map<string, Buffer>();
  for (const { query, tier, light, skyId } of [
    { query: '', tier: 'baseline', light: 'fixed', skyId: morningSky },
    { query: '&light=unknown', tier: 'baseline', light: 'fixed', skyId: morningSky },
    { query: '&light=Sky', tier: 'baseline', light: 'fixed', skyId: morningSky },
    { query: '&light=sky', tier: 'baseline', light: 'sky', skyId: morningSky },
    { query: `&light=sky&sky=${laterSky}`, tier: 'baseline', light: 'sky', skyId: laterSky },
    { query: '&light=sky&tier=low', tier: 'low', light: 'sky', skyId: morningSky },
    { query: `&light=sky&tier=low&sky=${laterSky}`, tier: 'low', light: 'sky', skyId: laterSky },
  ] as const) {
    // Separate contexts make the seven responses real loads instead of cache hits.
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      const assets: { path: string; status: number }[] = [];
      const failures: string[] = [];
      const pageErrors: string[] = [];
      page.on('response', response => {
        const path = assetPath(response.url());
        if (path) assets.push({ path, status: response.status() });
      });
      page.on('requestfailed', request => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(`/?gl=1&shadows=1${query}`);
      expect(assets).toEqual([]);
      await page.getByRole('button', { name: 'Enter the room' }).click();
      const canvas = page.locator('#scene-frame canvas');
      await expect(canvas).toHaveAttribute('data-backend', 'WebGL2 fallback');
      await expect(canvas).toHaveAttribute('data-tier', tier);
      await expect(canvas).toHaveAttribute('data-light', light);
      await expect(canvas).toHaveAttribute('data-sky', skyId);
      await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);
      expect(assets.map(asset => asset.path).sort()).toEqual(expectedAssets(tier, skyId));
      expect(assets.every(asset => asset.status === 200)).toBe(true);
      if (query === '' || query === '&light=sky') {
        doorwayCaptures.set(light, await canvas.screenshot({ type: 'png' }));
      }
      if (query === `&light=sky&tier=low&sky=${laterSky}`) {
        await page.locator('[data-room-date="680"]').click();
        await expect(canvas).toHaveAttribute('data-date', '680');
        await page.locator('[data-room-place="yard"]').click();
        await expect(canvas).toHaveAttribute('data-place', 'yard');
        await expect(canvas).toHaveAttribute('data-light', 'sky');
        await page.locator('[data-graphics-choice="room"] [data-graphics-tier="baseline"]').check();
        await expect(canvas).toHaveAttribute('data-tier', 'baseline');
        await expect(canvas).toHaveAttribute('data-light', 'sky');
        await expect(canvas).toHaveAttribute('data-date', '680');
        await expect(canvas).toHaveAttribute('data-place', 'yard');
        await expect(canvas).toHaveCount(1);
        const address = new URL(page.url());
        expect(address.searchParams.get('light')).toBe('sky');
        expect(address.searchParams.get('sky')).toBe(laterSky);
        expect(address.searchParams.has('tier')).toBe(false);
      }
      expect(failures).toEqual([]);
      expect(pageErrors).toEqual([]);
    } finally {
      await context.close();
    }
  }
  expect(doorwayCaptures.get('fixed')!.equals(doorwayCaptures.get('sky')!)).toBe(false);
});
