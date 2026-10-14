import type { RoomView } from './scene/createRoomView';
import changes from '../content/changes.json' with { type: 'json' };
import views from '../content/views.json' with { type: 'json' };
import sources from '../content/sources.json' with { type: 'json' };
import type { RoomDate } from './schema/changeIds';
import { dateChangeCaption, previousDate } from './state/dates';
import { PLACE_LABELS, PLACE_ORIENTATIONS, type PlaceId } from './state/places';
import type { ViewDirection } from './state/viewDirections';
import { compareAvailable, initialState, isComparing, reduce, visibleDate } from './state/store';

const enterButton = document.querySelector<HTMLButtonElement>('#enter-room')!;
const readLink = document.querySelector<HTMLAnchorElement>('#read-link')!;
const returnButton = document.querySelector<HTMLButtonElement>('#return-reading')!;
const skipMovementButton = document.querySelector<HTMLButtonElement>('#skip-movement')!;
const pauseMotionButton = document.querySelector<HTMLButtonElement>('#pause-motion')!;
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
const dateCaption = document.querySelector<HTMLElement>('#date-transition-caption')!;
const roomHelp = document.querySelector<HTMLElement>('#room-help')!;
const status = document.querySelector<HTMLElement>('#scene-status')!;
const viewLocation = document.querySelector<HTMLElement>('#view-location')!;
const viewImagined = document.querySelector<HTMLElement>('#view-imagined')!;
const viewStarting = document.querySelector<HTMLElement>('#view-starting')!;
const viewStartingText = document.querySelector<HTMLElement>('#view-starting-text')!;
const viewRecordText = document.querySelector<HTMLElement>('#view-record-text')!;
const viewRecordSource = document.querySelector<HTMLAnchorElement>('#view-record-source')!;

let room: RoomView | null = null;
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let state = reduce(initialState, { type: 'setReducedMotion', reduced: motionQuery.matches });
let pointerHoldId: number | null = null;
let cKeyHeld = false;
let buttonKeyHeld = false;
let ignorePointerClick = false;
let ignorePointerClickReset: ReturnType<typeof setTimeout> | undefined;
let ignoreKeyboardClick = false;
let loading = false;
let restoreEntryFocusOnFailure = false;
let generation = 0;
let deadline: ReturnType<typeof setTimeout> | undefined;
let lastViewDescription = '';

function renderViewDescription(direction: ViewDirection | 'moving' = room?.viewDirection() ?? 'forward') {
  const date = visibleDate(state);
  const key = `${date}:${state.place}:${direction}`;
  if (key === lastViewDescription) return;
  lastViewDescription = key;
  const startingText = views[date].places[state.place];
  const directionLabel: Record<ViewDirection, string> = {
    forward: 'starting view', left: 'looking left', right: 'looking right',
    back: 'looking behind the starting view', up: 'looking up', down: 'looking down',
  };
  const record = changes[date].labels.find(label => label.id === views[date].recordLabelId)!;
  const source = sources.find(item => item.id === record.sourceId)!;
  viewLocation.textContent = direction === 'moving'
    ? `${date} CE · Moving to ${PLACE_LABELS[state.place]}.`
    : `${date} CE · ${PLACE_LABELS[state.place]} · ${directionLabel[direction]}.`;
  viewImagined.textContent = direction === 'moving'
    ? 'The camera is moving between places. The view description will update when it stops.'
    : direction === 'forward' ? startingText : views.turned[state.place][direction];
  viewStarting.hidden = direction === 'forward' || direction === 'moving';
  viewStartingText.textContent = direction === 'forward' || direction === 'moving' ? '' : startingText;
  viewRecordText.textContent = record.inRecord;
  viewRecordSource.href = `#source-${record.sourceId}`;
  viewRecordSource.textContent = `Source: ${source.author}, ${source.locator}`;
}

function clearHeldInputs() {
  clearTimeout(ignorePointerClickReset);
  ignorePointerClickReset = undefined;
  ignorePointerClick = false;
  ignoreKeyboardClick = false;
  const pointerId = pointerHoldId;
  pointerHoldId = null;
  if (pointerId !== null && compareHold.hasPointerCapture(pointerId)) {
    compareHold.releasePointerCapture(pointerId);
  }
  cKeyHeld = false;
  buttonKeyHeld = false;
  state = reduce(state, { type: 'setCompareHeld', held: false });
}

function startPointerHold() {
  clearTimeout(ignorePointerClickReset);
  ignorePointerClickReset = undefined;
  ignorePointerClick = true;
}

