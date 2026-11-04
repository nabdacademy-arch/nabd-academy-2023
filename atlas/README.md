# NABD ATLAS — Foundation 01

A standalone **proof of concept** for NABD Academy for Medical Sciences. It introduces:
- A bilingual Arabic/English medical-learning interface.
- A three-decision, fictional chest-pain learning simulation.
- An accessible 2D bilingual interactive heart-chamber lab with a self-check quiz.
- **NEW:** A multi-case virtual-hospital hub with a fictional neurological emergency scenario, saved incomplete attempts, educational score history, decision replay and JSON report export.
- Local-only progress summary (no student identifiers).
- A scoped Service Worker and an offline web pack covering the simulator, heart lab, and virtual hospital.
- The beginnings of the NABD MEDVERSE and NABD OFFLINE modules.

## Try it

This branch does **not** modify the existing \`index.html\`, student portal, admin portal, Supabase schema or production site.

1. Serve the repository via HTTPS, or run a local HTTP server on localhost.
2. Open \`/atlas/index.html\`.
3. Visit **Offline learning** and click **Download / update pack**.
4. Disconnect internet, reload the same page, and complete the simulation.
5. Reconnect. No account sync occurs yet by design.

**Note:** GitHub Pages generally serves the selected production branch; a GitHub source-file browser link is not a deployed preview. Set up a safe branch preview before a live demonstration. Local browser storage is not guaranteed permanent.

## Tests

Requires Node.js 20+ (zero npm dependencies):

\`\`\`sh
node --check atlas/app.mjs
node --check atlas/scenario-data.mjs
node --check atlas/sw.js
node atlas/tests/verify.mjs
\`\`\`

## Safety and limitations

- The fictional case is **educational only** and needs review by a qualified clinical educator before official assessment.
- No diagnosis, prescribing, or real patient-care guidance is provided.
- No identifiable patient data, real patient records, or Supabase credentials are used in this module.
- No synchronization with student accounts, no device-to-device chat, and no online AI service are included yet.
- The score is local demonstration feedback, not verified clinical competency or a certificate.
- Browser storage and Cache Storage may be evicted.
- Offline functionality requires the first successful download over HTTPS (or localhost).
- Full PWA installability on all platforms requires raster app icons; current SVG icon is a placeholder.
- The Service Worker has a restricted \`/atlas/\` scope and does not intercept existing academy pages.

## Next steps

1. Clinical content review + author/reviewer workflow.
2. Database inventory and backup plan before touching the live Supabase project.
3. Architecture review, accessibility and mobile QA.
4. Reusable scenario content packages and versioned offline migrations.
5. Approved sync API with idempotency, retries, row-level security and audit logs.
6. A safe preview deployment, then a reviewed PR merge.
