import type { RoomView } from './scene/createRoomView';
import type { RoomDate } from './schema/changeIds';
import { dateChangeCaption, previousDate } from './state/dates';
import { PLACE_LABELS, PLACE_ORIENTATIONS, type PlaceId } from './state/places';
import { compareAvailable, initialState, isComparing, reduce, visibleDate } from './state/store';

const enterButton = document.querySelector<HTMLButtonElement>('#enter-room')!;
const readLink = document.querySelector<HTMLAnchorElement>('#read-link')!;
const returnButton = document.querySelector<HTMLButtonElement>('#return-reading')!;
const roomSection = document.querySelector<HTMLElement>('#room-view')!;
const roomTitle = document.querySelector<HTMLElement>('#room-title')!;
const roomLens = document.querySelector<HTMLElement>('#room-lens')!;
const dateButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-room-date]'));
const placeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-room-place]'));
const compareHold = document.querySelector<HTMLButtonElement>('#compare-hold')!;
const compareToggle = document.querySelector<HTMLButtonElement>('#compare-toggle')!;
const compareHelp = document.querySelector<HTMLElement>('#compare-help')!;
const roomPanels = Array.from(document.querySelectorAll<HTMLElement>('[data-room-panel]'));
const readingTitle = document.querySelector<HTMLElement>('#reading-title')!;
const sceneFrame = document.querySelector<HTMLElement>('#scene-frame')!;
const roomHelp = document.querySelector<HTMLElement>('#room-help')!;
const status = document.querySelector<HTMLElement>('#scene-status')!;

let room: RoomView | null = null;
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let state = reduce(initialState, { type: 'setReducedMotion', reduced: motionQuery.matches });
let pointerHoldId: number | null = null;
let cKeyHeld = false;
let buttonKeyHeld = false;
let loading = false;
let generation = 0;
let deadline: ReturnType<typeof setTimeout> | undefined;

function clearHeldInputs() {
  const pointerId = pointerHoldId;
  pointerHoldId = null;
  if (pointerId !== null && compareHold.hasPointerCapture(pointerId)) {
    compareHold.releasePointerCapture(pointerId);
  }
  cKeyHeld = false;
  buttonKeyHeld = false;
  state = reduce(state, { type: 'setCompareHeld', held: false });
}

function resetCompare() {
  clearHeldInputs();
  if (state.compareToggled) state = reduce(state, { type: 'toggleCompare' });
}

function renderRoomPlace() {
  for (const button of placeButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.roomPlace === state.place));
  }
  sceneFrame.setAttribute('aria-label', `Look around from ${PLACE_LABELS[state.place].toLowerCase()}`);
  roomHelp.textContent = `${PLACE_ORIENTATIONS[state.place]} Drag to look around, or focus the view and use the arrow keys.`;
}

function renderRoomDate(message?: string): boolean {
  const date = visibleDate(state);
  try { room?.setDate(date); } catch { fail(); return false; }
  const comparing = isComparing(state);
  roomTitle.textContent = comparing
    ? `${date} CE · Comparing with ${state.date} CE`
    : `${date} CE · Inside the imagined room`;
  const visibleButton = dateButtons.find(button => button.dataset.roomDate === date)!;
  roomLens.textContent = `Look for what is ${visibleButton.dataset.roomLens}`;
  for (const button of dateButtons) button.setAttribute('aria-pressed', String(button.dataset.roomDate === state.date));
  for (const panel of roomPanels) panel.hidden = panel.dataset.roomPanel !== date;
  sceneFrame.setAttribute('aria-describedby', `room-description-${date} room-help`);
  const earlierDate = previousDate(state.date);
  const canCompare = earlierDate !== null;
  compareHold.disabled = !canCompare;
  compareToggle.disabled = !canCompare;
  compareHold.textContent = earlierDate ? `Hold to see ${earlierDate} CE` : 'Hold to compare';
  compareToggle.textContent = earlierDate ? `Keep ${earlierDate} CE visible` : 'Keep earlier date visible';
  compareHelp.textContent = earlierDate
    ? `In ${state.date} CE, hold the first button or the C key to see ${earlierDate} CE from the same viewpoint. Release to return. Press the second button to keep ${earlierDate} CE visible; press again to return.`
    : 'Choose 661 or 680 CE to compare with the previous date from the same viewpoint.';
  compareHold.setAttribute('aria-pressed', String(state.compareHeld));
  compareToggle.setAttribute('aria-pressed', String(state.compareToggled));
  status.textContent = message ?? (comparing
    ? `Comparing ${date} CE from the same viewpoint. ${state.date} CE remains selected.`
    : `${date} CE restored at the same viewpoint.`);
  return true;
}