function finishPointerHold(clickDelay: number) {
  clearTimeout(ignorePointerClickReset);
  // Touch can generate a delayed click after pointerup.
  ignorePointerClickReset = setTimeout(() => {
    ignorePointerClick = false;
    ignorePointerClickReset = undefined;
  }, clickDelay);
}

function resetCompare() {
  clearHeldInputs();
  if (state.compareToggled) state = reduce(state, { type: 'toggleCompare' });
}

function renderRoomPlace(moving = false) {
  for (const button of placeButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.roomPlace === state.place));
  }
  sceneFrame.setAttribute('aria-label', `Look around from ${PLACE_LABELS[state.place].toLowerCase()}`);
  roomHelp.textContent = `${PLACE_ORIENTATIONS[state.place]} Drag to look around, or focus the view and use the arrow keys.`;
  renderViewDescription(moving ? 'moving' : undefined);
}

function renderRoomDate(message?: string, transition?: { token: number; animate: boolean; caption: string }): boolean {
  const date = visibleDate(state);
  dateCaption.textContent = transition?.animate ? `${transition.caption}.` : '';
  dateCaption.hidden = !transition?.animate;
  const token = transition?.token ?? state.dateTransition?.token;
  try {
    room?.setDate(date, transition?.animate ?? false, () => {
      if (token !== undefined) state = reduce(state, { type: 'finishDateTransition', token });
      dateCaption.hidden = true;
    });
  } catch { fail(); return false; }
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
    ? `In ${state.date} CE, hold the first button or the C key to see ${earlierDate} CE from the same viewpoint. Release to return. With assistive technology that cannot hold a button, activate Hold once to keep ${earlierDate} CE visible and again to return. The second button also switches that persistent view.`
    : 'Choose 661 or 680 CE to compare with the previous date from the same viewpoint.';
  compareHold.setAttribute('aria-pressed', String(isComparing(state)));
  compareToggle.setAttribute('aria-pressed', String(state.compareToggled));
  status.textContent = message ?? (comparing
    ? `Comparing ${date} CE from the same viewpoint. ${state.date} CE remains selected.`
    : `${date} CE restored at the same viewpoint.`);
  renderViewDescription();
  return true;
}

function closeRoom(message = '') {
  generation++;
  clearTimeout(deadline);
  deadline = undefined;
  loading = false;
  restoreEntryFocusOnFailure = false;
  const currentRoom = room;
  room = null;
  resetCompare();
  state = reduce(state, { type: 'skipMovement' });
  dateCaption.hidden = true;
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
  const wasComparing = isComparing(state);
  resetCompare();
  state = reduce(state, { type: 'selectDate', date });
  const message = date === previous
    ? `${date} CE restored at the same viewpoint.`
    : `${date} room view open. ${dateChangeCaption(previous, date)}. The viewpoint stayed the same.`;
  const token = state.dateTransition?.token;
  renderRoomDate(message, token === undefined ? undefined : {
    token,
    animate: !wasComparing,
    caption: dateChangeCaption(previous, date) ?? '',
  });
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
      renderViewDescription();
    });
  } catch { fail(); return; }
  renderRoomPlace(token !== undefined);
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

function releasePointer(pointerId: number, pointerType: string) {
  if (pointerHoldId !== pointerId) return;
  pointerHoldId = null;
  finishPointerHold(pointerType === 'touch' ? 500 : 0);
  syncHeld();
}

function fail() {
  const focusedInRoom = roomSection.contains(document.activeElement);
  const restoreEntryFocus = loading && restoreEntryFocusOnFailure &&
    (document.activeElement === document.body || document.activeElement === enterButton);
  closeRoom('The room view is unavailable. All three moments remain here to read. You can try the room again.');
  enterButton.textContent = 'Try the room again';
  if (focusedInRoom) readingTitle.focus({ preventScroll: true });
  else if (restoreEntryFocus) enterButton.focus({ preventScroll: true });
}

