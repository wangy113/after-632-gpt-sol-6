import type { RoomView } from './scene/createRoomView';
import type { RoomDate } from './schema/changeIds';
import { dateChangeCaption } from './state/dates';

const enterButton = document.querySelector<HTMLButtonElement>('#enter-room')!;
const readLink = document.querySelector<HTMLAnchorElement>('#read-link')!;
const returnButton = document.querySelector<HTMLButtonElement>('#return-reading')!;
const roomSection = document.querySelector<HTMLElement>('#room-view')!;
const roomTitle = document.querySelector<HTMLElement>('#room-title')!;
const roomLens = document.querySelector<HTMLElement>('#room-lens')!;
const dateButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-room-date]'));
const roomPanels = Array.from(document.querySelectorAll<HTMLElement>('[data-room-panel]'));
const readingTitle = document.querySelector<HTMLElement>('#reading-title')!;
const sceneFrame = document.querySelector<HTMLElement>('#scene-frame')!;
const status = document.querySelector<HTMLElement>('#scene-status')!;

let room: RoomView | null = null;
let selectedDate: RoomDate = '632';
let loading = false;
let generation = 0;
let deadline: ReturnType<typeof setTimeout> | undefined;

function closeRoom(message = '') {
  generation++;
  clearTimeout(deadline);
  deadline = undefined;
  loading = false;
  const currentRoom = room;
  room = null;
  try { currentRoom?.dispose(); } catch { sceneFrame.replaceChildren(); }
  roomSection.hidden = true;
  enterButton.setAttribute('aria-expanded', 'false');
  enterButton.disabled = false;
  enterButton.textContent = 'Enter the room';
  status.textContent = message;
}

function selectDate(date: RoomDate) {
  if (date === selectedDate) return;
  const previous = selectedDate;
  try { room?.setDate(date); } catch { fail(); return; }
  selectedDate = date;
  roomTitle.textContent = `${date} CE · Inside the imagined room`;
  const selectedButton = dateButtons.find(button => button.dataset.roomDate === date)!;
  roomLens.textContent = `Look for what is ${selectedButton.dataset.roomLens}`;
  for (const button of dateButtons) button.setAttribute('aria-pressed', String(button === selectedButton));
  for (const panel of roomPanels) panel.hidden = panel.dataset.roomPanel !== date;
  sceneFrame.setAttribute('aria-describedby', `room-description-${date} room-help`);
  status.textContent = `${date} room view open. ${dateChangeCaption(previous, date)}. The viewpoint stayed the same.`;
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
    created.setDate(selectedDate);
    clearTimeout(deadline);
    deadline = undefined;
    room = created;
    roomSection.hidden = false;
    enterButton.setAttribute('aria-expanded', 'true');
    loading = false;
    enterButton.disabled = false;
    enterButton.textContent = 'Enter the room';
    status.textContent = `${selectedDate} room view open. The full reading remains below.`;
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
