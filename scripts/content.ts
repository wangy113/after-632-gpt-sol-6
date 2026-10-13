import experience from '../content/experience.json' with { type: 'json' };
import sources from '../content/sources.json' with { type: 'json' };
import changes from '../content/changes.json' with { type: 'json' };
import views from '../content/views.json' with { type: 'json' };
import objects from '../content/objects.json' with { type: 'json' };
import { ABSENT_632_IDS, ADDED_661_IDS, MISSING_680_IDS, type RoomDate } from '../src/schema/changeIds';
import { PLACE_IDS, PLACE_LABELS, PLACE_ORIENTATIONS, type PlaceId } from '../src/state/places';
import { TURN_DIRECTIONS } from '../src/state/viewDirections';

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

export type ViewDescriptions = Record<RoomDate, {
  recordLabelId: string;
  places: Record<PlaceId, string>;
}> & { turned: Record<PlaceId, Record<typeof TURN_DIRECTIONS[number], string>> };

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
  viewDescriptions: ViewDescriptions = views,
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
  for (const date of expectedLenses.keys()) {
    const view = viewDescriptions[date as RoomDate];
    if (!view || !changeSets[date].labels.some(label => label.id === view.recordLabelId)) {
      throw new Error(date + ': view description needs a sourced record label');
    }
    for (const place of PLACE_IDS) {
      if (!view.places?.[place]?.trim()) throw new Error(date + ': view description missing for ' + place);
    }
  }
  for (const place of PLACE_IDS) {
    for (const direction of TURN_DIRECTIONS) {
      if (!viewDescriptions.turned?.[place]?.[direction]?.trim()) {
        throw new Error(place + ': turned view description missing for ' + direction);
      }
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
  viewDescriptions: ViewDescriptions = views,
): string {
  validateContent(data, records, changeSets, objectRecords, viewDescriptions);
  const e = escapeHtml;
  const roomDates = ['632', '661', '680'] as const;
  const sourceById = new Map(records.map(source => [source.id, source]));
  const viewRecord = (date: RoomDate) => changeSets[date].labels.find(label => label.id === viewDescriptions[date].recordLabelId)!;
  const renderViewRecord = (date: RoomDate) => {
    const record = viewRecord(date);
    const source = sourceById.get(record.sourceId)!;
    return `<strong>In the record:</strong> ${e(record.inRecord)} <a href="#source-${e(record.sourceId)}">Source: ${e(source.author)}, ${e(source.locator)}</a>`;
  };
  const renderLabels = (date: typeof roomDates[number]) => changeSets[date].labels.map(label => {
    const source = sourceById.get(label.sourceId)!;
    return `<li data-change-id="${e(label.id)}">
      <h4>${e(label.title)}</h4>
      <p><strong>In this room:</strong> ${e(label.inRoom)}</p>
      <p><strong>In the record:</strong> ${e(label.inRecord)} <a href="#source-${e(label.sourceId)}">Source: ${e(source.author)}, ${e(source.locator)}</a></p>
    </li>`;
  }).join('');
  const roomContent = roomDates.map(date => `<div data-room-panel="${date}"${date === '632' ? '' : ' hidden'}>
      <p id="room-description-${date}" class="room-note">${e(changeSets[date].description)}</p>
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
  const roomPlaceButtons = PLACE_IDS.map(place =>
    `<button type="button" data-room-place="${place}" aria-pressed="${place === 'doorway'}">${e(PLACE_LABELS[place])}</button>`
  ).join('');
  const openingLens = data.moments.find(moment => moment.id === '632')!.lens.toLowerCase();
  const navigation = data.moments.map(moment =>
    `<a href="#moment-${e(moment.id)}">${e(moment.id)} CE · ${e(moment.title)}</a>`
  ).join('');
  const moments = data.moments.map(moment => {
    const date = roomDates.find(date => date === moment.id);
    const sceneNotes = date ? `
      <details class="view-notes">
        <summary>Views from four places · ${date} CE</summary>
        <p>These describe the starting direction at each place in the imagined room. You can read them without 3D.</p>
        <dl>${PLACE_IDS.map(place => `<dt>${e(PLACE_LABELS[place])}</dt><dd>${e(viewDescriptions[date].places[place])}</dd>`).join('')}</dl>
        <p>${renderViewRecord(date)}</p>
      </details>
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
      <figure class="arrival-still">
        <img id="arrival-still" src="./stills/632-arrival.webp" width="864" height="487" fetchpriority="high" alt="A rendered view of the imagined 632 CE room from the doorway: mats sit in an open circle around three cups, and footprints cross the floor.">
        <figcaption>632 CE · A material preview of an imagined room, not a reconstruction of a documented place.</figcaption>
      </figure>
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
      <div class="room-places" role="group" aria-label="Place to stand">
        ${roomPlaceButtons}
      </div>
      <div class="scene-shell">
        <div id="scene-frame" class="scene-frame" role="group" tabindex="0" aria-label="Look around the imagined room" aria-describedby="room-description-632 room-help"></div>
        <p id="date-transition-caption" class="date-transition-caption" aria-hidden="true" hidden></p>
      </div>
      <p id="room-help">${e(PLACE_ORIENTATIONS.doorway)} Drag to look around, or focus the view and use the arrow keys.</p>
      <details id="describe-view" class="describe-view">
        <summary>Describe this view</summary>
        <div id="view-description" aria-live="polite" aria-atomic="true">
          <p id="view-location">632 CE · Doorway · starting view.</p>
          <p><strong>In this imagined view:</strong> <span id="view-imagined">${e(viewDescriptions['632'].places.doorway)}</span></p>
          <p id="view-starting" hidden><strong>At the starting direction:</strong> <span id="view-starting-text"></span> Use Reset view to face it.</p>
          <p id="view-history"><strong>In the record:</strong> <span id="view-record-text">${e(viewRecord('632').inRecord)}</span> <a id="view-record-source" href="#source-${e(viewRecord('632').sourceId)}">Source: ${e(sourceById.get(viewRecord('632').sourceId)!.author)}, ${e(sourceById.get(viewRecord('632').sourceId)!.locator)}</a></p>
        </div>
      </details>
      <div class="look-controls" role="group" aria-label="View controls">
        <button type="button" data-look="left">Look left</button>
        <button type="button" data-look="right">Look right</button>
        <button type="button" data-look="up">Look up</button>
        <button type="button" data-look="down">Look down</button>
        <button type="button" data-look="reset">Reset view</button>
        <button type="button" id="skip-movement" aria-describedby="skip-movement-help">Skip movement</button>
        <button type="button" id="pause-motion" aria-pressed="false" aria-describedby="pause-motion-help">Pause motion</button>
        <button type="button" id="return-reading">Return to reading</button>
      </div>
      <p id="skip-movement-help" class="room-note">Finish a camera move or date change immediately. Press Escape while using the room, or choose Skip movement. If none is underway, the view stays as it is.</p>
      <p id="pause-motion-help" class="room-note">Pause motion finishes any current move or date change and makes later changes immediate. Press again to resume motion. Your system reduced-motion setting still applies.</p>
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
    <h2>Material and sky credits</h2>
    <p>Room wall and floor textures: <a href="https://polyhaven.com/a/clay_plaster">clay_plaster</a> and <a href="https://polyhaven.com/a/clay_floor_001">clay_floor_001</a> by Poly Haven, <a href="https://polyhaven.com/license">CC0</a>.</p>
    <p>Sky preview: <a href="https://polyhaven.com/a/qwantani_morning_puresky">Qwantani morning</a> by Poly Haven, <a href="https://polyhaven.com/license">CC0</a>. <a href="https://polyhaven.com/a/qwantani_mid_morning_puresky">Qwantani mid-morning</a> is an alternate comparison candidate. The HDRI changes the background only; room lighting remains a prototype.</p>
    <p>This room is imagined. Its objects are interpretations, not evidence of these events.</p>
  </footer>`;
}
