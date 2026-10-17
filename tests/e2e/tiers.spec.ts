import { expect, test } from '@playwright/test';

const textureIds = ['clay_plaster', 'clay_floor_001'];
const mapKinds = ['diff', 'nor_gl', 'arm'];
const morningSky = 'qwantani_morning_puresky';
const alternateSky = 'qwantani_mid_morning_puresky';

function assetPath(url: string): string | null {
  const pathname = new URL(url).pathname;
  const marker = '/assets/polyhaven/';
  const index = pathname.indexOf(marker);
  return index < 0 ? null : pathname.slice(index + marker.length);
}

function expectedAssets(tier: 'baseline' | 'low', skyId: string, fullSky = false): string[] {
  const suffix = tier === 'low' ? '512.webp' : '1k.jpg';
  return [
    ...textureIds.flatMap(id => mapKinds.map(kind => `${id}/${id}_${kind}_${suffix}`)),
    `sky/${skyId}_${tier === 'low' && !fullSky ? '512' : '1k'}.hdr`,
  ].sort();
}

test('the explicit Low preview selects smaller maps and sky at DPR 1', async ({ browser }) => {
  const samples = [];
  for (const [query, tier, pixelRatio, skyId, fullSky] of [
    ['', 'baseline', 1.5, morningSky, false],
    ['&tier=low', 'low', 1, morningSky, false],
    ['&tier=low&skyResolution=1k', 'low', 1, morningSky, true],
    ['&tier=unknown', 'baseline', 1.5, morningSky, false],
    [`&sky=${alternateSky}`, 'baseline', 1.5, alternateSky, false],
    [`&tier=low&sky=${alternateSky}`, 'low', 1, alternateSky, false],
  ] as const) {
    // Each visit gets a fresh cache so the request list describes an actual load.
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      const responses: { path: string; status: number }[] = [];
      const requestFailures: string[] = [];
      const pageErrors: string[] = [];
      page.on('response', response => {
        const path = assetPath(response.url());
        if (path) responses.push({ path, status: response.status() });
      });
      page.on('requestfailed', request => requestFailures.push(`${request.url()}: ${request.failure()?.errorText}`));
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(`/?gl=1&metrics=1${query}`);
      await page.getByRole('button', { name: 'Enter the room' }).click();
      const canvas = page.locator('#scene-frame canvas');
      await expect(canvas).toHaveAttribute('data-backend', 'WebGL2 fallback');
      await expect(canvas).toHaveAttribute('data-tier', tier);
      await expect(canvas).toHaveAttribute('data-sky', skyId);
      await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);
      const sample = await canvas.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return {
          cssWidth: rect.width,
          cssHeight: rect.height,
          width: element.width,
          height: element.height,
          drawCalls: Number(element.dataset.drawCalls),
          triangles: Number(element.dataset.triangles),
          renderCalls: Number(element.dataset.renderCalls),
        };
      });
      expect(sample.cssWidth).toBeGreaterThan(0);
      expect(sample.cssHeight).toBeGreaterThan(0);
      expect(Math.abs(sample.width - sample.cssWidth * pixelRatio)).toBeLessThanOrEqual(2);
      expect(Math.abs(sample.height - sample.cssHeight * pixelRatio)).toBeLessThanOrEqual(2);
      expect(sample.drawCalls).toBeGreaterThan(0);
      expect(sample.triangles).toBeGreaterThan(0);
      expect(sample.renderCalls).toBe(2);
      samples.push(sample);
      expect(responses.map(response => response.path).sort()).toEqual(expectedAssets(tier, skyId, fullSky));
      expect(responses.every(response => response.status === 200)).toBe(true);
      expect(requestFailures).toEqual([]);
      expect(pageErrors).toEqual([]);
    } finally {
      await context.close();
    }
  }
  expect(samples[0].width * samples[0].height).toBeGreaterThan(samples[1].width * samples[1].height * 2.2);
  expect(samples[3].width).toBe(samples[0].width);
  expect(samples[3].height).toBe(samples[0].height);
});

