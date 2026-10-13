import experience from '../content/experience.json' with { type: 'json' };
import sources from '../content/sources.json' with { type: 'json' };
import changes from '../content/changes.json' with { type: 'json' };
import objects from '../content/objects.json' with { type: 'json' };
import { ABSENT_632_IDS, ADDED_661_IDS, MISSING_680_IDS } from '../src/schema/changeIds';

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

export interface ChangeLabel {
  id: string;
  title: string;
  inRoom: string;
  inRecord: string;
  sourceId: string;
  objectId?: string;
}

export interface ChangeSet {
  description: string;
  labels: ChangeLabel[];
}

export type Changes = Record<string, ChangeSet>;

export interface ObjectRecord {
  id: string;
  kind: string;
  title: string;
  sceneDate: string;
  sceneStatus: string;
  museumReference: {
    collection: string;
    accession: string;
    catalogUrl: string;
    sourceId: string;
    cataloguedDate: string;
    mintedCe: number;
    mint: string;
  };
  imageUse: string;
  note: string;
}

const expectedLenses = new Map([
  ['632', 'Absent'],
  ['661', 'Added'],
  ['680', 'Missing'],
]);

export function validateContent(
  data: Experience = experience,
  records: Source[] = sources,
  changeSets: Changes = changes,
  objectRecords: ObjectRecord[] = objects,
): void {
  if (!data.opening.trim() || !data.setting.trim()) throw new Error('Opening and setting are required');
  if (data.moments.length !== expectedLenses.size) throw new Error('Exactly three moments are required');

  const sourceIds = new Set(records.map(source => source.id));
  const sourceById = new Map(records.map(source => [source.id, source]));
  if (sourceIds.size !== records.length) throw new Error('Source IDs must be unique');
  if (!data.shared.text.trim() || !sourceIds.has(data.shared.sourceId)) {
    throw new Error('Shared foundations need text and a source');
  }
  for (const source of records) {
    if (!source.title.trim() || !source.author.trim() || !source.locator.trim()) throw new Error('Source details are required');
    if (new URL(source.url).protocol !== 'https:') throw new Error('Sources must use HTTPS');
  }

  const objectById = new Map<string, ObjectRecord>();
  for (const object of objectRecords) {
    if (!object.id.trim() || objectById.has(object.id)) throw new Error('Object IDs must be unique');
    objectById.set(object.id, object);
    if (object.kind !== 'interpretive-replica' || object.sceneStatus !== 'displayed' || object.imageUse !== 'none') {
      throw new Error(object.id + ': unlicensed or unsupported object treatment');
    }
    if (!object.title.trim() || !object.note.trim() || !expectedLenses.has(object.sceneDate)) {
      throw new Error(object.id + ': object details or scene date are missing');
    }
    const reference = object.museumReference;
    if (!reference.collection.trim() || !reference.accession.trim() || !reference.cataloguedDate.trim() || !reference.mint.trim()) {
      throw new Error(object.id + ': museum reference details are missing');
    }
    if (new URL(reference.catalogUrl).protocol !== 'https:' || sourceById.get(reference.sourceId)?.url !== reference.catalogUrl) {
      throw new Error(object.id + ': museum reference needs a matching HTTPS source');
    }
    if (!Number.isInteger(reference.mintedCe) || reference.mintedCe > Number(object.sceneDate)) {
      throw new Error(object.id + ': reference coin postdates its scene');
    }
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

  if (!changeSets['632'] || !changeSets['661'] || !changeSets['680']) {
    throw new Error('The 632, 661 and 680 scenes need change sets');
  }
  for (const [date, changeSet] of Object.entries(changeSets)) {
    if (!expectedLenses.has(date)) throw new Error(date + ': unsupported change-set date');
    if (!changeSet.description.trim() || !changeSet.labels.length) {
      throw new Error(date + ': change set needs a description and labels');
    }
    const labelIds = new Set<string>();
    for (const label of changeSet.labels) {
      if (!label.id.trim() || !label.title.trim() || !label.inRoom.trim() || !label.inRecord.trim()) {
        throw new Error(date + ': every label needs an id, title, and both explanations');
      }
      if (labelIds.has(label.id)) throw new Error(date + ': label IDs must be unique');
      labelIds.add(label.id);
      if (!sourceIds.has(label.sourceId)) throw new Error(date + ': label source is missing');
      if (label.objectId) {
        const object = objectById.get(label.objectId);
        if (!object || object.sceneDate !== date) throw new Error(date + ': label object is missing or belongs to another date');
        if (object.museumReference.sourceId !== label.sourceId) {
          throw new Error(date + ': object label needs its museum source');
        }
      }
    }
    const sceneIds = date === '632' ? Object.values(ABSENT_632_IDS)
      : date === '661' ? Object.values(ADDED_661_IDS) : Object.values(MISSING_680_IDS);
    if (labelIds.size !== sceneIds.length || sceneIds.some(id => !labelIds.has(id))) {
      throw new Error(date + ': labels must match every scene object');
    }
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

export function renderPage(
  data: Experience = experience,
  records: Source[] = sources,
  changeSets: Changes = changes,
  objectRecords: ObjectRecord[] = objects,
): string {
  validateContent(data, records, changeSets, objectRecords);
  const e = escapeHtml;
  const roomDates = ['632', '661', '680'] as const;
  const sourceById = new Map(records.map(source => [source.id, source]));
  const renderLabels = (date: typeof roomDates[number]) => changeSets[date].labels.map(label => {
    const source = sourceById.get(label.sourceId)!;
    return `<li data-change-id="${e(label.id)}">
      <h4>${e(label.title)}</h4>
      <p><strong>In this room:</strong> ${e(label.inRoom)}</p>
      <p><strong>In the record:</strong> ${e(label.inRecord)} <a href="#source-${e(label.sourceId)}">Source: ${e(source.author)}, ${e(source.locator)}</a></p>
    </li>`;
  }).join('');
  const roomContent = roomDates.map(date => `<div data-room-panel="${date}"${date === '632' ? '' : ' hidden'}>
      <p id="room-description-${date}" class="room-note">${e(changeSets[date].description)} Turn around to see the yard, low wall, and well; look up to see the palm.</p>
      <a class="read-link" data-read-room-date="${date}" href="#moment-${date}">Read the ${date} passage</a>
      <details class="things-here">
        <summary>Things here · ${date} CE</summary>
        <ol>${renderLabels(date)}</ol>
      </details>
    </div>`).join('');
  const roomDateButtons = roomDates.map(date => {
    const lens = data.moments.find(moment => moment.id === date)!.lens;
    return `<button type="button" data-room-date="${date}" data-room-lens="${e(lens.toLowerCase())}" aria-pressed="${date === '632'}">${date} CE · ${e(lens)}</button>`;
  }).join('');
  const openingLens = data.moments.find(moment => moment.id === '632')!.lens.toLowerCase();
  const navigation = data.moments.map(moment =>
    `<a href="#moment-${e(moment.id)}">${e(moment.id)} CE · ${e(moment.title)}</a>`
  ).join('');
  const moments = data.moments.map(moment => {
    const date = roomDates.find(date => date === moment.id);
    const sceneNotes = date ? `
      <details class="things-here">
        <summary>${date} scene notes and sources</summary>
        <p class="room-note">${e(changeSets[date].description)}</p>
        <ol>${renderLabels(date)}</ol>
      </details>` : '';
    return `<article class="moment" id="moment-${e(moment.id)}">
      <p class="lens">Look for what is ${e(moment.lens.toLowerCase())}</p>
      <h3 tabindex="-1">${e(moment.id)} CE — ${e(moment.title)}</h3>
      <p>${e(moment.passage)}</p>
      <a href="#source-${e(moment.sourceId)}">Historical source</a>${sceneNotes}
    </article>`;
  }).join('');
  const sourceList = records.map(source =>
    `<li id="source-${e(source.id)}"><a href="${e(source.url)}">${e(source.author)}, ${e(source.title)}</a>. ${e(source.publisher)}, ${e(source.locator)}.</li>`
  ).join('');

  return `<main>
    <header class="intro">
      <h1>After 632</h1>
      <p class="opening">${e(data.opening)}</p>
      <p class="setting">${e(data.setting)}</p>
      <div class="entry-actions">
        <button type="button" id="enter-room" aria-controls="room-view" aria-expanded="false" hidden>Enter the room</button>
        <a class="read-link" id="read-link" href="#reading">Read without 3D</a>
      </div>
      <p id="scene-status" role="status" aria-live="polite"></p>
    </header>
    <section id="room-view" aria-labelledby="room-title" hidden>
      <h2 id="room-title" tabindex="-1">632 CE · Inside the imagined room</h2>
      <p class="setting">${e(data.setting)}</p>
      <p id="room-lens" class="lens">Look for what is ${e(openingLens)}</p>
      <div class="room-dates" role="group" aria-label="Room date">
        ${roomDateButtons}
      </div>
      <div class="compare-controls" role="group" aria-label="Compare room dates">
        <button type="button" id="compare-hold" aria-pressed="false" aria-describedby="compare-help" disabled>Hold to compare</button>
        <button type="button" id="compare-toggle" aria-pressed="false" aria-describedby="compare-help" disabled>Keep earlier date visible</button>
      </div>
      <p id="compare-help" class="room-note">Choose 661 or 680 CE to compare with the previous date from the same viewpoint.</p>
      <div id="scene-frame" class="scene-frame" role="group" tabindex="0" aria-label="Look around the imagined room" aria-describedby="room-description-632 room-help"></div>
      <p id="room-help">Drag to look around, or focus the view and use the arrow keys.</p>
      <div class="look-controls" role="group" aria-label="View controls">
        <button type="button" data-look="left">Look left</button>
        <button type="button" data-look="right">Look right</button>
        <button type="button" data-look="up">Look up</button>
        <button type="button" data-look="down">Look down</button>
        <button type="button" data-look="reset">Reset view</button>
        <button type="button" id="return-reading">Return to reading</button>
      </div>
      ${roomContent}
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
    <p>This room is imagined. Its objects are interpretations, not evidence of these events.</p>
  </footer>`;
}
