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

function illustration() {
  return `<svg class="courtyard-art" viewBox="0 0 640 560" fill="none" role="img" aria-label="An imagined courtyard with plain earth walls, palm-branch shade, and sunlight; an interpretive illustration.">
    <defs>
      <pattern id="paper-grain" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#2d3035" opacity=".13"/></pattern>
      <linearGradient id="courtyard-sky" x2="0" y2="1"><stop stop-color="#8ed6c0"/><stop offset="1" stop-color="#c6e4b7"/></linearGradient>
      <clipPath id="scene-clip"><rect width="640" height="560" rx="2"/></clipPath>
    </defs>
    <g clip-path="url(#scene-clip)">
      <path fill="url(#courtyard-sky)" d="M0 0h640v560H0z"/>
      <circle cx="422" cy="131" r="68" fill="#ffe176"/><circle cx="422" cy="131" r="83" stroke="#fbf2c8" stroke-width="2"/>
      <path d="M370 131h104M422 79v104M385 94l74 74M459 94l-74 74" stroke="#f6cc62" stroke-width="2" opacity=".7"/>
      <path d="M0 260L336 221 640 293V560H0Z" fill="#dcb785"/>
      <path d="M0 176L306 232V379L0 307Z" fill="#b98969" stroke="#44352c" stroke-width="2"/>
      <path d="M306 232L640 158V307L306 379Z" fill="#e6bd8c" stroke="#44352c" stroke-width="2"/>
      <path d="M0 176L19 166 306 215 624 146 640 158 306 232Z" fill="#f3d6aa" stroke="#44352c" stroke-width="2"/>
      <path d="M306 379L640 307V560H0V307Z" fill="#e9c997"/>
      <path d="M86 270L315 307 555 516 217 480Z" fill="#8c7970" opacity=".43"/>
      <path d="M95 266L95 399M302 303v112M242 231v102M53 222v126" stroke="#4b4230" stroke-width="9"/>
      <path d="M42 219L238 217 321 278 98 282Z" fill="#6a7651" stroke="#434832" stroke-width="3"/>
      <path d="M47 220L103 281M67 220l61 61M88 219l64 62M110 219l67 62M130 219l69 62M152 218l71 62M173 218l74 62M196 218l76 62M217 219l78 60" stroke="#a0a275" stroke-width="8"/>
      <path d="M44 218l194-2 86 64M96 282l224-2" stroke="#4b4230" stroke-width="5"/>
      <path d="M498 364c-8-57-2-112 3-163" stroke="#795d40" stroke-width="12"/>
      <path d="M501 212c-31-48-65-34-82-19 39-4 60 9 82 19Z" fill="#3f7052"/>
      <path d="M501 212c24-51 65-48 91-23-39-7-66 8-91 23Z" fill="#467956"/>
      <path d="M501 212c-7-50 15-67 27-70-3 27-11 54-27 70Z" fill="#537e59"/>
      <path d="M501 213c-46-15-71 11-76 37 26-21 45-24 76-37Z" fill="#477852"/>
      <path d="M501 213c46-13 75 13 81 41-27-24-50-30-81-41Z" fill="#365e47"/>
      <path d="M501 213c-27-43-54-50-74-45 33 15 49 28 74 45Z" fill="#5f8960"/>
      <path d="M499 365l-62 72 61 2 51-51Z" fill="#8c7970" opacity=".34"/>
      <path d="M0 438l242 67 64-14L0 395Z" fill="#b18d6d"/><path d="M0 438l242 67v55H0Z" fill="#947054"/>
      <path d="M0 395l306 96-64 14L0 423Z" fill="#efd5a6" stroke="#44352c" stroke-width="2"/>
      <path d="M475 484c-13-27-8-41-3-47 1 20 5 24 9 28 8-26 19-28 23-28-7 18-12 29-15 47" fill="#5a7655"/>
      <path d="M0 0h640v560H0z" fill="url(#paper-grain)"/>
    </g>
  </svg>`;
}

function reportCards() {
  return news.map((report, index) => report.status === 'verified' && report.headline && report.publishedOn
    ? `<article class="report-card"><div class="eyebrow">${e(report.publisher)} <span aria-hidden="true">/</span> <time datetime="${report.publishedOn}">${dateLabel(report.publishedOn)}</time></div><h3><a href="${e(report.url)}">${e(report.headline)} <span aria-hidden="true">↗</span></a></h3><p>${e(report.summary ?? '')}</p><span class="report-type">Dated reporting · Read at the source</span></article>`
    : `<article class="report-card report-pending"><div class="eyebrow">Source review in progress</div><h3>A second perspective is on its way.</h3><p>The second report supplied in the project brief could not yet be verified. This preview will be updated with a checked, dated report before course use.</p></article>`).join('');
}

