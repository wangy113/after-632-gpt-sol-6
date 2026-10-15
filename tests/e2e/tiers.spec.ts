import { expect, test } from '@playwright/test';

test('the explicit Low preview caps a DPR 2 canvas at 1 while other URLs retain 1.5', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  try {
    const page = await context.newPage();
    const samples = [];
    for (const [query, tier, pixelRatio] of [
      ['', 'baseline', 1.5],
      ['&tier=low', 'low', 1],
      ['&tier=unknown', 'baseline', 1.5],
    ] as const) {
      await page.goto(`/?gl=1&metrics=1${query}`);
      await page.getByRole('button', { name: 'Enter the room' }).click();
      const canvas = page.locator('#scene-frame canvas');
      await expect(canvas).toHaveAttribute('data-backend', 'WebGL2 fallback');
      await expect(canvas).toHaveAttribute('data-tier', tier);
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
    }
    expect(samples[0].width * samples[0].height).toBeGreaterThan(samples[1].width * samples[1].height * 2.2);
    expect(samples[2].width).toBe(samples[0].width);
    expect(samples[2].height).toBe(samples[0].height);
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
