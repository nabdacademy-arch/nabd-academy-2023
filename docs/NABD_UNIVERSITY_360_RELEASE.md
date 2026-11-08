# NABD UNIVERSITY 360 — operational release

**Release date:** 2026-11-08.  
**Scope:** Safe Pilot, Personal Study Mentor, Director Mission Control, Global Volunteer Faculty, Verified Achievement Passport.  
**Launch determination:** **NO-GO for unrestricted institutional or clinical launch.** NABD Academy is a supplementary educational platform; UNIVERSITY 360 is a product name, not institutional accreditation.

## What the release actually implements

1. **Safe pilot readiness** — director-only dashboard with twelve live Supabase table counts and a six-part human review checklist, always HOLD until qualified staff and the director approve. No fictitious student enrolments, instructor assignments, test scores, certificates or meeting links are seeded. The pilot is a readiness gate, **not a launched cohort**.
2. **Personal study mentor** — authenticated learner portal with actual enrolments, module visibility, exam attempts and educational skill statuses under learner RLS. Saves a weekly study time and goal in a new owner-scoped table. Gives recommendations from real academic activity, never invented progress. The opt-in AI button sends only a learner-requested course title + study goal to the existing JWT-protected smart-processor Edge Function. Generation depends on provider/quota and is not medical advice.
3. **Director mission control** — new UNIVERSITY 360 module in admin.html, verifying the current Supabase Auth identity and the real profile admin role **before** querying private metrics or volunteer applications. Includes operational counters, pilot gates, quality links and human moderation of faculty applications.
4. **Global volunteer faculty** — authenticated private application form for expertise, institution, country, available hours and proposed topic. Applicants see only their own application; directors may review and update status. Approval does not assign a teaching role, publish a speaker identity or announce a lecture.
5. **Achievement passport** — reads only the currently signed-in learner's existing issued credentials and verified nonexpired skills. Does not issue documents, alter grades or grant clinical authorisation.

## Database and security

Supabase migration named nabd_university_360_role_guard_and_learning was applied to project zsmmmljgguycrvyrmakl. Reproducible repository SQL: supabase/migrations/20261108_nabd_university_360_role_guard_and_learning.sql.

- nabd_360_study_plans: primary-key account owner, optional course, weekly goal and focus note. Owner reads/writes; administrators may inspect during audit.
- nabd_360_lecturer_applications: owner, protected application details and review status. Applicant can insert a single consented pending application and read only their own. Only verified directors update the decision through RLS and restricted column grants.
- Both new tables have RLS enabled and **no anonymous SELECT or INSERT grants** (verified in database).
- **Security fix:** A server-side profile UPDATE trigger now blocks ordinary users from modifying profile authority fields (role, id, email, created_at), closing a potential self-role-change path in the earlier own-profile UPDATE policy. Admin and privileged service operations remain possible.
- Supabase Security Advisors continue to warn about other callable SECURITY DEFINER functions and leaked-password protection; those require separate reviewed remediation.

## Snapshot, 8 November 2026

| Area | Existing records |
| --- | ---: |
| Courses in catalogue | 5 |
| Enrolments | 1 |
| University OS faculty assignments | 0 |
| University OS modules | 0 |
| University OS exams | 0 |
| Global sessions | 0 |
| Support tickets | 1 |
| Skill evidence records | 0 |

These are production database snapshots, *not* cohort counts, quality approvals or academic accreditation.

## Acceptance checklist

- [ ] With separate authorised test learner and director accounts (prefer staging), prove own-record access isolation and blocked privilege escalation. Do not invent production students to inflate activity.
- [ ] Save a student weekly plan and reload; verify another student cannot read/update it.
- [ ] Explicitly request an AI weekly revision plan; verify real provider output, quota and account checks. Only the course title and selected study goal should be sent.
- [ ] Submit a verified lecturer application. Confirm other applicants cannot read it, and director can review without automatically granting lecturer roles or publishing their personal details.
- [ ] Verify the 360 admin module blocks non-admin identities from reading dashboard metrics and applicant data.
- [ ] Review 22 fictional ATLAS clinical cases, speaker consent, copyright and accessibility on real low-end Android devices.
- [ ] Prepare approved modules and test a real enrolment → study → supervised exam → credential review lifecycle without fictitious production data.
- [ ] Inspect current security advisors, privacy retention and profile privilege tests with a vetted rollback plan.
- [ ] Confirm GitHub Actions and Pages deployments are green, and obtain written academic and executive GO/NO-GO approval.

**Still pending real-world work:** a live pilot cohort, actual faculty assignments and sessions, published medically reviewed course content, approved exams, and independently validated credential issuance. AI Tutor remains provider dependent; no clinical AI diagnosis or live-agent support SLA is claimed.

Companion documents: docs/NABD_FINAL_LAUNCH_2026-11-08.md, docs/NABD_ONE_RELEASE_2026-11-08.md, docs/MEDVERSE_CONTENT_REVIEW.md.
