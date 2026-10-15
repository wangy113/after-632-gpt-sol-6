import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 640 },
];

function violations(results: Awaited<ReturnType<AxeBuilder['analyze']>>): string {
  return JSON.stringify(results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })),
  })), null, 2);
}

for (const viewport of viewports) {
  test(`static reading page has no axe violations at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    // Keep the built HTML and CSS, but leave the app script inactive. Axe still needs
    // JavaScript in the test page to inspect the same markup available without the app.
    let appScriptBlocked = false;
    await page.route('**/assets/index-*.js', route => {
      appScriptBlocked = true;
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    });
    await page.goto('/');
    expect(appScriptBlocked).toBe(true);
    await expect(page.getByRole('heading', { name: 'After 632' })).toBeVisible();
    await expect(page.locator('article.moment')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Enter the room' })).toBeHidden();
    await expect(page.locator('canvas')).toHaveCount(0);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, violations(results)).toEqual([]);
  });

  test(`entered room has no axe violations at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize(viewport);
    await page.goto('/?gl=1');
    await page.getByRole('button', { name: 'Enter the room' }).click();
    await expect(page.locator('#room-view')).toBeVisible();
    await expect(page.locator('#scene-frame canvas')).toHaveAttribute('data-frames', /[1-9]/);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, violations(results)).toEqual([]);
  });
}

test('expanded reading notes have no axe violations at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.route('**/assets/index-*.js', route => route.fulfill({
    status: 200, contentType: 'text/javascript', body: '',
  }));
  await page.goto('/');
  await page.locator('#moment-680 .view-notes summary').click();
  await page.locator('#moment-680 .things-here summary').click();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, violations(results)).toEqual([]);
});

test('expanded 680 room notes have no axe violations at 320px', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();
  await page.locator('[data-room-date="680"]').click();
  await expect(page.locator('#scene-frame canvas')).toHaveAttribute('data-date', '680');
  await page.locator('#describe-view summary').click();
  await page.locator('[data-room-panel="680"] .things-here summary').click();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, violations(results)).toEqual([]);
});

test('plain reporting exit has no axe violations at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/exit.html');
  await page.locator('.exit-invitation summary').click();
  await expect(page.locator('.exit-invitation details')).toHaveAttribute('open', '');
  await expect(page.locator('script, canvas')).toHaveCount(0);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, violations(results)).toEqual([]);
});
