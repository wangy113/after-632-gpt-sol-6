# After 632 — project handoff

## Status and purpose

Concept approved in October 2026. No implementation files have been added yet; this document is the starting brief. The repository is public, so keep student work, credentials, and unpublished course material out of it.

Build a short, standalone HTML experience using Three.js. It should help early college students in the United States feel the distance between the seventh century and today's news, then give them a few accurate historical bearings. The experience is a doorway into historical thinking, not a quiz, game, or automated discussion-post writer.

The intended visit is about six minutes. Students may later use the textbook, an AI chatbot, and two recent news reports to write their separate 250–500 word course post. The site should invite that work without turning the assignment into a sequence of mechanical tasks.

## Core experience: one courtyard, three moments

The visitor enters an **imagined courtyard** with an opening question:

> When a community loses the person who united it, what gives someone else the authority to lead?

The visitor can look around and move at their own pace. A changing sun and subtle shifts in the environment reveal three moments in the same place:

1. **632 CE — succession.** After Muhammad's death, Abu Bakr became the first caliph. Supporters of Ali understood the question of rightful leadership differently. Explain the issue in a short, careful passage, not a reenacted argument.
2. **661 CE — political struggle.** Ali's death and the rise of Umayyad rule show that the disagreement developed through contests over political authority. The space remains recognizably the same.
3. **680 CE — Karbala and remembrance.** Husayn's death at Karbala becomes central to Shi'a memory of injustice and legitimate leadership. Convey this through restrained light and text, never a battle simulation.

Each moment should have no more than about 60 words of student-facing text, with optional audio narration and always-available captions. Students can move back and forth in time. They are never asked to collect items, earn points, select a sect, or supply a “correct” response.

The single shared space is a deliberate historical choice: both traditions belong to Islam and share central beliefs and practices. The Sunni–Shi'a distinction developed over time; these three dates illuminate origins, not a fully formed pair of denominations by 680. A brief source note can point interested students to further differences in religious authority and later practice.

At the exit, offer two dated, clearly identified reports about Yemen and one open invitation: **What does this older history help you notice, and what would you still need to learn about this conflict?** Link to the reports rather than staging contemporary violence in 3D. The course reflection happens outside the scene.

## Historical and cultural guardrails

- Label the courtyard an **interpretive setting**, not a reconstruction of Medina, Karbala, a mosque, or any documented site.
- Do not depict Muhammad, the early leaders, Husayn, worshippers, or combatants. Avoid invented dialogue or simulated religious voices.
- Do not use a branching path to represent a sudden two-way split. Avoid implying that a seventh-century dispute directly caused a particular twenty-first-century battle.
- Use “Sunni” and “Shi'a” respectfully. Note shared Muslim foundations. If Yemen is discussed, distinguish the Houthis' Zaydi background from Iran's Twelver Shi'a tradition.
- Keep the architecture restrained. The Metropolitan Museum of Art describes an early courtyard and palm-branch shade associated with Muhammad's house in Medina; use that as broad visual context only. Avoid domes, minarets, and ornate tilework that would suggest a later or different setting.
- The modern reporting is dated. Recheck sources before using the lab in a later course term.

## Visual and technical direction

Build the courtyard from Three.js primitives: simple walls, ground, a shaded area, a small amount of vegetation, and sun movement. No Blender work or complex character models are required. Nature and architecture should carry the atmosphere; the text should be sparse and historically precise.

Poly Haven can supply a small number of CC0 textures and an HDRI for lighting. Download optimized local copies (roughly 1–2K where visually sufficient) rather than hotlinking large originals. An HDRI photographed in another region should light the scene without appearing as a purported Arabian backdrop. Credit Poly Haven in the site even though its CC0 license does not require attribution.

Prefer mouse/touch orbit or a short, easy walk over game-style controls. Support keyboard navigation, captions, reduced motion, a visible way to skip movement, and a readable 2D fallback if WebGL is unavailable. The page should load comfortably on ordinary student laptops and phones.

The first implementation milestone is one complete courtyard and one historically checked moment. Test its clarity and performance before adding the other moments or sound. The final experience should feel spacious and contemplative, not empty or slow.

## Source shelf

- Brian Parkinson, [chapter 8, “Islam to the Mamluks,” in World History: Cultures, States, and Societies to 1500](https://alg.manifoldapp.org/read/world-history/section/b5b7defa-a694-4cff-bdc7-cc550c80af5d). Especially §§8.6.1, 8.8, and 8.9 for shared foundations, succession, and Karbala.
- The Metropolitan Museum of Art, [Islamic art educator resource, Unit 1](https://www.metmuseum.org/-/media/files/learn/for%20educators/publications%20for%20educators/islamic%20teacher%20resource/unit1.pdf), for cautious architectural context.
- Associated Press, [May 6, 2025 report on the U.S.–Houthi ceasefire](https://www.ap.org/news-highlights/spotlights/2025/trump-says-the-us-will-stop-bombing-yemens-houthis-after-rebels-say-theyll-stop-targeting-ships/).
- Associated Press, [October 2026 report on renewed fighting near Bab el-Mandeb](https://apnews.com/article/yemen-houthis-iran-saudi-mandeb-hormuz-oil-67d70a6b39c0c4fb3149e3f3981805ee).
- Allison Minor, [2024 Brookings paper on the Yemen war](https://www.brookings.edu/wp-content/uploads/2024/09/Minor_How-the-US-could-have-prevented-the-Yemen-War_2024.pdf), for the Zaydi/Twelver distinction and political context.
- Marc Watkins, [“Reading in an Age of Thinking Machines”](https://marcwatkins.substack.com/p/reading-in-an-age-of-thinking-machines), for the design principle of inviting attention without automating students' interpretation.
- [Poly Haven asset license](https://polyhaven.com/license) and [Three.js documentation](https://threejs.org/docs/).

## Definition of done

A student can open the page, understand that the courtyard is symbolic, explore all three dated moments in about six minutes, recognize both shared Muslim foundations and the historical dispute over authority, access the cited textbook and news reports, and leave with a question worth pursuing in their own reflection. The site remains usable without audio or WebGL.
