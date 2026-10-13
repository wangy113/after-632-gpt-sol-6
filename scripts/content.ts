import experience from '../content/experience.json' with { type: 'json' };
import sources from '../content/sources.json' with { type: 'json' };

export interface Moment {
  id: string;
  title: string;
  lens: string;
  passage: string;
  sourceId: string;
}

export interface Experience {
  opening: string;
  setting: string;
  shared: { text: string; sourceId: string };
  moments: Moment[];
}

export interface Source {
  id: string;
  title: string;
  author: string;
  publisher: string;
  locator: string;
  url: string;
  checkedOn: string;
}

const expectedLenses = new Map([
  ['632', 'Absent'],
  ['661', 'Added'],
  ['680', 'Missing'],
]);

export function validateContent(data: Experience = experience, records: Source[] = sources): void {
  if (!data.opening.trim() || !data.setting.trim()) throw new Error('Opening and setting are required');
  if (data.moments.length !== expectedLenses.size) throw new Error('Exactly three moments are required');

  const sourceIds = new Set(records.map(source => source.id));
  if (sourceIds.size !== records.length) throw new Error('Source IDs must be unique');
  if (!data.shared.text.trim() || !sourceIds.has(data.shared.sourceId)) {
    throw new Error('Shared foundations need text and a source');
  }
  for (const source of records) {
    if (!source.title.trim() || !source.author.trim() || !source.locator.trim()) throw new Error('Source details are required');
    if (new URL(source.url).protocol !== 'https:') throw new Error('Sources must use HTTPS');
  }

  const seen = new Set<string>();
  for (const moment of data.moments) {
    if (seen.has(moment.id) || moment.lens !== expectedLenses.get(moment.id)) {
      throw new Error('Each historical date needs its assigned lead lens');
    }
    seen.add(moment.id);
    const words = moment.passage.trim().split(/\s+/).filter(Boolean).length;
    if (!moment.title.trim() || words < 1 || words > 60) {
      throw new Error(moment.id + ': passage must be 1–60 words');
    }
    if (!sourceIds.has(moment.sourceId)) throw new Error(moment.id + ': source is missing');
  }
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

export function renderPage(data: Experience = experience, records: Source[] = sources): string {
  validateContent(data, records);
  const e = escapeHtml;
  const navigation = data.moments.map(moment =>
    `<a href="#moment-${e(moment.id)}">${e(moment.id)} CE · ${e(moment.title)}</a>`
  ).join('');
  const moments = data.moments.map(moment =>
    `<article class="moment" id="moment-${e(moment.id)}">
      <p class="lens">Look for what is ${e(moment.lens.toLowerCase())}</p>
      <h3>${e(moment.id)} CE — ${e(moment.title)}</h3>
      <p>${e(moment.passage)}</p>
      <a href="#source-${e(moment.sourceId)}">Historical source</a>
    </article>`
  ).join('');
  const sourceList = records.map(source =>
    `<li id="source-${e(source.id)}"><a href="${e(source.url)}">${e(source.author)}, ${e(source.title)}</a>. ${e(source.publisher)}, ${e(source.locator)}.</li>`
  ).join('');

  return `<main>
    <header class="intro">
      <h1>After 632</h1>
      <p class="opening">${e(data.opening)}</p>
      <p class="setting">${e(data.setting)}</p>
      <div class="entry-actions">
        <button type="button" id="enter-room" aria-controls="room-view" hidden>Enter the room</button>
        <a class="read-link" id="read-link" href="#reading">Read without 3D</a>
      </div>
      <p id="scene-status" role="status" aria-live="polite"></p>
    </header>
    <section id="room-view" aria-labelledby="room-title" hidden>
      <h2 id="room-title" tabindex="-1">Inside the imagined room</h2>
      <p class="setting">${e(data.setting)}</p>
      <div id="scene-frame" class="scene-frame" role="group" tabindex="0" aria-label="Look around the imagined room" aria-describedby="room-description room-help"></div>
      <p id="room-description" class="room-note">A bare room with roof beams opens through a wide doorway. Turn around to see a small yard with a low wall, well, and palm. This study view has no dated objects yet.</p>
      <p id="room-help">Drag to look around, or focus the view and use the arrow keys.</p>
      <div class="look-controls" role="group" aria-label="View controls">
        <button type="button" data-look="left">Look left</button>
        <button type="button" data-look="right">Look right</button>
        <button type="button" data-look="up">Look up</button>
        <button type="button" data-look="down">Look down</button>
        <button type="button" data-look="reset">Reset view</button>
        <button type="button" id="return-reading">Return to reading</button>
      </div>
      <p class="room-note">This room and yard are illustrative, not a reconstruction of a documented place.</p>
    </section>
    <section id="reading" aria-labelledby="reading-title">
      <h2 id="reading-title" tabindex="-1">Three moments in one history</h2>
      <p>${e(data.shared.text)} <a href="#source-${e(data.shared.sourceId)}">Historical source</a></p>
      <nav class="date-nav" aria-label="Choose a date">${navigation}</nav>
      ${moments}
    </section>
  </main>
  <footer>
    <h2>Sources</h2>
    <ol>${sourceList}</ol>
    <p>This room is imagined. Its objects will be interpretations, not evidence of these events.</p>
  </footer>`;
}