export function renderPage() {
  validateContent();
  const page = `<a class="skip-link" href="#main">Skip to content</a>
  <header class="masthead"><a class="wordmark" href="#top" aria-label="After 632, back to top">AFTER <span>632</span><span class="brand-spark" aria-hidden="true">✳</span></a><nav aria-label="Main navigation"><a href="#courtyard">The courtyard</a><a href="#reports">Into the present <span aria-hidden="true">↗</span></a><a href="#sources">Sources</a></nav><span class="edition">A SHORT HISTORY EXPERIENCE</span></header>
  <main id="main">
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="hero-copy"><div class="eyebrow intro-kicker"><span class="tiny-sun" aria-hidden="true">✳</span> AUTHORITY. MEMORY. WHAT COMES AFTER.</div>
        <h1 id="hero-title"><span class="after">AFTER</span><span class="year">632<span class="year-period">.</span></span></h1>
        <div class="title-ribbon">One courtyard. Three moments.</div>
        <p class="opening-question">${e(experience.opening)}</p>
        <div class="hero-actions"><a href="#courtyard" class="button button-coral" data-enter>Enter the courtyard <span aria-hidden="true">↗</span></a><a class="text-link" href="#courtyard" data-reading>Read without 3D <span aria-hidden="true">→</span></a></div>
        <p class="visit-note"><span aria-hidden="true">◷</span> About six minutes. At your own pace.</p>
      </div>
      <div class="hero-visual"><div class="poster-topline"><span>A SPACE TO THINK</span><span>632 — 680 CE</span></div><div class="illustration-frame">${illustration()}<div class="poster-seal" aria-hidden="true"><span>LOOK BACK.</span><b>✳</b><span>LOOK AGAIN.</span></div></div><p class="poster-caption"><span class="caption-number">FIG. 01</span> ${e(experience.setting)}</p><span class="poster-tape" aria-hidden="true"></span></div>
      <span class="hero-asterisk" aria-hidden="true">✳</span>
    </section>
    <div class="chapter-strip" aria-label="Historical moments"><span>632 <small>SUCCESSION</small></span><b aria-hidden="true">✳</b><span>661 <small>POLITICAL STRUGGLE</small></span><b aria-hidden="true">✳</b><span>680 <small>REMEMBRANCE</small></span><b aria-hidden="true">✳</b><span class="strip-end">ONE SHARED HISTORY</span></div>
    <section class="common-ground" aria-labelledby="shared-title"><div class="section-kicker"><span class="section-index">01</span> BEFORE WE BEGIN</div><h2 id="shared-title">Different traditions.<br><em>Shared foundations.</em></h2><div class="common-copy"><p>${e(experience.shared)}</p><p class="small-copy">These three dates illuminate origins. They do not explain every later difference—or a conflict in today's news.</p></div><span class="common-star" aria-hidden="true">✳</span></section>
    <section class="journey" id="courtyard" aria-labelledby="journey-title">
      <div class="journey-heading"><div><div class="section-kicker"><span class="section-index">02</span> INSIDE THE COURTYARD</div><h2 id="journey-title" tabindex="-1">The same place.<br><em>A different moment.</em></h2></div><p>Stay a while. Look around.<br>Move through time, or simply read.</p></div>
      <div class="date-navigation" aria-label="Choose a historical moment">${experience.moments.map((moment, index) => `<a class="date-choice" href="#moment-${moment.id}" data-date="${moment.id}"><span class="date-index">0${index + 1}</span><strong>${moment.year}<small> CE</small></strong><span>${e(moment.label)}</span><span class="date-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>
      <div class="experience-layout">
        <div class="scene-column"><div class="scene-frame"><div id="scene" aria-hidden="true"></div><div class="scene-poster" id="scene-poster">${illustration().replaceAll('paper-grain', 'scene-grain').replaceAll('courtyard-sky', 'scene-sky').replaceAll('scene-clip', 'scene-illustration-clip')}</div><div class="scene-badge"><span class="status-dot"></span> AN IMAGINED COURTYARD</div><div class="scene-entry" id="scene-entry"><button class="button button-gold" data-enter hidden>Look around in 3D <span aria-hidden="true">↗</span></button><noscript><p>The complete reading experience is below. Enable JavaScript only if you want to explore in 3D.</p></noscript></div></div>
          <p class="setting-note">${e(experience.setting)}</p>
          <p id="scene-status" role="status" aria-live="polite"></p>
          <div class="view-controls" id="view-controls" hidden role="group" aria-label="Courtyard view"><button data-view="left" aria-label="Look left">←</button><button data-view="up" aria-label="Look up">↑</button><button data-view="down" aria-label="Look down">↓</button><button data-view="right" aria-label="Look right">→</button><button data-view="reset">Reset view</button><button id="pause-motion" aria-pressed="false">Pause movement</button><button id="skip-motion">Skip movement</button></div>
          <div class="scene-help" id="scene-help" hidden><span>Drag left or right, or use the view buttons.</span><button class="text-link" data-reading>Read without 3D →</button></div>
        </div>
        <div class="moments" id="moments">${experience.moments.map((moment, index) => `<article class="moment-card" id="moment-${moment.id}" data-moment-id="${moment.id}"><div class="moment-top"><span class="eyebrow">MOMENT 0${index + 1} <span aria-hidden="true">/</span> ${experience.moments.length === 1 ? 'FIRST LOOK' : 'OF 03'}</span><span aria-hidden="true">✳</span></div><div class="moment-year" aria-hidden="true">${moment.year}<small>CE</small></div><h3 tabindex="-1">${e(moment.title)}</h3><p class="moment-body">${e(moment.body)}</p><details><summary>A little more context <span aria-hidden="true">+</span></summary><p>${e(moment.note)}</p><a href="${e(sources[0].url)}">Read the historical source ↗</a></details><a class="moment-source" href="#source-HIST-01">Source: Parkinson, chapter 8 ↗</a></article>`).join('')}</div>
      </div>
      <div class="journey-bottom"><p>No single moment tells the whole story.</p><a href="#reports" class="button button-outline">Continue to the reports <span aria-hidden="true">↗</span></a></div><p class="sr-only" id="moment-announcement" aria-live="polite"></p>
    </section>
    <section class="reports" id="reports" aria-labelledby="reports-title"><div class="section-kicker"><span class="section-index">03</span> INTO THE PRESENT</div><div class="reports-intro"><h2 id="reports-title" tabindex="-1">History opens<br><em>a question.</em></h2><div><p class="reports-deck">It doesn't close the case.</p><p>Older history can sharpen our questions. Understanding Yemen also means learning about its own politics, communities, and changing alliances.</p><p class="small-copy">The Houthis have a Zaydi Shi'a background, distinct from Iran's Twelver Shi'a tradition. Religious labels alone do not explain the conflict. <a href="#source-CTX-01">Explore the context ↗</a></p></div></div><div class="report-grid">${reportCards()}</div><p class="report-date-note">These are dated reports, not live updates. Check the reporting again before using this experience in a later course term.</p>
      <div class="reflection"><span class="reflection-spark" aria-hidden="true">✳</span><div><div class="eyebrow">TAKE A QUESTION WITH YOU</div><h3>${e(experience.invitation)}</h3><p>Your reflection belongs to you. Continue with your course materials and the reporting, outside this experience.</p></div><span class="reflection-arrow" aria-hidden="true">↗</span></div>
    </section>
    <section class="sources" id="sources" aria-labelledby="sources-title"><div><div class="section-kicker"><span class="section-index">04</span> KEEP EXPLORING</div><h2 id="sources-title">The source shelf<span aria-hidden="true">.</span></h2><p>A beginning, not the whole history.</p></div><div class="source-list">${sources.map(source => `<details id="source-${source.id}"><summary><span>${e(source.title)}<small>${e(source.author)}</small></span><span aria-hidden="true">+</span></summary><p>${e(source.publisher)}. ${e(source.locator)}.</p><a href="${e(source.url)}">Open source ↗</a></details>`).join('')}<details><summary><span>Design & making<small>A note on the setting and the visual language</small></span><span aria-hidden="true">+</span></summary><p>The courtyard is original interpretive artwork and Three.js geometry, not a reconstruction. No historical figures are depicted. The page's layered typography and color are inspired by <a href="https://github.com/chrismccoy/claude-design-styles/blob/master/spec/maximalist.md">Chris McCoy's maximalist style reference</a>.</p><p>Fonts: Bebas Neue, Abril Fatface, and DM Sans, bundled locally under the SIL Open Font License. <a href="./assets/fonts/abril-fatface-LICENSE.txt">Font license</a> · <a href="./assets/three-LICENSE.txt">Three.js MIT license</a>. No external textures or audio are used in this version.</p></details></div></section>
  </main><footer><a class="wordmark" href="#top">AFTER <span>632</span><span class="brand-spark" aria-hidden="true">✳</span></a><p>Look back. Look again. Keep asking.</p><a href="#top">Back to the beginning ↑</a></footer>`;
  return page.replaceAll('↗', '<svg class="inline-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19L19 5M5 5h14v14" stroke="currentColor" stroke-width="1.8"/></svg>').replaceAll('✳', '<svg class="inline-icon spark-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 0v40M0 20h40M6 6l28 28M6 34L34 6" stroke="currentColor" stroke-width="5"/></svg>');
}
