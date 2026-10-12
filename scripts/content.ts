import experience from '../content/experience.json' with { type: 'json' };
import sources from '../content/sources.json' with { type: 'json' };
import news from '../content/news.json' with { type: 'json' };

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}
const e = escapeHtml;
const dateLabel = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
export function validateContent(release = false) {
  const ids = new Set<string>();
  const validSources = new Set(sources.map(source => source.id));
  for (const moment of experience.moments) {
    if (ids.has(moment.id) || moment.id !== String(moment.year) || !['632', '661', '680'].includes(moment.id)) throw new Error('Invalid moment identity');
    ids.add(moment.id);
    if (!moment.body.trim() || moment.body.trim().split(/\s+/).length > 60) throw new Error(`${moment.id}: passage must be 1–60 words`);
    if (!moment.sourceIds.length || moment.sourceIds.some(id => !validSources.has(id))) throw new Error(`${moment.id}: missing source`);
    if (release && moment.reviewStatus !== 'source-checked') throw new Error(`${moment.id}: source review missing`);
  }
  for (const source of [...sources, ...news]) {
    if (new URL(source.url).protocol !== 'https:') throw new Error('Sources must use HTTPS');
  }
  for (const report of news) {
    if (report.status === 'verified' && (!report.headline || !report.publishedOn || !/^\d{4}-\d{2}-\d{2}$/.test(report.publishedOn) || !report.checkedOn)) throw new Error('Verified news requires exact metadata');
  }
  if (release && (ids.size !== 3 || news.length !== 2 || news.some(report => report.status !== 'verified'))) throw new Error('Release requires all three moments and two verified news reports');
}

function courtyardPhoto() {
  return `<img class="courtyard-art" src="./assets/courtyard-hero.webp" width="1920" height="1200" data-photo-moment="632" alt="An imagined earthen courtyard with palm-branch shade and sunlight; an interpretive rendering." decoding="async">`;
}

function reportCards() {
  return news.map((report, index) => report.status === 'verified' && report.headline && report.publishedOn
    ? `<article class="report-card"><div class="eyebrow">${e(report.publisher)} <span aria-hidden="true">/</span> <time datetime="${report.publishedOn}">${dateLabel(report.publishedOn)}</time></div><h3><a href="${e(report.url)}">${e(report.headline)} <span aria-hidden="true">↗</span></a></h3><p>${e(report.summary ?? '')}</p><span class="report-type">Dated reporting · Read at the source</span></article>`
    : `<article class="report-card report-pending"><div class="eyebrow">Source review in progress</div><h3>A second perspective is on its way.</h3><p>The second report supplied in the project brief could not yet be verified. This preview will be updated with a checked, dated report before course use.</p></article>`).join('');
}

