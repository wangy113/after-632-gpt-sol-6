import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

function requireRecord(condition, message) {
  if (!condition) throw new Error(message);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function httpsLink(url, label) {
  requireRecord(new URL(url).protocol === 'https:', `${label} needs an HTTPS URL`);
  return `<a href="${escapeHtml(url)}">`;
}

function sectionBetween(html, opening, closing, label) {
  const start = html.indexOf(opening);
  const end = start < 0 ? -1 : html.indexOf(closing, start + opening.length);
  requireRecord(start >= 0 && end >= 0, `Built ${label} is missing`);
  return html.slice(start, end + closing.length);
}

/** Check that the built pages expose the citations and credits in their source records. */
export function checkBuiltContent({ indexHtml, exitHtml, experience, changes, sources, reporting, assets, objects }) {
  const footer = sectionBetween(indexHtml, '<footer>', '</footer>', 'reading-page source shelf');
  const sourceIds = new Set();
  for (const source of sources) {
    requireRecord(!sourceIds.has(source.id), `Repeated historical source ID: ${source.id}`);
    sourceIds.add(source.id);
    const citationStart = `<li id="source-${escapeHtml(source.id)}">${httpsLink(source.url, source.id)}`;
    requireRecord(footer.includes(citationStart), `${source.id}: built source shelf is missing its matching link`);
  }

  let labelCount = 0;
  for (const moment of experience.moments) {
    const article = sectionBetween(indexHtml,
      `<article class="moment" id="moment-${escapeHtml(moment.id)}">`, '</article>', `${moment.id} passage`);
    const passage = article.split('<details', 1)[0];
    for (const id of [moment.sourceId, ...(moment.additionalSourceIds ?? [])]) {
      requireRecord(passage.includes(`href="#source-${escapeHtml(id)}"`),
        `${moment.id}: built passage is missing source ${id}`);
    }
  }
  for (const [date, changeSet] of Object.entries(changes)) {
    for (const label of changeSet.labels) {
      const entries = [...indexHtml.matchAll(new RegExp(
        `<li data-change-id="${escapeHtml(label.id)}">([\\s\\S]*?)<\\/li>`, 'g'))].map(match => match[1]);
      requireRecord(entries.length === 2 && entries.every(entry =>
        entry.includes(`href="#source-${escapeHtml(label.sourceId)}"`)),
      `${date}/${label.id}: room and reading labels need the cited source`);
      labelCount++;
    }
  }

  const textbook = sources.find(source => source.id === 'HIST-01');
  requireRecord(textbook?.license?.id === 'CC-BY-SA-4.0' &&
    textbook.license.url === 'https://creativecommons.org/licenses/by-sa/4.0/',
  'HIST-01 needs its recorded CC BY-SA 4.0 license');
  const textbookCredit = sectionBetween(footer, '<p>Textbook credit:', '</p>', 'textbook credit');
  requireRecord(textbookCredit.includes('<a href="#source-HIST-01">') &&
    textbookCredit.includes(`${httpsLink(textbook.license.url, 'Textbook license')}CC BY-SA 4.0</a>`),
  'Built textbook credit needs the source and its CC BY-SA 4.0 license link');

  const assetSources = [...assets.textures, ...assets.skies];
  for (const asset of assetSources) {
    requireRecord(footer.includes(httpsLink(asset.sourceUrl, `Poly Haven ${asset.id}`)),
      `${asset.id}: built material and sky credits are missing the source link`);
  }
  requireRecord(assets.license.id === 'CC0-1.0' &&
    footer.includes(`${httpsLink(assets.license.url, 'Poly Haven license')}CC0</a>`),
  'Built material and sky credits need the recorded Poly Haven CC0 link');

  const reportCards = [...exitHtml.matchAll(/<li class="report-card">([\s\S]*?)<\/li>/g)]
    .map(match => match[1]);
  requireRecord(reportCards.length === reporting.reports.length,
    'Built exit needs one card for each report');
  for (const report of reporting.reports) {
    const card = reportCards.find(item => item.includes(httpsLink(report.url, report.id)));
    requireRecord(card && card.includes(`<time datetime="${escapeHtml(report.publishedOn)}">`),
      `${report.id}: built report link and publication date must stay together`);
  }
  const contextShelf = sectionBetween(exitHtml, '<section class="exit-sources"', '</section>', 'context source shelf');
  for (const source of reporting.context.sources) {
    requireRecord(contextShelf.includes(httpsLink(source.url, source.id)),
      `${source.id}: built exit source shelf is missing its link`);
  }
  for (const claim of reporting.context.claims) {
    const source = reporting.context.sources.find(item => item.id === claim.sourceId);
    requireRecord(source && exitHtml.includes(`<p>${escapeHtml(claim.text)} ${httpsLink(source.url, source.id)}`),
      `${claim.sourceId}: built context claim is missing its inline source link`);
  }
  requireRecord(exitHtml.includes(`<time datetime="${escapeHtml(reporting.checkedOn)}">`),
    'Built exit is missing the report and context check date');

  requireRecord(objects.every(object => object.imageUse === 'none'),
    'A collection photograph needs a license-aware content check before display');
  const imageTags = [...(indexHtml + exitHtml).matchAll(/<img\b[^>]*>/gi)].map(match => match[0]);
  requireRecord(imageTags.length === 1 && /\bid="arrival-still"/.test(imageTags[0]),
    'The current built pages must have only the local arrival still, not a collection photograph');

  return { historicalSources: sources.length, labels: labelCount, reports: reportCards.length,
    contextSources: reporting.context.sources.length, polyHavenAssets: assetSources.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [indexHtml, exitHtml, experience, changes, sources, reporting, assets, objects] = await Promise.all([
    readFile(join(repositoryRoot, 'dist/index.html'), 'utf8'),
    readFile(join(repositoryRoot, 'dist/exit.html'), 'utf8'),
    readFile(join(repositoryRoot, 'content/experience.json'), 'utf8').then(JSON.parse),
    readFile(join(repositoryRoot, 'content/changes.json'), 'utf8').then(JSON.parse),
    readFile(join(repositoryRoot, 'content/sources.json'), 'utf8').then(JSON.parse),
    readFile(join(repositoryRoot, 'content/reporting.json'), 'utf8').then(JSON.parse),
    readFile(join(repositoryRoot, 'assets.config.json'), 'utf8').then(JSON.parse),
    readFile(join(repositoryRoot, 'content/objects.json'), 'utf8').then(JSON.parse),
  ]);
  const checked = checkBuiltContent({ indexHtml, exitHtml, experience, changes, sources, reporting, assets, objects });
  console.log(`Verified ${checked.historicalSources} historical source links, ${checked.labels} paired room/reading labels, ${checked.reports} dated reports, ` +
    `${checked.contextSources} context source links, and ${checked.polyHavenAssets} Poly Haven credits.`);
  console.log('Verified textbook and CC0 license links; no collection photograph is included.');
}
