import { expect, test } from '@playwright/test';
import reporting from '../../content/reporting.json' with { type: 'json' };

test('the plain reporting exit works without JavaScript and keeps its sources and dates', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await page.getByRole('link', { name: 'Continue to the present' }).click();
    await expect(page).toHaveURL(/\/exit\.html$/);
    await expect(page).toHaveTitle('Into the present · After 632');
    await expect(page.getByRole('heading', { level: 1, name: 'Into the present' })).toBeVisible();
    await expect(page.locator('.report-card')).toHaveCount(2);
    for (const report of reporting.reports) {
      const card = page.locator('.report-card').filter({ has: page.getByRole('link', { name: report.title }) });
      await expect(card.getByRole('link', { name: report.title })).toHaveAttribute('href', report.url);
      await expect(card.locator('time')).toHaveAttribute('datetime', report.publishedOn);
      await expect(card).toContainText(report.focus);
    }
    for (const claim of reporting.context.claims) {
      const source = reporting.context.sources.find(source => source.id === claim.sourceId)!;
      const paragraph = page.locator('.exit-context p').filter({ hasText: claim.text });
      await expect(paragraph).toBeVisible();
      await expect(paragraph.getByRole('link', { name: `Source: ${source.publisher}` })).toHaveAttribute('href', source.url);
    }
    await expect(page.getByText(reporting.context.closing, { exact: true })).toBeVisible();
    for (const source of reporting.context.sources) {
      await expect(page.locator('#context-sources + ol').getByRole('link', { name: new RegExp(source.author) }))
        .toHaveAttribute('href', source.url);
    }
    await expect(page.getByText(reporting.invitation, { exact: true })).toBeVisible();
    await page.locator('.exit-invitation summary').click();
    for (const lens of reporting.optionalLenses) await expect(page.getByText(lens, { exact: true })).toBeVisible();
    await expect(page.locator('canvas, script')).toHaveCount(0);

    await page.getByRole('link', { name: 'Return to the three dates' }).click();
    await expect(page).toHaveURL(/\/index\.html#reading$/);
    await expect(page.getByRole('heading', { name: 'Three moments in one history' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('keyboard activation leaves the entered room for the separate exit page', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();
  await expect(page.locator('#scene-frame canvas')).toHaveCount(1);

  await page.getByRole('link', { name: 'Leave the room for the present' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/exit\.html$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Into the present' })).toBeVisible();
  await expect(page.locator('#room-view, #scene-frame, canvas, script')).toHaveCount(0);
});
