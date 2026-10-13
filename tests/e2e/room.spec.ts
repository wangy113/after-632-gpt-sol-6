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
  await expect(room.locator('#room-description-632')).toContainText(changes['632'].description);

  const thingsHere = room.locator('[data-room-panel="632"] details.things-here');
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

test('switching to 661 changes the same room and keeps its source-backed reading path', async ({ page }) => {
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();

  const room = page.locator('#room-view');
  const canvas = page.locator('#scene-frame canvas');
  const date632 = room.getByRole('button', { name: '632 CE · Absent' });
  const date661 = room.getByRole('button', { name: '661 CE · Added' });
  await expect(date632).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-date', '632');
  await page.getByRole('button', { name: 'Look right' }).click();
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');

  await date661.click();
  await expect(date661).toBeFocused();
  await expect(date661).toHaveAttribute('aria-pressed', 'true');
  await expect(date632).toHaveAttribute('aria-pressed', 'false');
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-date', '661');
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');
  await expect(room.locator('#room-title')).toHaveText('661 CE · Inside the imagined room');
  await expect(room.locator('#room-lens')).toHaveText('Look for what is added');
  await expect(room.locator('#room-description-661')).toContainText(changes['661'].description);
  await expect(room.locator('[data-room-panel="632"]')).toBeHidden();
  await expect(page.locator('#scene-status')).toContainText('29 years later');

  const thingsHere = room.locator('[data-room-panel="661"] details.things-here');
  await thingsHere.locator('summary').click();
  await expect(thingsHere.locator('li[data-change-id]')).toHaveCount(5);
  for (const label of changes['661'].labels) {
    const item = thingsHere.locator(`li[data-change-id="${label.id}"]`);
    await expect(item).toContainText(label.inRoom);
    await expect(item).toContainText(label.inRecord);
    await expect(item.getByRole('link')).toHaveAttribute('href', `#source-${label.sourceId}`);
    const source = sources.find(source => source.id === label.sourceId)!;
    await expect(page.locator(`#source-${label.sourceId} a`)).toHaveAttribute('href', source.url);
  }

  await date632.click();
  await expect(canvas).toHaveAttribute('data-date', '632');
  await expect(room.locator('#room-lens')).toHaveText('Look for what is absent');
  await date661.focus();
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-date', '661');
  await expect(date661).toBeFocused();

  await room.getByRole('link', { name: 'Read the 661 passage' }).click();
  await expect(room).toBeHidden();
  await expect(canvas).toHaveCount(0);
  await expect(page.locator('#moment-661 h3')).toBeFocused();
  await expect(page).toHaveURL(/#moment-661$/);
  await expect(page.getByText(experience.moments[1].passage, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Enter the room' }).click();
  await expect(canvas).toHaveAttribute('data-date', '661');
  await expect(room.locator('#room-title')).toHaveText('661 CE · Inside the imagined room');
  await page.locator('#scene-frame').focus();
  await canvas.dispatchEvent('webglcontextlost');
  await expect(room).toBeHidden();
  await expect(page.locator('#reading-title')).toBeFocused();
});

test('680 keeps the viewpoint and explains its missing traces with sourced labels', async ({ page }) => {
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();

  const room = page.locator('#room-view');
  const canvas = page.locator('#scene-frame canvas');
  const date632 = room.getByRole('button', { name: '632 CE · Absent' });
  const date661 = room.getByRole('button', { name: '661 CE · Added' });
  const date680 = room.getByRole('button', { name: '680 CE · Missing' });
  await room.getByRole('button', { name: 'Look right' }).click();
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');

  await date680.click();
  await expect(date680).toBeFocused();
  await expect(date680).toHaveAttribute('aria-pressed', 'true');
  await expect(date632).toHaveAttribute('aria-pressed', 'false');
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-date', '680');
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');
  await expect(room.locator('#room-title')).toHaveText('680 CE · Inside the imagined room');
  await expect(room.locator('#room-lens')).toHaveText('Look for what is missing');
  await expect(room.locator('#room-description-680')).toContainText(changes['680'].description);
  await expect(room.locator('#scene-frame')).toHaveAttribute('aria-describedby', 'room-description-680 room-help');
  await expect(room.locator('[data-room-panel="680"]')).toBeVisible();
  await expect(room.locator('[data-room-panel="661"]')).toBeHidden();
  await expect(page.locator('#scene-status')).toContainText('48 years later');

  const thingsHere = room.locator('[data-room-panel="680"] details.things-here');
  await thingsHere.locator('summary').click();
  await expect(thingsHere.locator('li[data-change-id]')).toHaveCount(3);
  for (const id of ['clean-patch', 'empty-hook', 'taller-palm']) {
    await expect(thingsHere.locator(`li[data-change-id="${id}"]`)).toHaveCount(1);
  }
  for (const label of changes['680'].labels) {
    const item = thingsHere.locator(`li[data-change-id="${label.id}"]`);
    await expect(item).toContainText(`In this room: ${label.inRoom}`);
    await expect(item).toContainText(`In the record: ${label.inRecord}`);
    await expect(item.getByRole('link')).toHaveAttribute('href', `#source-${label.sourceId}`);
    const source = sources.find(source => source.id === label.sourceId)!;
    await expect(page.locator(`#source-${label.sourceId} a`)).toHaveAttribute('href', source.url);
  }

  await date661.click();
  await expect(canvas).toHaveAttribute('data-date', '661');
  await date680.click();
  await expect(canvas).toHaveAttribute('data-date', '680');
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');
  await expect(page.locator('#scene-status')).toContainText('19 years later');

  await room.getByRole('link', { name: 'Read the 680 passage' }).click();
  await expect(room).toBeHidden();
  await expect(canvas).toHaveCount(0);
  await expect(page.locator('#moment-680 h3')).toBeFocused();
  await expect(page).toHaveURL(/#moment-680$/);
  await expect(page.getByText(experience.moments[2].passage, { exact: true })).toBeVisible();
});

test('a date change dissolves at the same viewpoint on one canvas', async ({ page }) => {
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();

  const room = page.locator('#room-view');
  const canvas = room.locator('#scene-frame canvas');
  await room.locator('[data-room-place="pegs"]').click();
  await expect(canvas).toHaveAttribute('data-moving', 'false');
  await room.getByRole('button', { name: 'Look right' }).click();
  const position = await canvas.getAttribute('data-position');
  const yaw = await canvas.getAttribute('data-yaw');
  await expect(canvas).toHaveAttribute('data-date-transition', 'false');

  await room.locator('[data-room-date="661"]').click();
  await expect(canvas).toHaveAttribute('data-date', '661');
  await expect(canvas).toHaveAttribute('data-date-transition', 'true');
  await expect(room.locator('#date-transition-caption')).toHaveText('29 years later.');
  await expect(room.locator('#date-transition-caption')).toBeVisible();
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-position', position!);
  await expect(canvas).toHaveAttribute('data-yaw', yaw!);
  await expect(canvas).toHaveAttribute('data-date-transition', 'false', { timeout: 3_000 });
  await expect(room.locator('#date-transition-caption')).toBeHidden();
  await expect(canvas).toHaveAttribute('data-position', position!);
  await expect(canvas).toHaveAttribute('data-yaw', yaw!);

  const movingToYard = await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('[data-room-place="yard"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-room-date="680"]')!.click();
    const canvas = document.querySelector<HTMLCanvasElement>('#scene-frame canvas')!;
    return { moving: canvas.dataset.moving, dateTransition: canvas.dataset.dateTransition, position: canvas.dataset.position };
  });
  expect(movingToYard.moving).toBe('false');
  expect(movingToYard.dateTransition).toBe('true');
  expect(Number(movingToYard.position?.split(',')[2])).toBeGreaterThan(0);
  await expect(canvas).toHaveAttribute('data-date-transition', 'false', { timeout: 3_000 });
  await expect(canvas).toHaveAttribute('data-position', movingToYard.position!);
});

test('reduced motion cuts date changes and stops a dissolve already in progress', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();

  const room = page.locator('#room-view');
  const canvas = room.locator('#scene-frame canvas');
  await room.locator('[data-room-date="661"]').click();
  await expect(canvas).toHaveAttribute('data-date', '661');
  await expect(canvas).toHaveAttribute('data-date-transition', 'false');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await room.locator('[data-room-date="680"]').click();
  await expect(canvas).toHaveAttribute('data-date-transition', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(canvas).toHaveAttribute('data-date-transition', 'false');
  await expect(canvas).toHaveAttribute('data-date', '680');
});

test('Compare cancels a dissolve and always swaps dates instantly', async ({ page }) => {
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();

  const room = page.locator('#room-view');
  const canvas = room.locator('#scene-frame canvas');
  const position = await canvas.getAttribute('data-position');
  await room.locator('[data-room-date="661"]').click();
  await expect(canvas).toHaveAttribute('data-date-transition', 'true');
  await page.evaluate(() => document.querySelector<HTMLButtonElement>('#compare-toggle')!.click());
  await expect(canvas).toHaveAttribute('data-date', '632');
  await expect(canvas).toHaveAttribute('data-date-transition', 'false');
  await expect(room.locator('[data-room-date="661"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-position', position!);

  await page.evaluate(() => document.querySelector<HTMLButtonElement>('#compare-toggle')!.click());
  await expect(canvas).toHaveAttribute('data-date', '661');
  await expect(canvas).toHaveAttribute('data-date-transition', 'false');
  await page.evaluate(() => document.querySelector<HTMLButtonElement>('#compare-toggle')!.click());
  await page.evaluate(() => document.querySelector<HTMLButtonElement>('[data-room-date="680"]')!.click());
  await expect(canvas).toHaveAttribute('data-date', '680');
  await expect(canvas).toHaveAttribute('data-date-transition', 'false');
  await expect(room.locator('#compare-toggle')).toHaveAttribute('aria-pressed', 'false');
});

test('rapid date choices end on the newest date and leaving during a dissolve cleans up', async ({ page }) => {
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();

  const room = page.locator('#room-view');
  const canvas = room.locator('#scene-frame canvas');
  await expect(canvas).toHaveCount(1);
  const transition = await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('[data-room-date="661"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-room-date="680"]')!.click();
    return document.querySelector<HTMLCanvasElement>('#scene-frame canvas')!.dataset.dateTransition;
  });
  expect(transition).toBe('false');
  await expect(canvas).toHaveAttribute('data-date', '680');
  await expect(canvas).toHaveAttribute('data-date-transition', 'false', { timeout: 3_000 });
  await expect(room.locator('#room-title')).toHaveText('680 CE · Inside the imagined room');
  await expect(canvas).toHaveCount(1);

  const interrupted = await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('[data-room-date="632"]')!.click();
    const active = document.querySelector<HTMLCanvasElement>('#scene-frame canvas')!.dataset.dateTransition;
    document.querySelector<HTMLButtonElement>('#return-reading')!.click();
    return active;
  });
  expect(interrupted).toBe('true');
  await expect(canvas).toHaveCount(0);
  await page.getByRole('button', { name: 'Enter the room' }).click();
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-date', '632');
  await expect(canvas).toHaveAttribute('data-date-transition', 'false');
});

