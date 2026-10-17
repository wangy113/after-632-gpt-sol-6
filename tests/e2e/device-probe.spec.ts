import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

type ProbeAction = {
  kind: string;
  target: string;
  status: string;
  firstFrameMs: number | null;
  settledMs: number | null;
  completedFrames: number;
};

type ProbeReport = {
  schemaVersion: number;
  capturedAt: string;
  measurement: string;
  snapshot: {
    url: string;
    backend: string;
    tier: string;
    aa: string;
    date: string;
    place: string;
    drawingBufferPixels: number;
  };
  actions: ProbeAction[];
  idleSamples: Array<{
    tier: string;
    date: string;
    place: string;
    sameCanvas: boolean;
    idleFrameDelta: number;
  }>;
  resources: { assets: Array<{ path: string }> };
};

test('the device recorder loads only for exact probe=1', async ({ page }) => {
  const probeRequests: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.includes('device-tier-probe')) probeRequests.push(request.url());
  });

  for (const query of ['?gl=1&metrics=1', '?gl=1&metrics=1&probe=0']) {
    await page.goto(`/${query}`);
    await expect(page.locator('#enter-room')).toBeVisible();
    await expect(page.locator('#tier-probe-panel')).toHaveCount(0);
    expect(await page.evaluate(() => '__after632TierProbe' in window)).toBe(false);
  }
  expect(probeRequests).toEqual([]);
});

test('Normal, Low, and Low FXAA export settled actions and a zero-frame idle sample', async ({ browser }) => {
  test.setTimeout(180_000);

  for (const { query, tier, aa, assetSuffix, skySuffix } of [
    { query: '', tier: 'baseline', aa: 'msaa', assetSuffix: '_1k.jpg', skySuffix: '_1k.hdr' },
    { query: '&tier=low', tier: 'low', aa: 'msaa', assetSuffix: '_512.webp', skySuffix: '_512.hdr' },
    { query: '&tier=low&aa=fxaa', tier: 'low', aa: 'fxaa', assetSuffix: '_512.webp', skySuffix: '_512.hdr' },
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'no-preference',
      acceptDownloads: true,
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    try {
      const page = await context.newPage();
      const pageErrors: string[] = [];
      const requestFailures: string[] = [];
      const httpErrors: string[] = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('requestfailed', request => requestFailures.push(request.url()));
      page.on('response', response => {
        if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
      });

      await page.goto(`/?gl=1&metrics=1&probe=1${query}`);
      await page.waitForFunction(() => typeof (window as Window & {
        __after632TierProbe?: { report?: () => unknown };
      }).__after632TierProbe?.report === 'function');
      await page.getByRole('button', { name: 'Enter the room' }).click();
      const canvas = page.locator('#scene-frame canvas');
      await expect(canvas).toHaveAttribute('data-tier', tier);
      await expect(canvas).toHaveAttribute('data-aa', aa);
      await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);
      await expect(page.locator('#tier-probe-panel')).toBeVisible();

      await page.locator('[data-room-date="661"]').click();
      await expect(canvas).toHaveAttribute('data-date', '661');
      await page.waitForFunction(() => {
        const report = (window as Window & { __after632TierProbe?: { report: () => ProbeReport } })
          .__after632TierProbe?.report();
        return report?.actions.some(action => action.kind === 'date change' && action.status === 'settled');
      });

      await page.locator('[data-room-place="head"]').click();
      await expect(canvas).toHaveAttribute('data-place', 'head');
      await page.waitForFunction(() => {
        const report = (window as Window & { __after632TierProbe?: { report: () => ProbeReport } })
          .__after632TierProbe?.report();
        return report?.actions.some(action => action.kind === 'place move' && action.status === 'settled');
      });

      await page.locator('#tier-probe-idle').click();
      await page.waitForFunction(() => {
        const report = (window as Window & { __after632TierProbe?: { report: () => ProbeReport } })
          .__after632TierProbe?.report();
        return report?.idleSamples.length === 1;
      });

      const downloadEvent = page.waitForEvent('download');
      await page.locator('#tier-probe-download').click();
      const download = await downloadEvent;
      expect(download.suggestedFilename()).toMatch(/\.json$/);
      const report = JSON.parse(await readFile(await download.path(), 'utf8')) as ProbeReport;

      expect(report.schemaVersion).toBe(1);
      expect(new Date(report.capturedAt).toISOString()).toBe(report.capturedAt);
      expect(report.measurement).toMatch(/not .*display|not .*GPU/i);
      expect(new URL(report.snapshot.url).searchParams.get('probe')).toBe('1');
      expect(report.snapshot.backend).toBe('WebGL2 fallback');
      expect(report.snapshot.tier).toBe(tier);
      expect(report.snapshot.aa).toBe(aa);
      expect(report.snapshot.date).toBe('661');
      expect(report.snapshot.place).toBe('head');
      expect(report.snapshot.drawingBufferPixels).toBeGreaterThan(0);

      for (const kind of ['room open', 'date change', 'place move']) {
        const action = report.actions.find(item => item.kind === kind);
        expect(action, `${tier}/${aa}: ${kind} missing`).toBeDefined();
        expect(action?.status).toBe('settled');
        expect(action?.completedFrames).toBeGreaterThan(0);
        expect(action?.firstFrameMs).not.toBeNull();
        expect(action?.settledMs).toBeGreaterThanOrEqual(action!.firstFrameMs!);
      }
      expect(report.idleSamples).toEqual([
        expect.objectContaining({
          tier,
          date: '661',
          place: 'head',
          sameCanvas: true,
          idleFrameDelta: 0,
        }),
      ]);

      const assets = report.resources.assets.map(asset => asset.path);
      expect(assets).toHaveLength(7);
      expect(assets.filter(path => path.endsWith(assetSuffix))).toHaveLength(6);
      expect(assets.filter(path => path.endsWith(skySuffix))).toHaveLength(1);
      expect(pageErrors).toEqual([]);
      expect(requestFailures).toEqual([]);
      expect(httpErrors).toEqual([]);

      if (tier === 'baseline') {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.locator('#tier-probe-idle').focus();
        await page.keyboard.press('Tab');
        await expect(page.locator('#tier-probe-copy')).toBeFocused();
        await page.keyboard.press('Space');
        await expect(page.locator('#tier-probe-status')).toContainText('copied as JSON');
        const copied = JSON.parse(await page.evaluate(() => navigator.clipboard.readText())) as ProbeReport;
        expect(copied.schemaVersion).toBe(1);
        expect(copied.snapshot.tier).toBe('baseline');
        expect(copied.actions.some(action => action.kind === 'place move' && action.status === 'settled')).toBe(true);
        await page.keyboard.press('Tab');
        await expect(page.locator('#tier-probe-download')).toBeFocused();

        const result = await new AxeBuilder({ page }).analyze();
        expect(result.violations.map(violation => violation.id)).toEqual([]);
      }
    } finally {
      await context.close();
    }
  }
});
