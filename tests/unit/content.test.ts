import { describe, expect, it } from 'vitest';
import experience from '../../content/experience.json' with { type: 'json' };
import sources from '../../content/sources.json' with { type: 'json' };
import changes from '../../content/changes.json' with { type: 'json' };
import objects from '../../content/objects.json' with { type: 'json' };
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

  it('pairs each 632 room explanation with a sourced historical record', () => {
    expect(() => validateContent(experience, sources, changes)).not.toThrow();
    const page = renderPage(experience, sources, changes);
    const sourceIds = new Set(sources.map(source => source.id));

    expect(changes['632'].labels).toHaveLength(3);
    for (const label of changes['632'].labels) {
      expect(sourceIds.has(label.sourceId)).toBe(true);
      expect(page).toContain(escapeHtml(label.inRoom));
      expect(page).toContain(escapeHtml(label.inRecord));
      expect(page).toContain(`href="#source-${label.sourceId}"`);
    }
  });

  it('rejects 632 labels without either explanation or a valid source', () => {
    const noRoomExplanation = structuredClone(changes);
    noRoomExplanation['632'].labels[0].inRoom = ' ';
    expect(() => validateContent(experience, sources, noRoomExplanation)).toThrow('both explanations');

    const noRecordExplanation = structuredClone(changes);
    noRecordExplanation['632'].labels[0].inRecord = ' ';
    expect(() => validateContent(experience, sources, noRecordExplanation)).toThrow('both explanations');

    const missingSource = structuredClone(changes);
    missingSource['632'].labels[0].sourceId = 'missing';
    expect(() => validateContent(experience, sources, missingSource)).toThrow('label source is missing');
  });

  it('rejects a 632 label that has no matching scene object', () => {
    const mismatched = structuredClone(changes);
    mismatched['632'].labels[0].id = 'not-a-scene-object';
    expect(() => validateContent(experience, sources, mismatched)).toThrow('labels must match every scene object');
  });

  it('keeps the displayed 661 coin replica tied to an earlier museum record without an image', () => {
    expect(() => validateContent(experience, sources, changes, objects)).not.toThrow();

    const tooLate = structuredClone(objects);
    tooLate[0].museumReference.mintedCe = 679;
    expect(() => validateContent(experience, sources, changes, tooLate)).toThrow('postdates its scene');

    const unsupportedImage = structuredClone(objects);
    unsupportedImage[0].imageUse = 'collection-photo';
    expect(() => validateContent(experience, sources, changes, unsupportedImage)).toThrow('unlicensed or unsupported');

    const unlinked = structuredClone(changes);
    unlinked['661'].labels[2].objectId = 'missing';
    expect(() => validateContent(experience, sources, unlinked, objects)).toThrow('label object is missing');

    const mismatched = structuredClone(changes);
    mismatched['661'].labels[0].id = 'not-a-scene-object';
    expect(() => validateContent(experience, sources, mismatched, objects)).toThrow('661: labels must match every scene object');
  });

  it('requires a sourced label for every 680 trace in the room and static reading', () => {
    const page = renderPage();
    const sourceIds = new Set(sources.map(source => source.id));
    expect(changes['680'].labels).toHaveLength(3);
    for (const label of changes['680'].labels) {
      expect(sourceIds.has(label.sourceId)).toBe(true);
      expect(page).toContain(escapeHtml(label.inRoom));
      expect(page).toContain(escapeHtml(label.inRecord));
      expect(page).toContain(`href="#source-${label.sourceId}"`);
    }

    const missing = structuredClone(changes);
    delete (missing as Record<string, unknown>)['680'];
    expect(() => validateContent(experience, sources, missing, objects)).toThrow('need change sets');

    const mismatched = structuredClone(changes);
    mismatched['680'].labels[0].id = 'not-a-scene-object';
    expect(() => validateContent(experience, sources, mismatched, objects)).toThrow('680: labels must match every scene object');
  });
});