test('680 Compare previews 661 without changing the selected date or viewpoint', async ({ page }) => {
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();

  const room = page.locator('#room-view');
  const canvas = page.locator('#scene-frame canvas');
  const date661 = room.getByRole('button', { name: '661 CE · Added' });
  const date680 = room.getByRole('button', { name: '680 CE · Missing' });
  const hold = room.locator('#compare-hold');
  const toggle = room.locator('#compare-toggle');
  await date680.click();
  await room.getByRole('button', { name: 'Look right' }).click();
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');
  await expect(hold).toHaveText('Hold to see 661 CE');
  await expect(toggle).toHaveText('Keep 661 CE visible');

  await hold.hover();
  await page.mouse.down();
  await expect(canvas).toHaveAttribute('data-date', '661');
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');
  await expect(date680).toHaveAttribute('aria-pressed', 'true');
  await expect(room.locator('#room-title')).toHaveText('661 CE · Comparing with 680 CE');
  await expect(room.locator('#room-lens')).toHaveText('Look for what is added');
  await expect(room.locator('[data-room-panel="661"]')).toBeVisible();
  await expect(room.locator('[data-room-panel="680"]')).toBeHidden();
  await expect(room.locator('#scene-frame')).toHaveAttribute('aria-describedby', 'room-description-661 room-help');
  await page.mouse.up();
  await expect(canvas).toHaveAttribute('data-date', '680');
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-date', '661');
  await date661.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(canvas).toHaveAttribute('data-date', '661');
  await expect(hold).toHaveText('Hold to see 632 CE');
  await date680.click();
  await expect(canvas).toHaveAttribute('data-date', '680');
  await expect(hold).toHaveText('Hold to see 661 CE');
});