test('only the exact Low antialiasing diagnostics change the render path', async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const captures = new Map<string, Buffer>();
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  for (const { query, tier, aa } of [
    { query: 'tier=low', tier: 'low', aa: 'msaa' },
    { query: 'tier=low&aa=off', tier: 'low', aa: 'off' },
    { query: 'tier=low&aa=fxaa', tier: 'low', aa: 'fxaa' },
    { query: 'tier=low&aa=FXAA', tier: 'low', aa: 'msaa' },
    { query: 'aa=fxaa', tier: 'baseline', aa: 'msaa' },
  ]) {
    await page.goto(`/?gl=1&metrics=1&${query}`);
    await page.getByRole('button', { name: 'Enter the room' }).click();
    const canvas = page.locator('#scene-frame canvas');
    await expect(canvas).toHaveAttribute('data-backend', 'WebGL2 fallback');
    await expect(canvas).toHaveAttribute('data-tier', tier);
    await expect(canvas).toHaveAttribute('data-aa', aa);
    await expect(canvas).toHaveAttribute('data-date', '632');
    await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);
    if (aa === 'off' || aa === 'fxaa') captures.set(aa, await canvas.screenshot({ type: 'png' }));
  }

  expect(captures.get('off')!.equals(captures.get('fxaa')!)).toBe(false);
  expect(pageErrors).toEqual([]);
});

test('Low FXAA redraws through date, place, Compare, resize, and a graphics change', async ({ browser }) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: 'no-preference',
  });
  try {
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto('/?gl=1&metrics=1&tier=low&aa=fxaa');
    await page.getByRole('button', { name: 'Enter the room' }).click();
    const canvas = page.locator('#scene-frame canvas');
    await expect(canvas).toHaveAttribute('data-aa', 'fxaa');
    await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);

    const transitionStarted = await page.locator('[data-room-date="661"]').evaluate((button: HTMLButtonElement) => {
      button.click();
      return document.querySelector<HTMLCanvasElement>('#scene-frame canvas')?.dataset.dateTransition;
    });
    expect(transitionStarted).toBe('true');
    await expect(canvas).toHaveAttribute('data-date-transition', 'false', { timeout: 4_000 });
    await expect(canvas).toHaveAttribute('data-date', '661');
    await page.locator('[data-room-place="head"]').click();
    await expect(canvas).toHaveAttribute('data-moving', 'false', { timeout: 4_000 });
    await expect(canvas).toHaveAttribute('data-place', 'head');

    await page.locator('[data-room-date="680"]').click();
    await expect(canvas).toHaveAttribute('data-date-transition', 'false', { timeout: 4_000 });
    const compare = page.locator('#compare-toggle');
    await compare.click();
    await expect(canvas).toHaveAttribute('data-date', '661');
    await expect(canvas).toHaveAttribute('data-place', 'head');
    await expect(page.locator('[data-room-date="680"]')).toHaveAttribute('aria-pressed', 'true');
    await compare.click();
    await expect(canvas).toHaveAttribute('data-date', '680');

    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const stillFrames = await canvas.getAttribute('data-frames');
    const wideCssWidth = await canvas.evaluate(element => element.getBoundingClientRect().width);
    await page.waitForTimeout(300);
    await expect(canvas).toHaveAttribute('data-frames', stillFrames!);
    await page.setViewportSize({ width: 600, height: 700 });
    await expect.poll(async () => canvas.evaluate(element => element.getBoundingClientRect().width)).toBeLessThan(wideCssWidth);
    await expect.poll(async () => canvas.evaluate((element: HTMLCanvasElement) => {
      const width = element.getBoundingClientRect().width;
      return Math.abs(element.width - width);
    })).toBeLessThanOrEqual(2);
    await expect.poll(async () => Number(await canvas.getAttribute('data-frames'))).toBeGreaterThan(Number(stillFrames));
    await compare.click();
    await expect(canvas).toHaveAttribute('data-date', '661');
    await compare.click();
    await expect(canvas).toHaveAttribute('data-date', '680');

    const originalCanvas = await canvas.elementHandle();
    const normal = page.locator('[data-graphics-choice="room"] [data-graphics-tier="baseline"]');
    await normal.check();
    await expect(canvas).toHaveAttribute('data-tier', 'baseline');
    await expect(canvas).toHaveAttribute('data-aa', 'msaa');
    await expect(canvas).toHaveAttribute('data-date', '680');
    await expect(canvas).toHaveAttribute('data-place', 'head');
    expect(await originalCanvas!.evaluate(element => element.isConnected)).toBe(false);
    expect(new URL(page.url()).searchParams.has('aa')).toBe(false);
    await expect(normal).toBeFocused();
    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('the Low preview keeps date, movement, keyboard look, idle, and room cleanup working', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: 'no-preference',
  });
  try {
    const page = await context.newPage();
    await page.goto('/?gl=1&metrics=1&tier=low');
    await page.getByRole('button', { name: 'Enter the room' }).click();
    const canvas = page.locator('#scene-frame canvas');
    await expect(canvas).toHaveAttribute('data-tier', 'low');
    await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);

    const started = await page.locator('[data-room-date="661"]').evaluate((button: HTMLButtonElement) => {
      button.click();
      return document.querySelector<HTMLCanvasElement>('#scene-frame canvas')?.dataset.dateTransition;
    });
    expect(started).toBe('true');
    await expect(canvas).toHaveAttribute('data-date', '661');
    await expect(canvas).toHaveAttribute('data-date-transition', 'false', { timeout: 4_000 });

    await page.locator('[data-room-place="head"]').click();
    await expect(canvas).toHaveAttribute('data-place', 'head');
    await expect(canvas).toHaveAttribute('data-moving', 'false', { timeout: 4_000 });
    const yaw = await canvas.getAttribute('data-yaw');
    await page.locator('#scene-frame').focus();
    await page.keyboard.press('ArrowRight');
    await expect(canvas).not.toHaveAttribute('data-yaw', yaw!);

    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const frames = await canvas.getAttribute('data-frames');
    await page.waitForTimeout(300);
    await expect(canvas).toHaveAttribute('data-frames', frames!);

    await page.getByRole('button', { name: 'Return to reading' }).click();
    await expect(canvas).toHaveCount(0);
    await expect(page.locator('#reading-title')).toBeFocused();
  } finally {
    await context.close();
  }
});

