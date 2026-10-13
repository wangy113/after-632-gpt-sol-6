import { test, expect } from '@playwright/test';
import experience from '../../content/experience.json' with { type: 'json' };

test('all historical text is available without JavaScript or 3D', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'After 632' })).toBeVisible();
  await expect(page.getByText(experience.setting, { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Read without 3D' }).click();
  await expect(page.getByText(experience.shared.text, { exact: false })).toBeVisible();
  for (const moment of experience.moments) {
    await expect(page.getByText(moment.passage, { exact: true })).toBeVisible();
  }
  await expect(page.locator('canvas')).toHaveCount(0);
  await context.close();
});
