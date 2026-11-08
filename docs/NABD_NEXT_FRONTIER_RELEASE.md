# NABD NEXT FRONTIER — 8 connected science initiatives

**Delivery:** 2026-11-08. **Site:** /nabd-next-frontier.html. **Database:** live Supabase project zsmmmljgguycrvyrmakl. **Branch:** feature/nabd-next-frontier-20261108.

## Evidence-based scope, not fictional institutional claims

1. **NABD EVIDENCE UNIVERSE:** A staff-curated evidence-claim catalogue linking each published claim (Arabic/English) to an original HTTPS source, topic, and editorial relationship (supports/questions/context). Admin creates drafts, verifies sources, and explicitly publishes. This is not an AI-generated proof network or formal clinical evidence rating.
2. **NABD WORLD CONGRESS:** Authenticated poster/talk abstract submissions, track selection, display-name/publication consent, staff reviewing/accepted/rejected decisions, public gallery only after accepted human review. No actual conference dates, international speakers, sessions, tickets or verified academic sponsors are fabricated.
3. **NABD OPEN SCIENCE PRESS:** Authenticated manuscript-abstract submission, editor decision queue (submitted/reviewing/accepted/published/rejected), rights/consent assertion, reviewed published abstracts. Not an indexed journal, full-text peer-review platform, journal ISSN or DOI issuer. All of those require legitimate organizations and editorial processes.
4. **NABD MENTORVERSE:** Public display only of verified opt-in and administrator-approved mentor profiles. Learners can submit private learning-goal requests; admin reviews. No unsupervised personal chat and no automatic matching. Before accepting a match, obtain mutual consent outside the system.
5. **NABD INNOVATION LEAGUE:** Authenticated team problem/solution proposals; human shortlisting/showcasing/rejection; public showcase only with explicit creator consent and admin decision. No fake prize winners, partners or mentors.
6. **NABD TRUST WALLET:** Own existing issued certificate records and verified unexpired skill records from current academy tables; authenticated requests for review/preparation of future portable credentials. **Not an Open Badges 3.0 signature implementation**. "Ready" status only means packaging can be reviewed; never means a cryptographic badge or accreditation was issued. Open Badges 3.0 signed credentials require issuance architecture, key management and independent verification; see https://www.1edtech.org/standards/open-badges .
7. **NABD SCIENCE QUEST:** Three playable question packs (cells, heart, research methods), each with three educational multiple-choice items, review explanations, retry flow, and optional signed-in attempt history. Attempts are user-insertable *practice-only* data and **cannot serve as evidence for grades, certificates, clinical competence or academic decisions**.
8. **NABD GLOBAL HEALTH OBSERVATORY:** Admin-curated numerical health indicators, reporting period, geography, unit, source title/HTTPS URL, explicit publication. Public display shows only reviewed published figures and relative magnitudes within the displayed sample. It **does not automatically integrate WHO/World Bank APIs**, update itself in realtime, or pretend to hold verified data not entered and checked by a professional.

## Production migration and access model

Applied Supabase migration: **nabd_next_frontier_eight_modules_secure**, generated version **20261108112325**. Source: supabase/migrations/20261108112325_nabd_next_frontier_eight_modules_secure.sql.

New tables:
- nfx_evidence_entries
- nfx_congress_submissions
- nfx_manuscripts
- nfx_mentor_profiles
- nfx_mentor_requests
- nfx_innovation_projects
- nfx_badge_requests
- nfx_quest_attempts
- nfx_observatory_records

Every new public-schema table has RLS enabled. Submitted user content is only visible to the owner (and an authenticated, database-role-verified administrator); consented approved/published content is accessible to anonymous readers. Anonymous users have no INSERT or UPDATE privileges. The browser has *column-limited INSERT* for submissions, preventing arbitrary setting of review statuses. State changes require administrative RLS privileges. Public source evidence and health figures can only be created by admin. No privileged service key or user-editable metadata is trusted. Rendering uses textContent instead of injecting HTML.

### Validation before a full live public programme

- [ ] Open the new hub on phone and desktop and check 8 navigation panels, languages, hash deep links and keyboard-only controls.
- [ ] With a genuinely authorised student test account, submit a conference abstract, manuscript abstract and innovation proposal. Confirm each remains private until administrative approval. Ensure another student's account cannot read it via the API.
- [ ] With a mentor test account, submit an opt-in profile. The staff review must approve before public display; separately obtain both parties' consent before accepting a request.
- [ ] With a real administrator, open admin.html > FRONTIER: add one evidence-source *draft* and one sourced indicator *draft*, carefully verify the original URLs and dates, then explicitly publish.
- [ ] Confirm pending submissions/drafts do not appear to anonymous visitors; test that a visitor cannot insert/edit via the Data API.
- [ ] Verify issued certificates and skills by a real student account; never treat a "ready" packaging request as a signed Open Badge.
- [ ] Run Science Quest without sign-in: it should remain usable. Sign in and confirm separate practice attempt history under RLS.
- [ ] Confirm the institution has appropriate scientific editorial policies, informed consent, privacy/retention policy, rate limiting, and human review capacity before publicly marketing these programmes.
- [ ] Monitor Supabase advisors. Existing historical SECURITY DEFINER and Auth leaked-password protection notices remain outside the scope of this release and must be handled through careful separate review.

**Operational risks still open:** professional content review, actual editorial and programme staff, institute authority to publish research, moderation response times, anti-spam/rate limiting and retention decisions, real conference/event logistics, real peer review, real verifiable-credential signing, automated external health-data ingestion, and broader penetration testing. The eight modules are working initial workflow foundations; they are **not** fully fledged international institutions.

**Cost:** GitHub Pages plus existing Supabase infrastructure and no added paid frontend library. Free quotas and upgrade limits still apply.