async function enter() {
  if (loading) return;
  if (room) {
    roomTitle.focus({ preventScroll: true });
    roomSection.scrollIntoView({ block: 'start' });
    return;
  }

  const token = ++generation;
  restoreEntryFocusOnFailure = document.activeElement === enterButton;
  loading = true;
  enterButton.disabled = true;
  enterButton.textContent = 'Opening the room…';
  status.textContent = 'Opening the imagined room. You can keep reading while it loads.';
  deadline = setTimeout(() => { if (generation === token) fail(); }, 30000);

  try {
    const { createRoomView } = await import('./scene/createRoomView');
    if (generation !== token) return;
    const created = await createRoomView(
      sceneFrame,
      () => { if (generation === token) fail(); },
      new URLSearchParams(location.search).get('gl') === '1',
      () => renderViewDescription(),
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
    restoreEntryFocusOnFailure = false;
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
  if (motionQuery.matches) {
    room?.skipMovement();
    room?.skipDateTransition();
  }
});
compareHold.addEventListener('pointerdown', event => {
  if (!room || !compareAvailable(state) || !event.isPrimary || event.button !== 0 || pointerHoldId !== null) return;
  startPointerHold();
  pointerHoldId = event.pointerId;
  compareHold.setPointerCapture(event.pointerId);
  syncHeld();
});
compareHold.addEventListener('pointerup', event => releasePointer(event.pointerId, event.pointerType));
compareHold.addEventListener('pointercancel', event => releasePointer(event.pointerId, event.pointerType));
compareHold.addEventListener('lostpointercapture', event => releasePointer(event.pointerId, event.pointerType));
function togglePersistentCompare() {
  if (!room || !compareAvailable(state)) return;
  state = reduce(state, { type: 'toggleCompare' });
  renderRoomDate();
}
compareHold.addEventListener('click', event => {
  if (ignoreKeyboardClick) return;
  if (ignorePointerClick && event.detail > 0) {
    clearTimeout(ignorePointerClickReset);
    ignorePointerClickReset = undefined;
    ignorePointerClick = false;
    return;
  }
  togglePersistentCompare();
});
compareToggle.addEventListener('click', togglePersistentCompare);
window.addEventListener('keydown', event => {
  if (!room || !compareAvailable(state) || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof HTMLElement &&
      (event.target.isContentEditable || event.target.closest('input, textarea, select'))) return;
  if (event.code === 'KeyC' && roomSection.contains(document.activeElement)) {
    event.preventDefault();
    if (!cKeyHeld) { cKeyHeld = true; syncHeld(); }
  } else if (event.target === compareHold && (event.code === 'Space' || event.code === 'Enter')) {
    event.preventDefault();
    if (!buttonKeyHeld) { ignoreKeyboardClick = true; buttonKeyHeld = true; syncHeld(); }
  }
});
window.addEventListener('keyup', event => {
  if (event.code === 'KeyC' && cKeyHeld) {
    cKeyHeld = false;
    syncHeld();
  } else if ((event.code === 'Space' || event.code === 'Enter') && buttonKeyHeld) {
    event.preventDefault();
    buttonKeyHeld = false;
    // The canceled key event cannot create a later click; clear before the next command.
    queueMicrotask(() => { ignoreKeyboardClick = false; });
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
function skipCurrentMovement() {
  if (!room) return;
  if (!state.placeTransition && !state.dateTransition) {
    status.textContent = 'No movement is in progress.';
    return;
  }
  try {
    room.skipMovement();
    room.skipDateTransition();
  } catch { fail(); return; }
  state = reduce(state, { type: 'skipMovement' });
  dateCaption.hidden = true;
  renderViewDescription();
  status.textContent = `Movement skipped. Showing ${visibleDate(state)} CE from ${PLACE_LABELS[state.place].toLowerCase()}.`;
}
skipMovementButton.addEventListener('click', skipCurrentMovement);
pauseMotionButton.addEventListener('click', () => {
  if (!room) return;
  const paused = !state.paused;
  if (paused) {
    try {
      room.skipMovement();
      room.skipDateTransition();
    } catch { fail(); return; }
  }
  state = reduce(state, { type: 'setPaused', paused });
  pauseMotionButton.setAttribute('aria-pressed', String(paused));
  dateCaption.hidden = true;
  renderViewDescription();
  status.textContent = paused
    ? 'Motion paused. Date and place changes will appear immediately.'
    : motionQuery.matches
      ? 'Motion resumed here. Your system setting still reduces motion.'
      : 'Motion resumed. Date and place changes can animate again.';
});
window.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !room || !roomSection.contains(document.activeElement)) return;
  if (!state.placeTransition && !state.dateTransition) return;
  event.preventDefault();
  skipCurrentMovement();
});
document.querySelectorAll<HTMLButtonElement>('[data-look]').forEach(button => {
  button.addEventListener('click', () => room?.look(button.dataset.look as Parameters<RoomView['look']>[0]));
});
window.addEventListener('pagehide', () => { if (loading || room) closeRoom(); });
enterButton.hidden = false;