test('Compare previews 632 at the same viewpoint and clears on release, blur, and date change', async ({ page }) => {
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();

  const room = page.locator('#room-view');
  const canvas = page.locator('#scene-frame canvas');
  const date632 = room.getByRole('button', { name: '632 CE · Absent' });
  const date661 = room.getByRole('button', { name: '661 CE · Added' });
  const hold = room.locator('#compare-hold');
  const toggle = room.locator('#compare-toggle');
  await date661.click();
  await room.getByRole('button', { name: 'Look right' }).click();
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');

  await hold.hover();
  await page.mouse.down();
  await expect(canvas).toHaveAttribute('data-date', '632');
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');
  await expect(canvas).toHaveCount(1);
  await expect(date661).toHaveAttribute('aria-pressed', 'true');
  await expect(room.locator('#room-title')).toHaveText('632 CE · Comparing with 661 CE');
  await expect(room.locator('#room-lens')).toHaveText('Look for what is absent');
  await expect(room.locator('[data-room-panel="632"]')).toBeVisible();
  await expect(room.locator('[data-room-panel="661"]')).toBeHidden();
  await expect(room.locator('#scene-frame')).toHaveAttribute('aria-describedby', 'room-description-632 room-help');
  await page.mouse.move(10, 10);
  await expect(canvas).toHaveAttribute('data-date', '632');
  await page.mouse.up();
  await expect(canvas).toHaveAttribute('data-date', '661');
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');

  await page.keyboard.down('c');
  await expect(canvas).toHaveAttribute('data-date', '632');
  await page.keyboard.up('c');
  await expect(canvas).toHaveAttribute('data-date', '661');

  await hold.focus();
  await page.keyboard.down('Space');
  await expect(canvas).toHaveAttribute('data-date', '632');
  await page.keyboard.up('Space');
  await expect(canvas).toHaveAttribute('data-date', '661');

  await page.keyboard.down('c');
  await expect(canvas).toHaveAttribute('data-date', '632');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(canvas).toHaveAttribute('data-date', '661');
  await page.keyboard.up('c');

  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-date', '632');
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(canvas).toHaveAttribute('data-date', '661');
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await date632.click();
  await expect(canvas).toHaveAttribute('data-date', '632');
  await date661.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(canvas).toHaveAttribute('data-date', '661');

  await page.keyboard.down('c');
  await expect(canvas).toHaveAttribute('data-date', '632');
  await room.getByRole('button', { name: 'Return to reading' }).click();
  await expect(canvas).toHaveCount(0);
  await page.getByRole('button', { name: 'Enter the room' }).click();
  await expect(canvas).toHaveAttribute('data-date', '661');
  await page.keyboard.up('c');
  await expect(canvas).toHaveAttribute('data-date', '661');
});

