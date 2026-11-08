# NABD ONE — Integrated campus release

**Date:** 2026-11-08. **Scope:** NABD CONNECT, ACADEMIC LIVE, LIVE CAMPUS, AI PROFESSOR, QUALITY & TRUST.

## Implemented

1. **NABD CONNECT**: authenticated student support tickets and private reply threads, stored in production Supabase. Students can see only their own tickets; directors can see, respond to and update statuses. Statuses: open, waiting, resolved. The existing Smart Messenger now links directly to the actual private support inbox.
2. **ACADEMIC LIVE**: bilingual public page fetches only real published courses, and connects students to the existing role-protected University OS for enrolments, content, attendance and exams. The administrator console counts existing academic records rather than inventing missing faculty and exams.
3. **LIVE CAMPUS**: dynamic display of published future guest sessions and speaker affiliations, authenticated RSVP through the existing session-signups table. Directors can create a draft, review details and explicitly publish/cancel the lecture. No actual meeting links are stored by these schemas, and none is fabricated.
4. **AI PROFESSOR**: existing authenticated Tutor is integrated into NABD ONE with Learning Space resources, and a director-initiated test of the deployed Edge Function. A deployed function is not proof the provider/quota is live; any test result is explicitly reported.
5. **QUALITY & TRUST**: roles, data, RLS, clinical review and launch blockers remain visible. Existing manual signoff remains necessary; no credentials, accreditations or medical decisions are automated.

## Production database / RLS

Migration name applied in Supabase: nabd_one_connect_secure_tickets_v1. Source SQL is in ../supabase/migrations/20261108_nabd_one_connect_secure_tickets_v1.sql.

- public.nabd_support_tickets: id, student_id, category, subject, status, created_at, updated_at.
- public.nabd_support_messages: id, ticket_id, sender_id, body, created_at.
- Both RLS-enabled. No SELECT or INSERT granted to anon.
- Authenticated students can SELECT and INSERT only their tickets/messages, with strict server-side auth.uid matching.
- Administrators are verified by the existing public.is_admin() function, which looks up the current auth.uid in the database role table. Only administrators may change ticket statuses.
- No browser UPDATE or DELETE privileges on support messages, no service-role key exposure, no impersonated sender IDs accepted by RLS.

## Verification procedure

- [ ] Check database RLS policy list and anon grants. Never create fictitious students in production.
- [ ] With an authorised student test account, open nabd-connect.html, create a non-sensitive support ticket and send a follow-up.
- [ ] With a different student test account, confirm the first ticket is inaccessible.
- [ ] From a verified director account, open admin.html and the new NABD ONE operations tab, reply to the test ticket, update its status, and confirm it appears in the student thread.
- [ ] Create a real speaker-approved lecture draft in the director console. Publish only after checking speaker consent and date. Confirm it appears on nabd-one.html and an authorised student can register.
- [ ] Confirm drafts/cancelled sessions never appear on the published public calendar.
- [ ] Use the director-initiated AI Tutor test and examine Edge Function logs only if needed, without sharing secrets.
- [ ] Run all automated GitHub Actions checks and manual phone/desktop tests.

## Remaining real-world limitations

- **No staffed live chat or guaranteed response time.** The support inbox requires a human operator to review and reply; it does not send email or push notifications.
- **No video-conferencing service or meeting links provisioned.** The calendar and signups function with genuine sessions. Real links and speaker permissions remain operational work.
- **No fabricated courses, faculty, grades, exams or medical validation.** Existing systems may have empty tables and require qualified academic personnel.
- **AI generation depends on the provider, account access and quota.** Clinical fact checking must not be delegated entirely to a model.
- Supabase Security Advisor warnings and clinical review requirements documented in NABD_FINAL_LAUNCH_2026-11-08.md and MEDVERSE_CONTENT_REVIEW.md remain open. This release does not assert full accreditation or launch readiness.
- Retention policies, abuse/rate limits, operator response SLAs, and independent privacy/security review require human policy decisions before scaling.

The public educational experience is supplementary, not an accredited university or diagnostic medical system.
