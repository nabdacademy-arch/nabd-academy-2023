# NABD Open Doors — Master's Research Studio (V1)

Independent educational simulator **for Master's-level graduate preparation** in Chemistry & Materials Science, Biology & Biotechnology, and Clinical Medicine & Public Health.

**One-click entry:** [Master's studio](../../open-doors-masters.html) from the existing Open Doors Bachelor's Exam Coach, or directly from \`/open-doors-masters.html\`.

## Working features

- Distinct full Arabic/English UI, separate from the original Bachelor's simulator, preserving all existing Bachelor's tabs and question banks.
- Private sign-in to the founder's existing NABD Supabase account. Server-side owner authorization via the current restricted \`open_doors_questions\` RLS probe. No secret keys inside the website.
- **72 original graduate practice items** across 3 subjects: per subject 10 single-choice, 6 multi-choice, 5 advanced written, 3 oral prompts; hundreds of deterministic number-variable problem variants tested for unambiguous answer keys.
- Randomized single-/multi-answer quizzes with translation, marked answer explanations, multiple-select partial-credit rules clearly labeled as NABD practice only, and final reports.
- Written tasks with worked solutions, self-review against four marking criteria, text entry, local photo resizing and explicit opt-in to provisional vision-language AI grading using existing \`open-doors-essay-grade\` function. Photos are not stored in NABD's database.
- Oral prompts with *local* audio recording and typed transcript; provisional content review uses \`open-doors-grade\` where available. No pronunciation claim.
- Full **44-task, 180-minute mock** following the published 2026 format (25 single + 15 intermediate + 3 written + 1 oral). A 175-minute written phase followed by 5-minute oral. Objective answer-key score /70. AI-marked written /30 and oral /5 are optional, estimate-only. If unavailable, the partial confirmed score is reported without inventing scores.
- Local browser-only aggregate progress, export and clear controls.
- Direct links to the official **Master's/Doctoral** subject program PDF and published sample PDF for each subject, plus an older archived Biology demo.

## Primary official references

- [Chemistry & Materials Science Master's](https://od.globaluni.ru/subject/52/ma)
- [Biology & Biotechnology Master's](https://od.globaluni.ru/subject/45/ma)
- [Clinical Medicine & Public Health Master's](https://od.globaluni.ru/subject/55/ma)
- [Open Doors 2026 Proctored Stage Two guidelines](https://od.globaluni.ru/images/2026/Guidelines_for_the_Open_Doors_Proctored_Second_Stage_ENG_2026.pdf)
- [Official Open Doors participation rules](https://od.globaluni.ru/rules)

Important: published demo packs may include three *alternative* oral examples whereas the 2026 proctored session contains one oral question. Some archived older sample formats differ in the number and scoring. Sources are linked and clearly separated from newly authored NABD practice; **we do not claim to reproduce or predict actual competition questions**.

## Data and safety

- No user answers, uploaded images or audio are saved to a NABD server by the new Master's page.
- Local progress contains only metadata and scores; clear it in the Progress tab.
- Written photo / text sent to AI providers *only* after explicit consent in the written practice. The full simulator separately requests consent before sending typed essay/oral content for provisional AI grading.
- The study simulator should **never be opened or used during a proctored official exam**.
- The Master's track requires an eligible prior higher-education qualification; using the practice portal does not establish scholarship eligibility.
- Current implementation is an independent pilot: no official affiliation, guaranteed scholarship result, or certified medical guidance.

## Verification

\`\`\`bash
node --check assets/js/open-doors-masters-bank.js
node --check assets/js/open-doors-masters.js
node tests/open-doors-masters.test.cjs
node tests/open-doors-masters-browser.cjs # requires Playwright and a local web server on port 8123
\`\`\`