test('touch holds Compare only until release', async ({ page }) => {
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();
  const room = page.locator('#room-view');
  const canvas = page.locator('#scene-frame canvas');
  await room.getByRole('button', { name: '661 CE · Added' }).click();
  const hold = room.locator('#compare-hold');
  await hold.scrollIntoViewIfNeeded();
  const bounds = await hold.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width / 2;
  const y = bounds!.y + bounds!.height / 2;
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  try {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    await expect(canvas).toHaveAttribute('data-date', '632');
  } finally {
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await expect(canvas).toHaveAttribute('data-date', '661');
});

test('four places to stand move the same camera and keep the selected date', async ({ page }) => {
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();

  const room = page.locator('#room-view');
  const canvas = room.locator('#scene-frame canvas');
  const doorway = room.locator('[data-room-place="doorway"]');
  const head = room.locator('[data-room-place="head"]');
  const pegs = room.locator('[data-room-place="pegs"]');
  const yard = room.locator('[data-room-place="yard"]');

  await expect(doorway).toHaveText('Doorway');
  await expect(head).toHaveText('Head of room');
  await expect(pegs).toHaveText('By the pegs');
  await expect(yard).toHaveText('Yard looking back');
  await expect(doorway).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-place', 'doorway');
  await expect(canvas).toHaveAttribute('data-position', /^-?\d+\.\d{3},-?\d+\.\d{3},-?\d+\.\d{3}$/);
  const positions = [await canvas.getAttribute('data-position')];

  await room.getByRole('button', { name: '680 CE · Missing' }).click();
  await head.focus();
  await page.keyboard.press('Space');
  await expect(head).toBeFocused();
  await expect(head).toHaveAttribute('aria-pressed', 'true');
  await expect(doorway).toHaveAttribute('aria-pressed', 'false');
  await expect(canvas).toHaveAttribute('data-place', 'head');
  await expect(canvas).toHaveAttribute('data-moving', 'false');
  positions.push(await canvas.getAttribute('data-position'));

  await pegs.click();
  await expect(canvas).toHaveAttribute('data-place', 'pegs');
  await expect(canvas).toHaveAttribute('data-moving', 'false');
  positions.push(await canvas.getAttribute('data-position'));

  await yard.click();
  await expect(canvas).toHaveAttribute('data-place', 'yard');
  await expect(canvas).toHaveAttribute('data-moving', 'false');
  const yardPosition = await canvas.getAttribute('data-position');
  positions.push(yardPosition);
  expect(new Set(positions).size).toBe(4);
  expect(Number(yardPosition?.split(',')[2])).toBeGreaterThan(0);
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-date', '680');

  const hold = room.locator('#compare-hold');
  await hold.hover();
  await page.mouse.down();
  await expect(canvas).toHaveAttribute('data-date', '661');
  await expect(canvas).toHaveAttribute('data-position', yardPosition!);
  await expect(canvas).toHaveAttribute('data-place', 'yard');
  await expect(yard).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.up();
  await expect(canvas).toHaveAttribute('data-date', '680');
  await expect(canvas).toHaveAttribute('data-position', yardPosition!);
});

test('a rapid change of place ends at the last destination', async ({ page }) => {
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();

  const room = page.locator('#room-view');
  const canvas = room.locator('#scene-frame canvas');
  const doorway = room.locator('[data-room-place="doorway"]');
  const head = room.locator('[data-room-place="head"]');
  const pegs = room.locator('[data-room-place="pegs"]');
  const yard = room.locator('[data-room-place="yard"]');

  await yard.click();
  await expect(canvas).toHaveAttribute('data-moving', 'false');
  const yardPosition = await canvas.getAttribute('data-position');
  await doorway.click();
  await expect(canvas).toHaveAttribute('data-moving', 'false');

  await head.click();
  await expect(canvas).toHaveAttribute('data-moving', 'false');
  await room.getByRole('button', { name: 'Look right' }).click();
  await expect(canvas).toHaveAttribute('data-yaw', '3.362');
  await doorway.click();
  await expect(canvas).toHaveAttribute('data-moving', 'false');
  await expect(canvas).toHaveAttribute('data-yaw', '0.000');
  await room.getByRole('button', { name: 'Look right' }).click();
  await expect(canvas).toHaveAttribute('data-yaw', '0.220');

  // Dispatch the selections together so an earlier glide cannot finish over the last one.
  const movingAfterSwitch = await page.evaluate(() => {
    for (const place of ['head', 'pegs', 'yard']) {
      document.querySelector<HTMLButtonElement>(`[data-room-place="${place}"]`)!.click();
    }
    return document.querySelector<HTMLCanvasElement>('#scene-frame canvas')?.dataset.moving;
  });
  expect(movingAfterSwitch).toBe('true');
  await expect(canvas).toHaveAttribute('data-moving', 'false');
  await expect(canvas).toHaveAttribute('data-place', 'yard');
  await expect(canvas).toHaveAttribute('data-position', yardPosition!);
  await expect(yard).toHaveAttribute('aria-pressed', 'true');
  await expect(head).toHaveAttribute('aria-pressed', 'false');
  await expect(pegs).toHaveAttribute('aria-pressed', 'false');
  await expect(canvas).toHaveCount(1);
});

test('reduced motion cuts between places and reopening keeps the chosen place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?gl=1');
  await page.getByRole('button', { name: 'Enter the room' }).click();

  const room = page.locator('#room-view');
  const canvas = room.locator('#scene-frame canvas');
  const initialPosition = await canvas.getAttribute('data-position');
  await room.locator('[data-room-place="pegs"]').click();
  await expect(canvas).toHaveAttribute('data-place', 'pegs');
  await expect(canvas).toHaveAttribute('data-moving', 'false');
  expect(await canvas.getAttribute('data-position')).not.toBe(initialPosition);

  await room.locator('[data-room-place="yard"]').click();
  await expect(canvas).toHaveAttribute('data-place', 'yard');
  await expect(canvas).toHaveAttribute('data-moving', 'false');
  const yardPosition = await canvas.getAttribute('data-position');
  await room.getByRole('button', { name: 'Return to reading' }).click();
  await expect(canvas).toHaveCount(0);

  await page.getByRole('button', { name: 'Enter the room' }).click();
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-place', 'yard');
  await expect(canvas).toHaveAttribute('data-position', yardPosition!);
  await expect(canvas).toHaveAttribute('data-moving', 'false');
  await expect(room.locator('[data-room-place="yard"]')).toHaveAttribute('aria-pressed', 'true');
});
