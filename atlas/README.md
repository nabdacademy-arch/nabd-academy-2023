# NABD ATLAS — MEDVERSE Virtual Hospital Preview v0.4

A standalone bilingual, mobile-first **22-case educational prototype** for NABD Academy for Medical Sciences, developed on an isolated feature branch. **It is not clinically reviewed, validated for patient care, accredited, or released to students.**

## Implemented

- **22 fictional cases in 13 clinical categories**, including cardiac/neurologic emergencies, respiratory, endocrine, surgery, pediatrics, obstetrics, renal, trauma, toxicology, gastroenterology and mental health.
- **86 educational decision checkpoints**. The 20 newly authored cases include triage, focused information gathering, reasoning and handover; each has three options with nuanced formative 2/1/0 scoring and explanatory feedback.
- **Virtual Hospital dashboard** with Arabic/English text, specialty and difficulty filters, keyword search, learning goals, clinical observations, progress indicators, and references to official background resources.
- **Skill map** and history, saved on the current device only. Resume incomplete cases, replay decisions, compare points, and export an anonymous local JSON training report.
- **Heart Lab**, a four-chamber conceptual anatomy activity and quiz.
- **Offline-first web pack**: page assets, case scripts, heart lab and simulator run on the same device after successful download. This is *not* internet-free communications between devices.
- Scoped Service Worker that cannot intercept the live NABD Academy pages or authenticate students.

## Trying the branch preview

A GitHub source file is not a deployed web page. Preview the branch on an HTTPS host or local \`localhost\` server, then open \`/atlas/index.html\` or \`/atlas/clinical-hub.html\`.

1. Select a clinical case (or filter by department and difficulty).
2. Answer its 3–4 checkpoints, review learning explanations and competency chart.
3. Replay an earlier checkpoint and compare the changed point totals.
4. Download a local practice JSON report if desired.
5. Use the Offline area in \`atlas/index.html\` to save the full pack, disconnect, then reload the **same** URLs to test offline access.

## Testing

From the repository root with Node.js 22:

\`\`\`bash
node --check atlas/app.mjs
node --check atlas/clinical-hub.mjs
node --check atlas/sw.js
node --check atlas/cases-critical.mjs
node --check atlas/cases-general.mjs
node --check atlas/cases-specialist.mjs
node --check atlas/cases-injury.mjs
node atlas/tests/verify.mjs
node atlas/tests/clinical.mjs
# Browser QA additionally requires Playwright Chromium, configured in GitHub Actions:
node atlas/tests/browser.mjs
\`\`\`

## Data and clinical safety

- All content marked \`reviewStatus:"unreviewed"\` — **not approved for real patient care or formal assessment**.
- Cases deliberately omit prescribing and medicine dosages; they teach recognition, systematic assessment and communication.
- Scores are unvalidated formative feedback, not clinical competence credentials or verified certificates.
- No patient identifiers, live student accounts, clinical records, production API calls, or automatic background reporting.
- Local browser storage is not permanent and can be wiped. The user can clear completed practice history.
- A clinical review board must approve individual cases, translations, choices, weights and sources; see \`docs/MEDVERSE_CONTENT_REVIEW.md\`.
- Offline pack access is best-effort: browsers may evict cached files or block initial download under weak connectivity.
- Direct peer-to-peer messaging, local Wi-Fi classroom networking, realistic 3D models, and production student sync are separate future phases.

## Production gates

Latest browser and structure CI must pass; conduct qualified clinical reviews, accessibility and real-device tests, safe HTTPS preview, data protection review, and an explicitly approved merge. The existing NABD Academy main branch, database, student portal and official certificates remain untouched. Keep the PR in **draft** until gates are passed.

## MEDVERSE 3D World v0.5 (experimental)

Explore `atlas/hospital-3d.html` for a **self-contained perspective-projected 3D medical campus**, including 13 selectable departments, zoom/orbit/drag controls, animated orbit (opt-in), a conceptual 3D wing interior, bilingual interface, mobile touch interaction, and links into department-filtered clinical cases. Everything is original browser code; no CDN, paid services or analytics are required. The 3D representation is intentionally schematic and *not* a photorealistic, anatomically precise, walkable hospital or clinical training device. The 3D assets are cached in the offline pack v5. The latest GitHub Actions browser test covers the 3D scene and cross-linking. All medical cases remain unreviewed educational examples.


## Visual refresh — user-approved NABD hospital artwork
- Four original generated hospital renderings: atrium, emergency, pediatrics and simulation lab.
- Optimized WebP assets under `atlas/images/`, each below 20 KB, with Arabic/English overlay content and responsive presentation.
- Photos are illustrative images of a **fictional** training campus, not images of a real operational hospital.
- The four images are included in the scoped offline pack v6; the hospital 3D campus remains a schematic educational rendering.
