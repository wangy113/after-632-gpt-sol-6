import { test, expect } from '@playwright/test';
import experience from '../../content/experience.json' with { type: 'json' };
import changes from '../../content/changes.json' with { type: 'json' };

test('all historical text is available without JavaScript or 3D', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'After 632' })).toBeVisible();
  await expect(page.locator('.intro .setting')).toHaveText(experience.setting);
  await page.getByRole('link', { name: 'Read without 3D' }).click();
  await expect(page.getByText(experience.shared.text, { exact: false })).toBeVisible();
  for (const moment of experience.moments) {
    await expect(page.getByText(moment.passage, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Enter the room' })).toBeHidden();

  for (const date of ['632', '661'] as const) {
    const sceneNotes = page.locator(`#moment-${date} details.things-here`);
    await sceneNotes.locator('summary').click();
    await expect(sceneNotes).toContainText(changes[date].description);
    await expect(sceneNotes.locator('li[data-change-id]')).toHaveCount(changes[date].labels.length);
    for (const label of changes[date].labels) {
      const item = sceneNotes.locator(`li[data-change-id="${label.id}"]`);
      await expect(item).toContainText(label.inRoom);
      await expect(item).toContainText(label.inRecord);
      await expect(item.getByRole('link')).toHaveAttribute('href', `#source-${label.sourceId}`);
    }
  }
  const firstSourceId = changes['632'].labels[0].sourceId;
  await page.locator('#moment-632 li[data-change-id] a').first().click();
  await expect(page).toHaveURL(new RegExp(`#source-${firstSourceId}$`));
  await expect(page.locator(`#source-${firstSourceId}`)).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await context.close();
});
