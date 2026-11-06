# NABD Campus — integrated release gate (2026-11-06)

This branch introduces a **single bilingual, mobile-first gateway** to the existing student, lecturer, administrator, medical-knowledge, simulation, skill passport, international lecture and support pages. It intentionally **does not** claim to have activated services that still need staff, clinical review, Supabase deployment or consent.

## Phase 1 — reliability and student journey
- [x] One lightweight AR/EN entry point with links to existing authenticated systems, clear service statuses, keyboard focus, responsive layouts and no third-party dependencies.
- [ ] Verify the complete enrollment → account → approval → course → certificate → public verification path against a safe Supabase staging instance.
- [ ] Audit role-based permissions and RLS using the actual deployed schema; do not execute unreviewed migrations against production.
- [ ] Verify password reset, privacy notice, account deletion and public contact fields; replace TO_CONFIRM after owner confirmation.
- [ ] Run real-browser mobile, accessibility and broken-link checks before release.

## Phase 2 — learning and global lectures
- [x] Unified access to the lecturer studio and international lecture pilot information, without invented lecturers or dates.
- [ ] Activate and test existing teaching-studio SQL only after backing up and reviewing production database.
- [ ] Confirm volunteer lecturer, curriculum, consent and session times before opening registration.
- [ ] Integrate attendance and replay only with permissions, retention limits and an agreed recording policy.
- [ ] Test ATLAS offline pack on low-end Android, and distinguish cached learning from real-time communication.

## Phase 3 — clinical innovation and impact
- [x] Prominent links to ATLAS and support; honest preview statuses and educational safety disclaimers.
- [ ] Clinical review and approval of **all 22 ATLAS cases**, translations, scoring and references per docs/MEDVERSE_CONTENT_REVIEW.md. Do not advertise medical competence certification.
- [ ] Security/privacy review of any AI tutor; do not send real patient information to third-party models.
- [ ] Obtain and verify institutional partner consent before publishing logos or confirmed collaboration claims.
- [ ] Draft a costed grant concept note, impact reporting methodology and legal/financial fiscal-sponsor route where needed.
- [ ] Only launch teleconsultations after qualified clinicians, clinical governance, privacy controls and operational response coverage are verified.

## Release validation
1. Open campus.html over HTTPS and check Arabic RTL and English LTR, all internal links, keyboard navigation and mobile layouts.
2. Check no public patient data, privileged API keys, invented partners, dates, accreditation or medical qualifications are exposed.
3. Run existing GitHub Actions workflows and database/RLS tests on a staging database.
4. Approve PR only after manual smoke tests. Do not merge automatically without review.
