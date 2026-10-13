import { test, expect } from '@playwright/test';
import experience from '../../content/experience.json' with { type: 'json' };

test('the room is opt-in and returning to reading releases the canvas', async ({ page }) => {
  await page.goto('/?gl=1');

  const enter = page.getByRole('button', { name: 'Enter the room' });
  const room = page.locator('#room-view');
  const canvas = page.locator('#scene-frame canvas');
  await expect(enter).toBeVisible();
  await expect(room).toBeHidden();
  await expect(canvas).toHaveCount(0);
  await expect(page.getByText(experience.moments[0].passage, { exact: true })).toBeVisible();

  await enter.click();
  await expect(room).toBeVisible();
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-backend', 'WebGL2 fallback');
  await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);

  await page.getByRole('button', { name: 'Look right' }).click();
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');
  await page.locator('#scene-frame').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(canvas).toHaveAttribute('data-yaw', '0.000');

  await page.getByRole('button', { name: 'Return to reading' }).click();
  await expect(room).toBeHidden();
  await expect(canvas).toHaveCount(0);
  await expect(page.locator('#reading-title')).toBeFocused();
  for (const moment of experience.moments) {
    await expect(page.getByText(moment.passage, { exact: true })).toBeVisible();
  }

  await enter.click();
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-frames', /[1-9]/);
  await page.locator('#scene-frame').focus();
  await canvas.dispatchEvent('webglcontextlost');
  await expect(room).toBeHidden();
  await expect(page.locator('#scene-status')).toContainText('room view is unavailable');
  await expect(page.locator('#reading-title')).toBeFocused();
});

test('renderer failure returns the visitor to readable history', async ({ page }) => {
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
  await page.getByRole('button', { name: 'Enter the room' }).click();

  await expect(page.locator('#scene-status')).toContainText('room view is unavailable', { timeout: 12_000 });
  await expect(page.locator('#room-view')).toBeHidden();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Try the room again' })).toBeEnabled();
  for (const moment of experience.moments) {
    await expect(page.getByText(moment.passage, { exact: true })).toBeVisible();
  }
});
