# Phase 3 source and credit audit · 15 October 2026 (America/Chicago)

This review follows the displayed passages, room labels, source shelf, reporting exit, and credited assets in the current preview. It distinguishes a source's factual support from the invented room details. The publisher and catalog links were read on the date above; the automated content check is offline and cannot establish that an external page stays available later.

## Historical reading and room labels

| Record | Displayed use and boundary | Result |
| --- | --- | --- |
| `HIST-01` · [Brian Parkinson, “Islam to the Mamluks”](https://alg.manifoldapp.org/read/world-history/section/b5b7defa-a694-4cff-bdc7-cc550c80af5d), ch. 8 §§8.6.1, 8.8, 8.9 | Shared Sunni/Shi'a foundations, 632 succession, 661 civil war and Umayyad rule, and the broad 680 Karbala and commemoration account. The source does **not** name family members killed in Husayn's group. | The 680 passage now links `HIST-04` as an additional source for that detail. The book title is recorded separately from its publisher, Affordable Learning Georgia; the [book page](https://alg.manifoldapp.org/projects/world-history) states CC BY-SA 4.0, which the source shelf links. |
| `HIST-02` · [Mahjabeen Dhala, *Feminist Theology and Social Justice in Islam*](https://assets.cambridge.org/97810094/23045/excerpt/9781009423045_excerpt.pdf), introduction p. 1 | Some companions met at Saqifa before Muhammad's burial and Abu Bakr was selected. The footprints are invented; the label does not claim a documented route or room. | The 632 footprint label keeps the cited fact separate from the invented trace. |
| `HIST-03` · [Donald P. Little, “Muʿāwiyah I”](https://www.britannica.com/biography/Muawiyah-I), “Caliphate” | Mu'awiya's rule from Damascus and early Arabic accounts of a chancellery and postal service. The article does not date those institutions to 661 or establish a particular letter or seat. | The 661 labels state those limits. |
| `HIST-04` · [Wilferd Madelung, “Ḥosayn b. ʿAli”](https://www.iranicaonline.org/articles/hosayn-b-ali-i/) | Husayn's refusal and departure from Medina for Mecca, and relatives among those killed at Karbala. It does not document the room's bags, floor mark, or hook. | The clean-patch label and now the 680 passage link this record. |
| `OBJ-01` · [British Museum coin 1922,0424.3865](https://www.britishmuseum.org/collection/object/C_1922-0424-3865) | Catalog entry identifies an Arab-Sasanian silver coin minted at Nihavand in 660 CE (AH 40; YE 29). It is a date and type reference, not a find from the imagined room. | The room coin is labeled an interpretive replica. The source shelf says no museum photograph is used. |

All eleven displayed change labels have separate “In this room” and “In the record” text and a source ID. The four starting-view descriptions for each date describe the imagined scene; each date also offers a sourced record sentence. No room object is presented as a historical relic.

## Reporting exit and visual assets

The [two publisher reports and two context sources](../phase0/REPORTING_EXIT_SOURCES.md) were opened again on 15 October 2026 America/Chicago. Their URLs returned 200, and the titles, authors, dates, and summarized claims still match `content/reporting.json`. The report dates remain 17 and 29 September 2026. The Guardian headline's displacement number is a dated estimate, not a current total; the exit does not repeat it as current data. Brookings is 2021 commentary, and the 2018 Minority Rights Group profile is used only for the distinction that not all Zaydi Muslims are Houthis. The exit check date is now 15 October 2026.

`assets.config.json` records two Poly Haven texture sets and two sky HDRIs under [Poly Haven's CC0 terms](https://polyhaven.com/license). The reading page links each asset's source page and the license. `npm run check:assets` checks the six JPGs and two HDRIs against pinned bytes and hashes, including their built copies. The only other displayed image is the app-generated arrival still. There are no collection photographs, news images, imported models, or external fonts in the current build. The British Museum entry is a catalog link; its photograph is not copied.

## Repeatable checks and remaining review

`npm run check:content` builds the two pages, runs their existing data validators, then checks the built historical source shelf, passage and label links, report cards and dates, context claim citations, textbook and Poly Haven license links, and the current no-collection-photo treatment. It catches a credit or citation that disappears from the generated HTML. `npm run check:assets` separately verifies the pinned asset records and size budgets. These checks do not verify the live state of publisher pages or decide whether historical wording and symbolism are suitable for learners.

Before a final release, recheck the outgoing reports and context pages again. Instructor and relevant community review of the passages, room symbolism, and reporting bridge, plus participant and actual screen-reader checks, still need people; no results are claimed here.
