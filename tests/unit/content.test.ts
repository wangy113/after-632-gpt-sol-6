import { describe, expect, it } from 'vitest';
import experience from '../../content/experience.json' with { type: 'json' };
import sources from '../../content/sources.json' with { type: 'json' };
import { escapeHtml, renderPage, validateContent } from '../../scripts/content';

describe('the reading page', () => {
  it('has three sourced passages within the word limit', () => {
    expect(() => validateContent()).not.toThrow();
    const page = renderPage();
    expect(page).toContain(escapeHtml(experience.shared.text));
    for (const moment of experience.moments) {
      expect(page).toContain(escapeHtml(moment.passage));
      expect(page).toContain('href="#source-' + moment.sourceId + '"');
    }
  });

  it('rejects an overlong passage and a broken source reference', () => {
    const long = structuredClone(experience);
    long.moments[0].passage = Array(61).fill('word').join(' ');
    expect(() => validateContent(long, sources)).toThrow('1–60 words');

    const unsourced = structuredClone(experience);
    unsourced.moments[0].sourceId = 'missing';
    expect(() => validateContent(unsourced, sources)).toThrow('source is missing');
  });

  it('escapes authored text in the rendered HTML', () => {
    const edited = structuredClone(experience);
    edited.opening = '<script>alert("x")</script>';
    const page = renderPage(edited, sources);
    expect(page).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(page).not.toContain('<script>');
  });
});
