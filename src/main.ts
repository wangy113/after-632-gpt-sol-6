import type { RoomView } from './scene/createRoomView';

const enterButton = document.querySelector<HTMLButtonElement>('#enter-room')!;
const readLink = document.querySelector<HTMLAnchorElement>('#read-link')!;
const returnButton = document.querySelector<HTMLButtonElement>('#return-reading')!;
const roomSection = document.querySelector<HTMLElement>('#room-view')!;
const roomTitle = document.querySelector<HTMLElement>('#room-title')!;
const readingTitle = document.querySelector<HTMLElement>('#reading-title')!;
const sceneFrame = document.querySelector<HTMLElement>('#scene-frame')!;
const status = document.querySelector<HTMLElement>('#scene-status')!;

let room: RoomView | null = null;
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
  enterButton.disabled = false;
  enterButton.textContent = 'Enter the room';
  status.textContent = message;
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
    roomSection.hidden = false;
    loading = false;
    enterButton.disabled = false;
    enterButton.textContent = 'Enter the room';
    status.textContent = 'Room view open. The full reading remains below.';
    roomTitle.focus({ preventScroll: true });
    roomSection.scrollIntoView({ block: 'start' });
  } catch {
    if (generation === token) fail();
  }
}

enterButton.addEventListener('click', () => { void enter(); });
readLink.addEventListener('click', () => {
  if (loading || room) closeRoom();
  readingTitle.focus({ preventScroll: true });
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