function closeRoom(message = '') {
  generation++;
  clearTimeout(deadline);
  deadline = undefined;
  loading = false;
  const currentRoom = room;
  room = null;
  resetCompare();
  state = reduce(state, { type: 'skipMovement' });
  try { currentRoom?.dispose(); } catch { sceneFrame.replaceChildren(); }
  roomSection.hidden = true;
  enterButton.setAttribute('aria-expanded', 'false');
  enterButton.disabled = false;
  enterButton.textContent = 'Enter the room';
  status.textContent = message;
}

function selectDate(date: RoomDate) {
  if (date === state.date && !isComparing(state)) return;
  const previous = state.date;
  resetCompare();
  state = reduce(state, { type: 'selectDate', date });
  const message = date === previous
    ? `${date} CE restored at the same viewpoint.`
    : `${date} room view open. ${dateChangeCaption(previous, date)}. The viewpoint stayed the same.`;
  renderRoomDate(message);
}

function selectPlace(place: PlaceId) {
  if (!room) return;
  const next = reduce(state, { type: 'selectPlace', place });
  if (next === state) return;
  state = next;
  const token = state.placeTransition?.token;
  try {
    room.moveTo(place, token !== undefined, () => {
      if (token !== undefined) state = reduce(state, { type: 'finishPlaceTransition', token });
    });
  } catch { fail(); return; }
  renderRoomPlace();
  const date = visibleDate(state);
  status.textContent = `${PLACE_LABELS[place]} selected. Showing ${date} CE${isComparing(state) ? ` while ${state.date} CE remains selected` : ''}.`;
}

function syncHeld() {
  if (!room) return;
  const next = reduce(state, { type: 'setCompareHeld', held: pointerHoldId !== null || cKeyHeld || buttonKeyHeld });
  if (next === state) return;
  state = next;
  renderRoomDate();
}

function releasePointer(pointerId: number) {
  if (pointerHoldId !== pointerId) return;
  pointerHoldId = null;
  syncHeld();
}

function fail() {
  const focusedInRoom = roomSection.contains(document.activeElement);
  closeRoom('The room view is unavailable. All three moments remain here to read. You can try the room again.');
  enterButton.textContent = 'Try the room again';
  if (focusedInRoom) readingTitle.focus({ preventScroll: true });
}

async function enter() {
  if (loading) return;
  if (room) {
    roomTitle.focus({ preventScroll: true });
    roomSection.scrollIntoView({ block: 'start' });
    return;
  }

  const token = ++generation;
  loading = true;
  enterButton.disabled = true;
  enterButton.textContent = 'Opening the room…';
  status.textContent = 'Opening the imagined room. You can keep reading while it loads.';
  deadline = setTimeout(() => { if (generation === token) fail(); }, 10000);

  try {
    const { createRoomView } = await import('./scene/createRoomView');
    if (generation !== token) return;
    const created = await createRoomView(
      sceneFrame,
      () => { if (generation === token) fail(); },
      new URLSearchParams(location.search).get('gl') === '1',
    );
    if (generation !== token) { created.dispose(); return; }
    clearTimeout(deadline);
    deadline = undefined;
    room = created;
    room.moveTo(state.place, false);
    renderRoomPlace();
    roomSection.hidden = false;
    enterButton.setAttribute('aria-expanded', 'true');
    loading = false;
    enterButton.disabled = false;
    enterButton.textContent = 'Enter the room';
    if (!renderRoomDate(`${state.date} room view open. The full reading remains below.`)) return;
    roomTitle.focus({ preventScroll: true });
    roomSection.scrollIntoView({ block: 'start' });
  } catch {
    if (generation === token) fail();
  }
}