test('the reading graphics choice selects Low with the keyboard before loading 3D', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  try {
    const page = await context.newPage();
    const assets: { path: string; status: number }[] = [];
    page.on('response', response => {
      const path = assetPath(response.url());
      if (path) assets.push({ path, status: response.status() });
    });
    await page.goto(`/?gl=1&metrics=1&sky=${alternateSky}&keep=1#reading`);
    const intro = page.locator('[data-graphics-choice="intro"]');
    const normal = intro.locator('[data-graphics-tier="baseline"]');
    const low = intro.locator('[data-graphics-tier="low"]');
    await expect(normal).toBeChecked();
    await expect(low).not.toBeChecked();
    await expect(page.locator('#scene-frame canvas')).toHaveCount(0);

    await normal.focus();
    await page.keyboard.press('ArrowRight');
    await expect(low).toBeFocused();
    await expect(low).toBeChecked();
    await expect(page.locator('[data-graphics-choice="room"] [data-graphics-tier="low"]')).toBeChecked();
    const chosenURL = new URL(page.url());
    expect(chosenURL.searchParams.get('tier')).toBe('low');
    expect(chosenURL.searchParams.get('sky')).toBe(alternateSky);
    expect(chosenURL.searchParams.get('keep')).toBe('1');
    expect(chosenURL.hash).toBe('#reading');

    await page.getByRole('button', { name: 'Enter the room' }).click();
    const canvas = page.locator('#scene-frame canvas');
    await expect(canvas).toHaveAttribute('data-tier', 'low');
    await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);
    const dimensions = await canvas.evaluate((element: HTMLCanvasElement) => ({
      cssWidth: element.getBoundingClientRect().width,
      bufferWidth: element.width,
    }));
    expect(Math.abs(dimensions.bufferWidth - dimensions.cssWidth)).toBeLessThanOrEqual(2);
    expect(assets.map(asset => asset.path).sort()).toEqual(expectedAssets('low', alternateSky));
    expect(assets.every(asset => asset.status === 200)).toBe(true);
  } finally {
    await context.close();
  }
});

