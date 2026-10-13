import { test, expect } from '@playwright/test';
import experience from '../../content/experience.json' with { type: 'json' };
import changes from '../../content/changes.json' with { type: 'json' };
import sources from '../../content/sources.json' with { type: 'json' };

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

test('the 632 room explains three imagined traces and links to the passage', async ({ page }) => {
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();

  const room = page.locator('#room-view');
  await expect(room).toBeVisible();
  await expect(room.locator('.lens')).toHaveText('Look for what is absent');
  await expect(room.locator('#room-description')).toContainText(changes['632'].description);

  const thingsHere = room.locator('details.things-here');
  await expect(thingsHere.locator('summary')).toHaveText('Things here · 632 CE');
  await thingsHere.locator('summary').click();
  const labels = thingsHere.locator('li[data-change-id]');
  await expect(labels).toHaveCount(3);
  for (const label of changes['632'].labels) {
    const item = thingsHere.locator(`li[data-change-id="${label.id}"]`);
    await expect(item).toContainText(label.title);
    await expect(item).toContainText(`In this room: ${label.inRoom}`);
    await expect(item).toContainText(`In the record: ${label.inRecord}`);
    await expect(item.getByRole('link')).toHaveAttribute('href', `#source-${label.sourceId}`);
    const source = sources.find(source => source.id === label.sourceId)!;
    await expect(page.locator(`#source-${label.sourceId} a`)).toHaveAttribute('href', source.url);
  }

  await room.getByRole('link', { name: 'Read the 632 passage' }).click();
  await expect(room).toBeHidden();
  await expect(page.locator('#scene-frame canvas')).toHaveCount(0);
  await expect(page.locator('#moment-632 h3')).toBeFocused();
  await expect(page).toHaveURL(/#moment-632$/);
  await expect(page.getByText(experience.moments[0].passage, { exact: true })).toBeVisible();
});
