import { describe, expect, it } from 'vitest';
import { escapeHtml, renderPage, validateContent } from '../scripts/content';
import experience from '../content/experience.json' with { type: 'json' };
import { initialState, reduce, motionAllowed } from '../src/state';

describe('historical content', () => {
  it('contains the complete canonical content before JavaScript runs', () => {
    validateContent();
    const html = renderPage();
    for (const moment of experience.moments) {
      expect(html).toContain(escapeHtml(moment.body));
      expect(moment.body.split(/\s+/).length).toBeLessThanOrEqual(60);
    }
    expect(html).toContain(escapeHtml(experience.opening));
    expect(html).toContain(escapeHtml(experience.invitation));
  });
  it('escapes authored text before inserting HTML', () => {
    expect(escapeHtml('<script a="x">&\'</script>')).toBe('&lt;script a=&quot;x&quot;&gt;&amp;&#39;&lt;/script&gt;');
  });
});

describe('motion and failure behavior', () => {
  it('never lets a resume action override system reduced motion', () => {
    const reduced = reduce(initialState, { type: 'reduced', reduced: true });
    expect(motionAllowed(reduce(reduced, { type: 'pause', paused: false }))).toBe(false);
  });
  it('preserves the selected date and exposes reading mode after failure', () => {
    let state = reduce(initialState, { type: 'select', id: '680' });
    state = reduce(state, { type: 'mode', mode: 'interactive' });
    state = reduce(state, { type: 'scene', status: 'failed' });
    expect(state.moment).toBe('680');
    expect(state.mode).toBe('reading');
  });
});