test('changing graphics inside the room replaces the renderer and preserves the view and focus', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  try {
    const page = await context.newPage();
    const assets: { path: string; status: number }[] = [];
    const pageErrors: string[] = [];
    page.on('response', response => {
      const path = assetPath(response.url());
      if (path) assets.push({ path, status: response.status() });
    });
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(`/?gl=1&metrics=1&sky=${alternateSky}&keep=1&tier=low#reading`);
    await expect(page.locator('[data-graphics-choice="intro"] [data-graphics-tier="low"]')).toBeChecked();
    await page.getByRole('button', { name: 'Enter the room' }).click();
    const canvas = page.locator('#scene-frame canvas');
    await expect(canvas).toHaveAttribute('data-tier', 'low');
    await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);
    await page.locator('[data-room-date="680"]').click();
    await page.locator('[data-room-place="yard"]').click();
    await expect(canvas).toHaveAttribute('data-date', '680');
    await expect(canvas).toHaveAttribute('data-place', 'yard');
    const originalCanvas = await canvas.elementHandle();
    expect(assets.map(asset => asset.path).sort()).toEqual(expectedAssets('low', alternateSky));

    const roomNormal = page.locator('[data-graphics-choice="room"] [data-graphics-tier="baseline"]');
    const roomLow = page.locator('[data-graphics-choice="room"] [data-graphics-tier="low"]');
    const normalAssetStart = assets.length;
    await roomNormal.check();
    await expect(canvas).toHaveAttribute('data-tier', 'baseline');
    await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);
    expect(await originalCanvas!.evaluate(element => element.isConnected)).toBe(false);
    await expect(canvas).toHaveAttribute('data-date', '680');
    await expect(canvas).toHaveAttribute('data-place', 'yard');
    await expect(page.locator('#scene-frame canvas')).toHaveCount(1);
    await expect(roomNormal).toBeFocused();
    await expect(roomNormal).toBeChecked();
    await expect(page.locator('[data-graphics-choice="intro"] [data-graphics-tier="baseline"]')).toBeChecked();
    const normalURL = new URL(page.url());
    expect(normalURL.searchParams.has('tier')).toBe(false);
    expect(normalURL.searchParams.get('sky')).toBe(alternateSky);
    expect(normalURL.searchParams.get('keep')).toBe('1');
    expect(normalURL.hash).toBe('#reading');
    expect(assets.slice(normalAssetStart).map(asset => asset.path).sort()).toEqual(expectedAssets('baseline', alternateSky));
    const normalDimensions = await canvas.evaluate((element: HTMLCanvasElement) => ({
      cssWidth: element.getBoundingClientRect().width,
      bufferWidth: element.width,
    }));
    expect(Math.abs(normalDimensions.bufferWidth - normalDimensions.cssWidth * 1.5)).toBeLessThanOrEqual(2);

    await roomLow.focus();
    await page.keyboard.press('Space');
    await expect(canvas).toHaveAttribute('data-tier', 'low');
    await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);
    await expect(canvas).toHaveAttribute('data-date', '680');
    await expect(canvas).toHaveAttribute('data-place', 'yard');
    await expect(roomLow).toBeFocused();
    await expect(roomLow).toBeChecked();
    expect(new URL(page.url()).searchParams.get('tier')).toBe('low');
    expect(pageErrors).toEqual([]);
    expect(assets.every(asset => asset.status === 200)).toBe(true);
  } finally {
    await context.close();
  }
});