export function renderPage() {
  validateContent();
  const page = `<a class="skip-link" href="#main">Skip to content</a>
  <header class="masthead"><a class="wordmark" href="#top" aria-label="After 632, back to top">AFTER <span>632</span></a><nav aria-label="Main navigation"><a href="#courtyard">The courtyard</a><a href="#reports">Into the present <span aria-hidden="true">↗</span></a><a href="#sources">Sources</a></nav><span class="edition">A SHORT HISTORY EXPERIENCE</span></header>
  <main id="main">
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="hero-copy"><div class="eyebrow intro-kicker"> AUTHORITY. MEMORY. WHAT COMES AFTER.</div>
        <h1 id="hero-title"><span class="after">After</span><span class="year">632<span class="year-period">.</span></span></h1>
        <div class="title-ribbon">One courtyard. Three moments.</div>
        <p class="opening-question">${e(experience.opening)}</p>
        <div class="hero-actions"><a href="#courtyard" class="button button-coral" data-enter>Enter the courtyard <span aria-hidden="true">↗</span></a><a class="text-link" href="#courtyard" data-reading>Read the history <span aria-hidden="true">→</span></a></div>
        <p class="visit-note"><span aria-hidden="true">◷</span> About six minutes. At your own pace.</p>
      </div>
      <figure class="hero-visual"><img class="hero-photo" src="./assets/courtyard-hero.webp" width="1920" height="1200" alt="Sunlight across an imagined earthen courtyard, with natural palm fronds and a woven shade canopy." fetchpriority="high"></figure><div class="poster-caption"><span class="caption-number">AN INTERPRETIVE SETTING</span>${e(experience.setting)}</div>
    </section>
    <div class="chapter-strip" aria-label="Historical moments"><span>632 <small>SUCCESSION</small></span><span>661 <small>POLITICAL STRUGGLE</small></span><span>680 <small>REMEMBRANCE</small></span><span class="strip-end">ONE SHARED HISTORY</span></div>
    <section class="common-ground" aria-labelledby="shared-title"><div class="section-kicker"><span class="section-index">01</span> BEFORE WE BEGIN</div><h2 id="shared-title">Different traditions.<br><em>Shared foundations.</em></h2><div class="common-copy"><p>${e(experience.shared)}</p><p class="small-copy">These three dates illuminate origins. They do not explain every later difference—or a conflict in today's news.</p></div></section>
    <section class="journey" id="courtyard" aria-labelledby="journey-title">
      <div class="journey-heading"><div><div class="section-kicker"><span class="section-index">02</span> INSIDE THE COURTYARD</div><h2 id="journey-title" tabindex="-1">The same place.<br><em>A different moment.</em></h2></div><p>Stay a while. Look around.<br>Move through time, or simply read.</p></div>
      <div class="date-navigation" aria-label="Choose a historical moment">${experience.moments.map((moment, index) => `<a class="date-choice" href="#moment-${moment.id}" data-date="${moment.id}"><span class="date-index">0${index + 1}</span><strong>${moment.year}<small> CE</small></strong><span>${e(moment.label)}</span><span class="date-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>
      <div class="experience-layout">
        <div class="scene-column"><div class="scene-frame"><div id="scene" aria-hidden="true"></div><div class="scene-poster" id="scene-poster">${courtyardPhoto()}</div><div class="scene-badge"><span class="status-dot"></span> AN IMAGINED COURTYARD</div><div class="scene-entry" id="scene-entry"><button class="button button-gold" data-enter hidden>Look around <span aria-hidden="true">↗</span></button><noscript><p>The complete reading experience is below. Enable JavaScript only if you want to look around.</p></noscript></div></div>
          <p class="setting-note">${e(experience.setting)}</p>
          <p id="scene-status" role="status" aria-live="polite"></p>
          <div class="view-controls" id="view-controls" hidden role="group" aria-label="Courtyard view"><button data-view="left" aria-label="Look left">←</button><button data-view="up" aria-label="Look up">↑</button><button data-view="down" aria-label="Look down">↓</button><button data-view="right" aria-label="Look right">→</button><button data-view="reset">Reset view</button><button id="pause-motion" aria-pressed="false">Pause movement</button><button id="skip-motion">Skip movement</button></div>
          <div class="scene-help" id="scene-help" hidden><span>Drag left or right, or use the view buttons.</span><button class="text-link" data-reading>Read the history →</button></div>
        </div>
        <div class="moments" id="moments">${experience.moments.map((moment, index) => `<article class="moment-card" id="moment-${moment.id}" data-moment-id="${moment.id}"><div class="moment-top"><span class="eyebrow">MOMENT 0${index + 1} <span aria-hidden="true">/</span> ${experience.moments.length === 1 ? 'FIRST LOOK' : 'OF 03'}</span></div><div class="moment-year" aria-hidden="true">${moment.year}<small>CE</small></div><h3 tabindex="-1">${e(moment.title)}</h3><p class="moment-body">${e(moment.body)}</p><details><summary>A little more context <span aria-hidden="true">+</span></summary><p>${e(moment.note)}</p><a href="${e(sources[0].url)}">Read the historical source ↗</a></details><a class="moment-source" href="#source-HIST-01">Source: Parkinson, chapter 8 ↗</a></article>`).join('')}</div>
      </div>
      <div class="journey-bottom"><p>No single moment tells the whole story.</p><a href="#reports" class="button button-outline">Continue to the reports <span aria-hidden="true">↗</span></a></div><p class="sr-only" id="moment-announcement" aria-live="polite"></p>
    </section>
    <section class="reports" id="reports" aria-labelledby="reports-title"><div class="section-kicker"><span class="section-index">03</span> INTO THE PRESENT</div><div class="reports-intro"><h2 id="reports-title" tabindex="-1">History opens<br><em>a question.</em></h2><div><p class="reports-deck">It doesn't close the case.</p><p>Older history can sharpen our questions. Understanding Yemen also means learning about its own politics, communities, and changing alliances.</p><p class="small-copy">The Houthis have a Zaydi Shi'a background, distinct from Iran's Twelver Shi'a tradition. Religious labels alone do not explain the conflict. <a href="#source-CTX-01">Explore the context ↗</a></p></div></div><div class="report-grid">${reportCards()}</div><p class="report-date-note">These are dated reports, not live updates. Check the reporting again before using this experience in a later course term.</p>
      <div class="reflection"><div><div class="eyebrow">TAKE A QUESTION WITH YOU</div><h3>${e(experience.invitation)}</h3><p>Your reflection belongs to you. Continue with your course materials and the reporting, outside this experience.</p></div></div>
    </section>
    <section class="sources" id="sources" aria-labelledby="sources-title"><div><div class="section-kicker"><span class="section-index">04</span> KEEP EXPLORING</div><h2 id="sources-title">The source shelf<span aria-hidden="true">.</span></h2><p>A beginning, not the whole history.</p></div><div class="source-list">${sources.map(source => `<details id="source-${source.id}"><summary><span>${e(source.title)}<small>${e(source.author)}</small></span><span aria-hidden="true">+</span></summary><p>${e(source.publisher)}. ${e(source.locator)}.</p><a href="${e(source.url)}">Open source ↗</a></details>`).join('')}<details><summary><span>Design & making<small>A note on the setting and the visual language</small></span><span aria-hidden="true">+</span></summary><p>The courtyard is an imagined setting, rendered with photographic materials and light. It is not a reconstruction or a photograph of a documented place. No historical figures are depicted.</p><p>Typography: Georgia and locally bundled DM Sans under the SIL Open Font License. <a href="./assets/fonts/dm-sans-LICENSE.txt">Font license</a> · <a href="./assets/three-LICENSE.txt">Three.js MIT license</a>. Local CC0 Poly Haven assets: <a href="https://polyhaven.com/a/clay_plaster">clay plaster</a>, <a href="https://polyhaven.com/a/sand_01">sand</a>, <a href="https://polyhaven.com/a/palm_tree_bark">palm bark</a>, <a href="https://polyhaven.com/a/rough_wood">rough wood</a>, and <a href="https://polyhaven.com/a/syferfontein_18d_clear_puresky">pure sky HDRI</a>. The sky is not presented as a historical or geographic backdrop. No audio is used.</p></details></div></section>
  </main><footer><a class="wordmark" href="#top">AFTER <span>632</span></a><p>Look back. Look again. Keep asking.</p><a href="#top">Back to the beginning ↑</a></footer>`;
  return page.replaceAll('↗', '<svg class="inline-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19L19 5M5 5h14v14" stroke="currentColor" stroke-width="1.8"/></svg>');
}
