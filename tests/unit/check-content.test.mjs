import { describe, expect, it } from 'vitest';
import experience from '../../content/experience.json' with { type: 'json' };
import changes from '../../content/changes.json' with { type: 'json' };
import sources from '../../content/sources.json' with { type: 'json' };
import reporting from '../../content/reporting.json' with { type: 'json' };
import assets from '../../assets.config.json' with { type: 'json' };
import objects from '../../content/objects.json' with { type: 'json' };
import { renderPage } from '../../scripts/content';
import { renderReportingExit } from '../../scripts/reporting';
import { checkBuiltContent } from '../../scripts/check-content.mjs';

const content = () => ({
  indexHtml: renderPage(),
  exitHtml: renderReportingExit(),
  experience, changes, sources, reporting, assets, objects,
});

describe('release content gate', () => {
  it('finds all sources and credits in the generated pages', () => {
    expect(checkBuiltContent(content())).toMatchObject({
      historicalSources: 5, labels: 11, reports: 2, contextSources: 2, polyHavenAssets: 5,
    });
  });

  it('rejects a passage source, report date, or license link lost from the pages', () => {
    const missingPassageSource = content();
    missingPassageSource.indexHtml = missingPassageSource.indexHtml.replace(
      '<a href="#source-HIST-04">Additional historical source</a>',
      '<span>Additional historical source</span>');
    expect(() => checkBuiltContent(missingPassageSource)).toThrow('680: built passage is missing source HIST-04');

    const missingLabelSource = content();
    const firstLabel = missingLabelSource.indexHtml.match(/<li data-change-id="mats-and-cups">[\s\S]*?<\/li>/)[0];
    missingLabelSource.indexHtml = missingLabelSource.indexHtml.replace(firstLabel,
      firstLabel.replace('href="#source-HIST-01"', 'href="#missing"'));
    expect(() => checkBuiltContent(missingLabelSource)).toThrow('632/mats-and-cups: room and reading labels need');

    const wrongReportDate = content();
    wrongReportDate.exitHtml = wrongReportDate.exitHtml.replace('datetime="2026-09-17"', 'datetime="2026-09-18"');
    expect(() => checkBuiltContent(wrongReportDate)).toThrow('YEMEN-01: built report link and publication date');

    const missingLicense = content();
    missingLicense.indexHtml = missingLicense.indexHtml.replace(
      'https://creativecommons.org/licenses/by-sa/4.0/', '#missing-license');
    expect(() => checkBuiltContent(missingLicense)).toThrow('Built textbook credit needs');
  });
});