test('a failed in-room graphics change returns focus to reading and leaves a retry', async ({ page }) => {
  await page.goto('/?gl=1&tier=low');
  await page.getByRole('button', { name: 'Enter the room' }).click();
  const canvas = page.locator('#scene-frame canvas');
  await expect(canvas).toHaveAttribute('data-tier', 'low');
  await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);

  let aborted = 0;
  await page.route('**/assets/polyhaven/clay_plaster/clay_plaster_diff_1k.jpg', route => {
    if (++aborted === 1) return route.abort('failed');
    return route.continue();
  });
  const normal = page.locator('[data-graphics-choice="room"] [data-graphics-tier="baseline"]');
  await normal.focus();
  await normal.check();

  await expect(page.locator('#room-view')).toBeHidden();
  await expect(canvas).toHaveCount(0);
  await expect(page.locator('#reading-title')).toBeFocused();
  await expect(page.locator('#scene-status')).toContainText('room view is unavailable');
  const retry = page.getByRole('button', { name: 'Try the room again' });
  await expect(retry).toBeVisible();
  await expect(retry).toBeEnabled();
  expect(aborted).toBe(1);
  expect(new URL(page.url()).searchParams.has('tier')).toBe(false);
  await expect(page.locator('[data-graphics-choice="intro"] [data-graphics-tier="baseline"]')).toBeChecked();

  await retry.click();
  await expect(canvas).toHaveAttribute('data-tier', 'baseline');
  await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);
  await expect(page.locator('#scene-frame canvas')).toHaveCount(1);
});

test('room actions pause during a graphics change while the choice keeps focus', async ({ page }) => {
  await page.goto('/?gl=1&tier=low');
  await page.getByRole('button', { name: 'Enter the room' }).click();
  const canvas = page.locator('#scene-frame canvas');
  await expect(canvas).toHaveAttribute('data-tier', 'low');
  await page.locator('[data-room-date="661"]').click();
  await expect(page.locator('#compare-hold')).toBeEnabled();

  let releaseNormal!: () => void;
  const heldNormal = new Promise<void>(resolve => { releaseNormal = resolve; });
  let normalRequested!: () => void;
  const requestStarted = new Promise<void>(resolve => { normalRequested = resolve; });
  await page.route('**/assets/polyhaven/clay_plaster/clay_plaster_diff_1k.jpg', async route => {
    normalRequested();
    await heldNormal;
    await route.continue();
  });

  const normal = page.locator('[data-graphics-choice="room"] [data-graphics-tier="baseline"]');
  try {
    await normal.focus();
    await normal.check();
    await requestStarted;
    await expect(normal).toBeFocused();
    await expect(normal).toBeChecked();
    await expect(page.locator('#room-view')).toBeVisible();
    await expect(canvas).toHaveCount(0);
    await expect(page.locator('#graphics-loading')).toBeVisible();
    await expect(page.locator('#enter-room')).toHaveAttribute('aria-expanded', 'true');
    for (const selector of [
      '[data-room-date="680"]',
      '[data-room-place="yard"]',
      '[data-look="left"]',
      '#compare-hold',
      '#compare-toggle',
      '#skip-movement',
      '#pause-motion',
    ]) {
      await expect(page.locator(selector)).toBeDisabled();
    }
    await expect(page.locator('#return-reading')).toBeEnabled();
  } finally {
    releaseNormal();
  }

  await expect(canvas).toHaveAttribute('data-tier', 'baseline');
  await expect(canvas).toHaveAttribute('data-date', '661');
  await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);
  await expect(page.locator('#scene-frame canvas')).toHaveCount(1);
  await expect(page.locator('#graphics-loading')).toBeHidden();
  await expect(normal).toBeFocused();
  await expect(page.locator('#enter-room')).toHaveAttribute('aria-expanded', 'true');
  for (const selector of [
    '[data-room-date="680"]',
    '[data-room-place="yard"]',
    '[data-look="left"]',
    '#compare-hold',
    '#compare-toggle',
    '#skip-movement',
    '#pause-motion',
  ]) {
    await expect(page.locator(selector)).toBeEnabled();
  }
});
