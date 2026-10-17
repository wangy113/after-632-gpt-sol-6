import { expect, test, type Page } from '@playwright/test';

async function tabTo(page: Page, selector: string, maxTabs = 12) {
  for (let index = 0; index < maxTabs; index++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(target => document.activeElement?.matches(target), selector)) return;
  }
  throw new Error(`${selector} was not reachable by Tab within ${maxTabs} steps`);
}

test('the small-screen room path works with keyboard input alone', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?gl=1');

  await page.keyboard.press('Tab');
  await expect(page.locator('#enter-room')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#room-title')).toBeFocused();
  const canvas = page.locator('#scene-frame canvas');
  await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);

  await page.keyboard.press('Tab');
  await expect(page.locator('[data-room-date="632"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-room-date="661"]')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-date', '661');

  await tabTo(page, '[data-room-place="yard"]', 5);
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-moving', 'true');
  await page.keyboard.press('Escape');
  await expect(canvas).toHaveAttribute('data-moving', 'false');
  await expect(page.locator('#scene-status')).toContainText('Movement skipped');

  await page.keyboard.press('Tab');
  await expect(page.locator('#scene-frame')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#view-location')).toContainText('looking right');

  await page.keyboard.press('Tab');
  await expect(page.locator('#compare-hold')).toBeFocused();
  await page.keyboard.down('Space');
  await expect(canvas).toHaveAttribute('data-date', '632');
  await page.keyboard.up('Space');
  await expect(canvas).toHaveAttribute('data-date', '661');

  await page.keyboard.press('Tab');
  await expect(page.locator('#compare-toggle')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('#compare-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Space');
  await expect(page.locator('#compare-toggle')).toHaveAttribute('aria-pressed', 'false');

  await page.keyboard.press('Tab');
  await expect(page.locator('[data-graphics-choice="room"] [data-graphics-tier="baseline"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#describe-view summary')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#describe-view')).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(page.locator('#describe-view')).not.toHaveAttribute('open', '');

  await tabTo(page, '#skip-movement');
  await page.keyboard.press('Space');
  await expect(page.locator('#scene-status')).toHaveText('No movement is in progress.');
  await tabTo(page, '#return-reading');
  await page.keyboard.press('Enter');
  await expect(page.locator('#reading-title')).toBeFocused();
  await expect(canvas).toHaveCount(0);
});

test('keyboard focus stays useful if opening the room fails', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: function (this: HTMLCanvasElement, contextId: string, options: unknown) {
        if (contextId === 'webgl2') return null;
        return Reflect.apply(getContext, this, [contextId, options]);
      },
    });
  });
  await page.goto('/?gl=1');
  await page.keyboard.press('Tab');
  await expect(page.locator('#enter-room')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#scene-status')).toContainText('room view is unavailable');
  await expect(page.locator('#enter-room')).toHaveText('Try the room again');
  await expect(page.locator('#enter-room')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#read-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#reading-title')).toBeFocused();
});
