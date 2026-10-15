import reporting from '../content/reporting.json' with { type: 'json' };
import { escapeHtml } from './content';

interface Report {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publishedOn: string;
  url: string;
  focus: string;
}

interface ContextSource {
  id: string;
  title: string;
  author: string;
  publisher: string;
  dateLabel: string;
  locator: string;
  url: string;
}

export interface ReportingExit {
  checkedOn: string;
  intro: string;
  reports: Report[];
  context: { claims: { text: string; sourceId: string }[]; closing: string; sources: ContextSource[] };
  invitation: string;
  optionalLenses: string[];
}

const plannedInvitation = 'What does this older history help you notice, and what would you still need to learn about this conflict?';

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function displayDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

export function validateReportingExit(data: ReportingExit = reporting): void {
  if (!isIsoDate(data.checkedOn)) throw new Error('Reporting source check needs a valid date');
  if (!data.intro.trim() || !data.context?.closing.trim() || data.invitation !== plannedInvitation) {
    throw new Error('Reporting exit needs context and the planned invitation');
  }
  if (data.reports?.length !== 2 || data.context.sources?.length !== 2 || data.context.claims?.length !== 2 ||
      data.optionalLenses?.length !== 3 ||
      data.optionalLenses.some(lens => !lens.trim())) {
    throw new Error('Reporting exit needs two reports, two sourced context claims, and three optional lenses');
  }

  const ids = new Set<string>();
  const urls = new Set<string>();
  for (const source of [...data.reports, ...data.context.sources]) {
    if (!source.id.trim() || ids.has(source.id) || !source.title.trim() || !source.author.trim() || !source.publisher.trim()) {
      throw new Error('Reporting sources need unique IDs and complete citations');
    }
    ids.add(source.id);
    const url = new URL(source.url);
    if (url.protocol !== 'https:' || urls.has(url.href)) throw new Error('Reporting sources need unique HTTPS links');
    urls.add(url.href);
  }
  for (const report of data.reports) {
    if (!report.focus.trim() || !isIsoDate(report.publishedOn) || report.publishedOn > data.checkedOn) {
      throw new Error('Each report needs a focus and a valid publication date no later than its check');
    }
  }
  for (const source of data.context.sources) {
    if (!source.dateLabel.trim() || !source.locator.trim()) {
      throw new Error('Context sources need their dates and locators');
    }
  }
  const contextIds = new Set(data.context.sources.map(source => source.id));
  const claimIds = new Set<string>();
  for (const claim of data.context.claims) {
    if (!claim.text.trim() || !contextIds.has(claim.sourceId) || claimIds.has(claim.sourceId)) {
      throw new Error('Each context claim needs a distinct context source');
    }
    claimIds.add(claim.sourceId);
  }
}

export function renderReportingExit(data: ReportingExit = reporting): string {
  validateReportingExit(data);
  const e = escapeHtml;
  const reportList = data.reports.map(report => `<li class="report-card">
      <p class="report-date"><time datetime="${e(report.publishedOn)}">${e(displayDate(report.publishedOn))}</time> · ${e(report.publisher)}</p>
      <h3><a href="${e(report.url)}">${e(report.title)}</a></h3>
      <p>${e(report.focus)}</p>
      <p class="source-credit">Reported by ${e(report.author)}.</p>
    </li>`).join('');
  const contextSources = data.context.sources.map(source =>
    `<li><a href="${e(source.url)}">${e(source.author)}, ${e(source.title)}</a>. ${e(source.publisher)}, ${e(source.dateLabel)}, ${e(source.locator)}.</li>`
  ).join('');
  const contextById = new Map(data.context.sources.map(source => [source.id, source]));
  const contextClaims = data.context.claims.map(claim => {
    const source = contextById.get(claim.sourceId)!;
    return `<p>${e(claim.text)} <a href="${e(source.url)}">Source: ${e(source.publisher)}</a></p>`;
  }).join('');
  const optionalLenses = data.optionalLenses.map(lens => `<li>${e(lens)}</li>`).join('');

  return `<header class="exit-intro">
      <p class="exit-kicker">After 632</p>
      <h1>Into the present</h1>
      <p>${e(data.intro)}</p>
    </header>
    <section aria-labelledby="reports-title">
      <h2 id="reports-title">Two reports to read</h2>
      <ol class="report-list">${reportList}</ol>
    </section>
    <section class="exit-context" aria-labelledby="context-title">
      <h2 id="context-title">A note on Zaydi and Twelver traditions</h2>
      ${contextClaims}
      <p>${e(data.context.closing)}</p>
    </section>
    <section class="exit-invitation" aria-labelledby="invitation-title">
      <h2 id="invitation-title">A question to take with you</h2>
      <p>${e(data.invitation)}</p>
      <details>
        <summary>Optional lenses for reading the reports</summary>
        <ul>${optionalLenses}</ul>
      </details>
    </section>
    <section class="exit-sources" aria-labelledby="context-sources">
      <h2 id="context-sources">Context sources</h2>
      <ol>${contextSources}</ol>
      <p class="source-credit">Report links and context sources checked <time datetime="${e(data.checkedOn)}">${e(displayDate(data.checkedOn))}</time>. The reports describe their publication dates, not the current state of the conflict.</p>
    </section>
    <p class="exit-back"><a href="./index.html#reading">Return to the three dates</a></p>`;
}
