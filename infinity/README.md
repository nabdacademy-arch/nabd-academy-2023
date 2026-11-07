# NABD INFINITY · V12–V15 integrated release

Bilingual supplementary medical-learning app; existing student portals, NABD ATLAS, certificates, Supabase, V10 and V11 remain unchanged.

## Working functionality
- V12: six real GLB geometry models loaded on demand with the model-viewer web component; external/sectioned heart option, local SVG previews, zoom/rotation in the viewer.
- V13: five 3-step fictional conceptual missions with immediate scored educational feedback, plus the existing virtual hospital.
- V14: local, retrieval-based study mentor with seven curated bilingual notes, unknown-question fallback, no AI generation and no client-side upload of student questions.
- V15: six connected digital-campus entrances to actual academy pages, optional on-device learning-progress storage and clear/export controls.
- Offline: app shell and local illustration previews; not external CDN GLB models.

## License and medical limitations
The CC0 1.0 assets are individual models from https://3dassets.dev/packs/human-anatomy-and-education-kit.
The source describes these as AI-generated, simplified educational geometry, not medically validated anatomy. Sources and per-model attribution pages are linked in the interface.
Actual assets used: heart 38952, sectioned heart 38953, lungs 38954, brain 38955, kidneys 38958, liver 38959, full skeleton 38937.
The viewer library is loaded from cdnjs pinned to version 4.1.0 only after an explicit button click. No remote GLB is precached.
For clinical/academic teaching, a medical expert should validate facts and model quality. No prescription, patient-specific diagnosis, degree accreditation or signed partnership claims.
The study mentor is rule-based retrieval and should not be described as general generative AI.

## Testing
Run: node tests/infinity-integrity.test.mjs
Browser: npm install --no-save playwright@1.56.1; npx playwright install chromium; node tests/infinity-browser.cjs.
Review real Android and slow-network performance after CI before broad rollout.
