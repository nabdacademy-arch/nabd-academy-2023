# NABD SCIENCE IMMUNE SYSTEM — Release and human review runbook
**Date:** 2026-11-08 · **Route:** /nabd-science-immune.html · **Release:** V1 editorial workflow

## Added on top of the existing Evidence DNA / Knowledge Decay foundation
- Human-created scientific change notices with bilingual titles, previous claim, current evidence, dated original HTTPS source, change priority and optional linkage to an existing \`nabd_evidence_sources\` record.
- Explicit mapping to existing NABD URLs representing lessons, simulations, tests, articles or references; correction statuses and editor rationale.
- Review-state sequence: private draft → awaiting human review → human-approved publication. Publication requires at least one mapped resource, review note (20+ characters), confirmed reviewer identity and database timestamp; published notices are immutable except withdrawal. A new version must be created for subsequent corrections.
- Database-triggered append-only editorial audit (event metadata, not student records). Anonymous readers only see published notices and corresponding impact links; only actual database-profile administrators can create/edit.
- Arabic/English mobile-friendly public page, reviewer command room for logged-in admin, home-page flagship and academy navigation/search link.
- No automatic edits to medical teaching material, no surveillance of external APIs, and no unverified AI generation. Review notes are necessary but not independently verified by software.
- Existing knowledge and course tables are not rewritten, grades remain untouched, no student/patient data is collected.

## Operational review before scientific publication
1. Sign into the site with a verified admin account, open NABD Science Immune System.
2. Compare the original guideline/research article against the prior claim, identify publication date and intended population. Capture source URL and evidence provenance. Do not copy patient information.
3. Enter a **draft** (selecting an Evidence DNA source UUID only if confirmed).
4. Map at least one **real** learning-resource URL; review its content manually. Linking a URL is not proof that the claim appears on it.
5. Move to **review**. Get suitably qualified independent scientific editorial assessment, especially for clinical topics.
6. Record a substantial rationale, confirm, then **publish**. The database prevents bypassing draft→review→publication and blocks publishing without mapping.
7. Track corrections as revised/retired/unaffected with notes; course content must be modified and tested by human editors outside this module.
8. If a published notice is incorrect, withdraw; the log remains. Create a new draft instead of editing the published summary.
9. Check RLS with anon, signed-in learner, verified admin accounts, including ownership boundaries, plus page accessibility and both languages.
10. Maintain scientific review schedules and policies; source freshness and student learning outcomes are *not yet measured automatically*.

## Security / limitations
- All three \`nsi_\` tables use PostgreSQL RLS. The audit table has no \`anon\` or \`authenticated\` insert/update grants.
- Database guards enforce the approval sequence. Audit writes use a schema-private, trigger-only function with empty search path, not browser permissions.
- Admin controls are further gated by \`auth.getUser()\` and a database \`profiles.role='admin'\` lookup; RLS is the authoritative boundary.
- This system is a manual scientific quality-control pilot. It is **not** a self-healing autonomous clinical AI or a medical decision-support tool.
- Separate Supabase security-advisor findings and real scientific content validation require ongoing remediation outside this migration.

## Automated tests
\`node --check assets/js/nabd-science-immune.js\`
\`node tests/nabd-science-immune-integrity.test.mjs\`
\`node tests/nabd-science-immune-browser.cjs\` (requires Playwright chromium)