enterButton.addEventListener('click', () => { void enter(); });
readLink.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (loading || room) closeRoom();
  history.pushState(null, '', '#reading');
  readingTitle.focus({ preventScroll: true });
  readingTitle.scrollIntoView({ block: 'start' });
});
document.querySelectorAll<HTMLAnchorElement>('[data-read-room-date]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const date = link.dataset.readRoomDate as RoomDate;
    const passageTitle = document.querySelector<HTMLElement>(`#moment-${date} h3`)!;
    closeRoom(`Reading the ${date} passage.`);
    history.pushState(null, '', `#moment-${date}`);
    passageTitle.focus({ preventScroll: true });
    passageTitle.scrollIntoView({ block: 'start' });
  });
});
for (const button of dateButtons) {
  button.addEventListener('click', () => selectDate(button.dataset.roomDate as RoomDate));
}
for (const button of placeButtons) {
  button.addEventListener('click', () => selectPlace(button.dataset.roomPlace as PlaceId));
}
motionQuery.addEventListener('change', () => {
  state = reduce(state, { type: 'setReducedMotion', reduced: motionQuery.matches });
  if (motionQuery.matches) room?.skipMovement();
});
compareHold.addEventListener('pointerdown', event => {
  if (!room || !compareAvailable(state) || !event.isPrimary || event.button !== 0 || pointerHoldId !== null) return;
  pointerHoldId = event.pointerId;
  compareHold.setPointerCapture(event.pointerId);
  syncHeld();
});
compareHold.addEventListener('pointerup', event => releasePointer(event.pointerId));
compareHold.addEventListener('pointercancel', event => releasePointer(event.pointerId));
compareHold.addEventListener('lostpointercapture', event => releasePointer(event.pointerId));
compareToggle.addEventListener('click', () => {
  if (!room || !compareAvailable(state)) return;
  state = reduce(state, { type: 'toggleCompare' });
  renderRoomDate();
});
window.addEventListener('keydown', event => {
  if (!room || !compareAvailable(state) || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof HTMLElement &&
      (event.target.isContentEditable || event.target.closest('input, textarea, select'))) return;
  if (event.code === 'KeyC' && roomSection.contains(document.activeElement)) {
    event.preventDefault();
    if (!cKeyHeld) { cKeyHeld = true; syncHeld(); }
  } else if (event.target === compareHold && (event.code === 'Space' || event.code === 'Enter')) {
    event.preventDefault();
    if (!buttonKeyHeld) { buttonKeyHeld = true; syncHeld(); }
  }
});
window.addEventListener('keyup', event => {
  if (event.code === 'KeyC' && cKeyHeld) {
    cKeyHeld = false;
    syncHeld();
  } else if ((event.code === 'Space' || event.code === 'Enter') && buttonKeyHeld) {
    buttonKeyHeld = false;
    syncHeld();
  }
});
window.addEventListener('blur', () => {
  if (pointerHoldId === null && !cKeyHeld && !buttonKeyHeld) return;
  clearHeldInputs();
  if (room) renderRoomDate();
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden || (pointerHoldId === null && !cKeyHeld && !buttonKeyHeld)) return;
  clearHeldInputs();
  if (room) renderRoomDate();
});
returnButton.addEventListener('click', () => {
  closeRoom('Reading view. All three moments are available below.');
  readingTitle.focus({ preventScroll: true });
  readingTitle.scrollIntoView({ block: 'start' });
});
document.querySelectorAll<HTMLButtonElement>('[data-look]').forEach(button => {
  button.addEventListener('click', () => room?.look(button.dataset.look as Parameters<RoomView['look']>[0]));
});
window.addEventListener('pagehide', () => { if (loading || room) closeRoom(); });
enterButton.hidden = false;
