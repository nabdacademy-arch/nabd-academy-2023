# NABD FINAL LAUNCH — operational release gate

**Audit date:** 2026-11-08. **Status: HOLD — controlled verification required.**

NABD Academy's existing public supplementary educational site is deployed. The presence of a website or records does not establish clinical approval, university accreditation, new-intake readiness, or tested end-to-end academic operations.

## What was implemented

- Read-only administrator **NABD FINAL LAUNCH** panel in the existing admin workspace.
- Actual record-presence checks through the signed-in director's own Supabase client and RLS. Unknown access and query errors never masquerade as zero records.
- A permanent HOLD status whenever human medical, security, operational, privacy and accessibility evidence is missing.
- Arabic-first interface with English toggle, mobile layout, and a minimal anonymous readiness JSON export.
- GitHub Actions integrity and browser checks. No production SQL changes, fake course content, fabricated staff, exam scores, student data or credentials.

## Read-only Supabase inventory from 8 November 2026

| Area | Table | Rows observed | Interpretation |
| --- | --- | ---: | --- |
| Courses | courses | 5 | Presence, not academic sign-off |
| Enrolment records | enrollments | 1 | Not a cohort estimate |
| Faculty assignments (OS) | nabd_os_faculty_assignments | 0 | OS teaching cannot be called operational |
| Learning modules (OS) | nabd_os_course_modules | 0 | No published academic teaching units |
| Exams (OS) | nabd_os_exams | 0 | No actual OS examinations |
| Exam questions (OS) | nabd_os_exam_questions | 0 | No questions to grade |
| Exam attempts (OS) | nabd_os_exam_attempts | 0 | No demonstrated exam path |
| Credential requests (OS) | nabd_os_certificate_requests | 0 | No demonstrated OS issuance path |
| Existing certificates | certificates | 59 | These may be legacy and do not certify OS V22 |
| Skill catalogue | nabd_skill_catalog | 8 | Skill catalogue exists, not a medical qualification |
| Global lectures | nabd_global_sessions | 0 | Lecturer consent and schedule still needed |
| Research proposals (OS) | nabd_os_research_proposals | 0 | No proposals in this OS table |

This is a time-specific database snapshot, not public learner analytics.

## Security read-only check

All 15 selected sensitive and academic tables in the schema review had RLS enabled. Two catalogue tables (courses and global sessions) had anonymous SELECT grants; private academic records inspected did not. RLS policies and grants must still be exercised with distinct authenticated test identities before declaring access control safe.

Supabase Security Advisors separately flagged callable SECURITY DEFINER functions, an optional leaked-password check setting, and several tables with RLS but no policies. Some public privileged functions legitimately enable anonymous application submission or certificate checking, so changing their privileges without tracing real dependencies may break production. No RPC grants or security settings were changed.

Review security advisories within the Supabase project; do not disclose keys or private case records. Sources:
- https://supabase.com/docs/guides/database/database-linter
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Human sign-offs still required

- [ ] Clinical expert review of the 22 ATLAS fictional cases, translations, scoring and citations. See MEDVERSE_CONTENT_REVIEW.md.
- [ ] Verified real instructor assignments and approved course materials.
- [ ] Verified guest lecturer consent and actual scheduled sessions.
- [ ] Verified learner-to-lecturer-to-admin permissions and RLS through safe sandbox role tests.
- [ ] Verified enrolment, module, exam, grading, claim and public certificate verification end to end without writing fictitious production data.
- [ ] Verified registration, password reset, privacy rights, deletion and retention.
- [ ] Verified AI Tutor provider credentials and live answer generation using a permitted test identity. An ACTIVE Edge Function with JWT verification is not the same as a functioning AI provider. See AI_ACTIVATION_AR.md.
- [ ] Reviewed and remediated actionable Supabase security findings with a rollback/test plan.
- [ ] Tested mobile, slow connections, keyboard, links and offline educational materials on real devices.
- [ ] Documented academic and executive GO/NO-GO approval. This MUST be granted by authorised humans, never computed from row counts.

## Admin acceptance

1. Sign in to admin.html with the existing director account.
2. Open the new **🚀 الإطلاق النهائي** tab.
3. Confirm student/non-admin sessions cannot view readiness data. Validate admin identity and profile role before queries.
4. Confirm empty tables show zero, errors show unknown and the status stays HOLD.
5. Confirm export contains generic row counts only, without names, emails, tokens or student records.
6. Check the Arabic/English toggle and mobile layout.
7. Compare refreshed counts against Supabase and review the security advisories privately.
8. Obtain explicit qualified staff approval before declaring full institutional launch.

**Current determination:** NO-GO for claiming complete academic operations. Existing public educational preview experiences may remain available with accurate limitations. This release makes the outstanding work visible, testable and actionable without changing real learners' records.
