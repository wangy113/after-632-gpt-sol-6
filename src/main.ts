import './styles.css';
import { initialState, reduce, motionAllowed, type MomentId, type Action } from './state';
import type { CourtyardScene } from './scene/createScene';

const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const media = matchMedia('(prefers-reduced-motion: reduce)');
let state = { ...initialState, reduced: media.matches };
let scene: CourtyardScene | null = null;
let generation = 0;
let timeout: ReturnType<typeof setTimeout> | undefined;
const moments = [...document.querySelectorAll<HTMLElement>('[data-moment-id]')];
const dateLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-date]')];
const posterPhoto = document.querySelector<HTMLImageElement>('.courtyard-art')!;
posterPhoto.addEventListener('error', () => {
  if (!posterPhoto.src.endsWith('/courtyard-hero.webp')) posterPhoto.src = `${import.meta.env.BASE_URL}assets/courtyard-hero.webp`;
});
function dispatch(action: Action) { state = reduce(state, action); render(); }
function render() {
  const interactive = state.mode === 'interactive' && state.sceneStatus === 'ready';
  const themes: Record<MomentId, string> = { '632': 'SUCCESSION', '661': 'RULE & AUTHORITY', '680': 'KARBALA & MEMORY' };
  get('scene-year').textContent = state.moment;
  get('scene-theme').textContent = themes[state.moment];
  moments.forEach(moment => { moment.hidden = interactive && moment.dataset.momentId !== state.moment; });
  dateLinks.forEach(link => { if (link.dataset.date === state.moment) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current'); });
  if (!interactive && posterPhoto.dataset.photoMoment !== state.moment) {
    posterPhoto.src = `${import.meta.env.BASE_URL}assets/${state.moment === '632' ? 'courtyard-hero.webp' : `courtyard-${state.moment}-still.webp`}`;
    posterPhoto.dataset.photoMoment = state.moment;
  }
  get('scene-poster').hidden = interactive;
  get('scene-entry').hidden = interactive;
  get('view-controls').hidden = !interactive;
  get('scene-help').hidden = !interactive;
  const pause = get<HTMLButtonElement>('pause-motion');
  pause.setAttribute('aria-pressed', String(state.paused || state.reduced));
  pause.textContent = state.reduced ? 'Reduced motion on' : state.paused ? 'Resume movement' : 'Pause movement';
  pause.disabled = state.reduced;
  document.querySelectorAll<HTMLButtonElement>('button[data-enter]').forEach(button => { button.disabled = state.sceneStatus === 'loading'; button.textContent = state.sceneStatus === 'loading' ? 'Opening the courtyard…' : state.sceneStatus === 'failed' ? 'Try the view again' : 'Look around'; });
}
function disposeScene() { ++generation; clearTimeout(timeout); scene?.dispose(); scene = null; }
function fail() {
  const restoreReadingFocus = !!document.activeElement?.closest('#view-controls, #scene-help');
  disposeScene(); dispatch({ type: 'scene', status: 'failed' });
  get('scene-status').textContent = 'The courtyard view is unavailable. All of the history is here to read. You can try the view again whenever you like.';
  if (restoreReadingFocus) {
    get(`moment-${state.moment}`).querySelector<HTMLElement>('h3')?.focus({ preventScroll: true });
  }
}
async function enter() {
  if (state.sceneStatus === 'loading') return;
  if (scene) { dispatch({ type: 'mode', mode: 'interactive' }); return; }
  disposeScene(); const token = generation;
  dispatch({ type: 'scene', status: 'loading' }); get('scene-status').textContent = 'Opening the courtyard. You can keep reading while it loads.';
  timeout = setTimeout(() => { if (generation === token) fail(); }, 10000);
  try {
    const { createScene } = await import('./scene/createScene');
    if (generation !== token) return;
    scene = createScene(get('scene'), fail);
    if (generation !== token) { scene?.dispose(); scene = null; return; }
    clearTimeout(timeout);
    scene.select(state.moment, false);
    dispatch({ type: 'scene', status: 'ready' }); dispatch({ type: 'mode', mode: 'interactive' });
    get('scene-status').textContent = '';
    get('journey-title').focus({ preventScroll: true });
  } catch { if (generation === token) fail(); }
}
function read() {
  disposeScene(); dispatch({ type: 'mode', mode: 'reading' }); dispatch({ type: 'scene', status: 'idle' });
  get('scene-status').textContent = 'Reading view. All historical moments are available below.';
  const heading = get(`moment-${state.moment}`).querySelector<HTMLElement>('h3');
  heading?.focus({ preventScroll: true });
  heading?.scrollIntoView({ block: 'start', behavior: 'instant' });
}
document.querySelectorAll<HTMLElement>('[data-enter]').forEach(element => {
  element.hidden = false;
  element.addEventListener('click', () => { void enter(); });
});
document.querySelectorAll<HTMLElement>('[data-reading]').forEach(element => element.addEventListener('click', event => { event.preventDefault(); read(); }));
dateLinks.forEach(link => link.addEventListener('click', event => {
  const id = link.dataset.date as MomentId;
  const interactive = state.mode === 'interactive';
  if (interactive) event.preventDefault();
  if (id === state.moment) return;
  dispatch({ type: 'select', id }); scene?.select(id, motionAllowed(state));
  get('moment-announcement').textContent = `${id} CE — ${get(`moment-${id}`).querySelector('h3')!.textContent}`;
}));
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => button.addEventListener('click', () => scene?.view(button.dataset.view!)));
get('pause-motion').addEventListener('click', () => { dispatch({ type: 'pause', paused: !state.paused }); scene?.skip(); });
get('skip-motion').addEventListener('click', () => scene?.skip());
media.addEventListener('change', event => { dispatch({ type: 'reduced', reduced: event.matches }); if (event.matches) scene?.skip(); });
window.addEventListener('pagehide', disposeScene);
window.addEventListener('pageshow', event => {
  if (event.persisted) { dispatch({ type: 'mode', mode: 'reading' }); dispatch({ type: 'scene', status: 'idle' }); }
});
// Keep source notes open when following their in-page citations.
document.querySelectorAll<HTMLAnchorElement>('a[href^="#source-"]').forEach(link => link.addEventListener('click', () => { const detail = document.querySelector<HTMLDetailsElement>(link.hash); if (detail) detail.open = true; }));
render();
