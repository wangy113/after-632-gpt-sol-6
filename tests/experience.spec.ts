import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import experience from '../content/experience.json' with { type: 'json' };

test('the full reading experience survives disabled JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173');
  for (const moment of experience.moments) await expect(page.getByText(moment.body, { exact: true })).toBeVisible();
  await expect(page.getByText(experience.invitation, { exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await context.close();
});

test('3D is opt-in, renders, supports controls, and stops drawing when idle', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('link', { name: 'Enter the courtyard' }).click();
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-moment', '632');
  await expect(canvas).toHaveAttribute('data-assets', 'ready');
  await page.getByRole('button', { name: 'Look left', exact: true }).click();
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await page.getByRole('button', { name: 'Pause movement', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume movement' })).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(300);
  const first = await canvas.getAttribute('data-frames');
  await page.waitForTimeout(300);
  expect(await canvas.getAttribute('data-frames')).toBe(first);
  expect(Number(await canvas.getAttribute('data-draw-calls'))).toBeLessThan(100);
  expect(Number(await canvas.getAttribute('data-triangles'))).toBeLessThan(100000);
});

test('reading mode disposes 3D and re-entry creates only one canvas', async ({ page }) => {
  await page.goto('/');
  for (let repeat = 0; repeat < 3; repeat++) {
    await page.locator('button[data-enter]').click();
    await expect(page.locator('canvas')).toHaveCount(1);
    await page.locator('button[data-reading]').click();
    await expect(page.locator('canvas')).toHaveCount(0);
    for (const moment of experience.moments) await expect(page.locator(`#moment-${moment.id}`)).toBeVisible();
  }
});

test('reading mode shows the photograph for the selected date', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Read the history' }).click();
  for (const date of ['661', '680', '632']) {
    await page.locator(`[data-date="${date}"]`).click();
    await expect(page.locator('.courtyard-art')).toHaveAttribute('src', new RegExp(`courtyard-${date === '632' ? 'hero' : `${date}-still`}\\.webp$`));
    await expect.poll(() => page.locator('.courtyard-art').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(1920);
  }
});

test('unsupported WebGL keeps all content and offers a retry', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return original.apply(this, [type, ...args] as never);
    } as typeof original;
  });
  await page.goto('/');
  await page.locator('button[data-enter]').click();
  await expect(page.getByRole('button', { name: 'Try the view again' })).toBeVisible();
  for (const moment of experience.moments) await expect(page.locator(`#moment-${moment.id}`)).toBeVisible();
});

test('context loss recovers to reading with no orphaned canvas', async ({ page }) => {
  await page.goto('/');
  await page.locator('button[data-enter]').click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.locator('canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Try the view again' })).toBeVisible();
});

test('a missing dated photograph recovers to the complete reading view', async ({ page }) => {
  await page.route('**/assets/courtyard-661.webp', route => route.abort());
  await page.goto('/');
  await page.locator('button[data-enter]').click();
  await expect(page.locator('canvas')).toHaveAttribute('data-assets', 'degraded');
  await page.locator('[data-date="661"]').click();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Try the view again' })).toBeVisible();
  await expect(page.locator('.courtyard-art')).toHaveAttribute('src', /courtyard-661-still\.webp$/);
  for (const moment of experience.moments) await expect(page.locator(`#moment-${moment.id}`)).toBeVisible();
});

test('reduced motion takes precedence and content remains accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('button[data-enter]').click();
  await expect(page.getByRole('button', { name: 'Reduced motion on' })).toBeDisabled();
  await page.getByRole('button', { name: 'Look right', exact: true }).click();
  await page.getByRole('button', { name: 'Skip movement', exact: true }).click();
});

test('desktop and phone have no horizontal overflow or automated accessibility violations', async ({ page }) => {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(scan.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(';')}`)).toEqual([]);
  }
});

test('all interactive dates select matching text and lighting', async ({ page }) => {
  await page.goto('/');
  await page.locator('button[data-enter]').click();
  await expect(page.locator('canvas')).toBeVisible();
  for (const moment of [...experience.moments].reverse()) {
    await page.locator(`[data-date="${moment.id}"]`).click();
    await expect(page.locator('canvas')).toHaveAttribute('data-moment', moment.id);
    await expect(page.locator(`[data-moment-id="${moment.id}"]`)).toBeVisible();
    await expect(page.locator('[data-moment-id]:visible')).toHaveCount(1);
  }
});

test('the complete journey keeps navigation and reports accessible after 3D entry', async ({ page }) => {
  await page.goto('/');
  await page.locator('button[data-enter]').click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.locator('[data-date="680"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-date="680"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-moment-id="680"]')).toBeVisible();
  await expect(page.locator('[data-moment-id="632"]')).toBeHidden();
  await expect(page.getByText(/680 CE — A memory that endures/)).toHaveCount(1);
  await expect(page.locator('.report-card a')).toHaveCount(2);
  await expect(page.locator('.report-card a').nth(1)).toHaveAttribute('href', /abcnews\.com\/amp/);
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(scan.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(';')}`)).toEqual([]);
});
