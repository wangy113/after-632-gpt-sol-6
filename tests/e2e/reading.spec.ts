import { test, expect } from '@playwright/test';
import experience from '../../content/experience.json' with { type: 'json' };
import changes from '../../content/changes.json' with { type: 'json' };
import views from '../../content/views.json' with { type: 'json' };

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

  for (const date of ['632', '661', '680'] as const) {
    const viewNotes = page.locator(`#moment-${date} details.view-notes`);
    await viewNotes.locator('summary').click();
    for (const description of Object.values(views[date].places)) {
      await expect(viewNotes).toContainText(description);
    }
    await expect(viewNotes.getByRole('link')).toHaveAttribute('href', `#source-${changes[date].labels.find(label => label.id === views[date].recordLabelId)!.sourceId}`);

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

test('the 632 arrival still loads before entering and without JavaScript', async ({ browser, page }) => {
  await page.goto('/?gl=1');
  const still = page.locator('#arrival-still');
  await expect(still).toBeVisible();
  await expect(still).toHaveAttribute('alt', /imagined 632 CE room from the doorway/i);
  await expect(page.getByRole('img', { name: /imagined 632 CE room from the doorway/i })).toBeVisible();
  await expect.poll(() => still.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('#scene-frame canvas')).toHaveCount(0);

  await page.getByRole('button', { name: 'Enter the room' }).click();
  await expect(page.locator('#scene-frame canvas')).toHaveCount(1);

  const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
  try {
    const noScriptPage = await noScriptContext.newPage();
    await noScriptPage.goto('/');
    const noScriptStill = noScriptPage.locator('#arrival-still');
    await expect(noScriptStill).toBeVisible();
    await expect(noScriptStill).toHaveAttribute('alt', /imagined 632 CE room from the doorway/i);
    await expect.poll(() => noScriptStill.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(noScriptPage.locator('canvas')).toHaveCount(0);
  } finally {
    await noScriptContext.close();
  }
});
