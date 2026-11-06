# NABD Campus + Global Impact — Integrated release (2026-11-06)

This release combines the three requested development stages in one coherent update without replacing the existing GitHub Pages site, student accounts or certificates.

## Phase 1 — Connected campus
- `nabd-campus.html` is the main student-facing entry point.
- Uses the academy's **existing** Supabase Auth session via `assets/js/config.js` and `assets/js/supabase-client.js`.
- Shows **only** the signed-in student's course enrollments, progress and completion certificates. Unauthenticated visitors see a sign-in prompt, not demo/student data.
- All data requests remain subject to the existing Row Level Security rules in Supabase.
- Arabic/English (RTL/LTR), responsive layout, reduced-motion support, keyboard focus states and no large image dependencies.

## Phase 2 — International lecture registration
- `public.nabd_global_sessions`: schedules, drafts and published sessions.
- `public.nabd_global_session_signups`: authenticated student's private self-registration, unique per student/session.
- Public readers see only **published** sessions. Admins alone can create/publish/cancel sessions.
- Admin scheduling form appears in `nabd-campus.html#sessions` only to an authenticated `profiles.role = admin` account. RLS on the database is the actual gate, not the hidden UI.
- A session remains a draft until a real, consenting speaker and time are confirmed. The admin form requires a speaker name before publication.
- A registered student can cancel their own registration; students cannot see other students' RSVP records or mark their own attendance.
- Meeting URLs are **not stored** in public schedule rows and must only be shared through the academy's approved access channel.
- No sessions are seeded or fabricated.
- Migration: `supabase/migrations/20261106_nabd_campus_global_sessions.sql`. Applied to the existing project and independently confirmed via database policy inspection.

## Phase 3 — Clinical learning + international impact
- `nabd-campus.html#paths` connects existing learning, skill passport, medical knowledge, lecturer studio and ATLAS routes.
- NABD ATLAS's 22 cases remain **unreviewed educational prototypes**. They are not medical advice, competence certification or clinical tools. Clinical approval gates from `docs/MEDVERSE_CONTENT_REVIEW.md` still apply.
- `nabd-partners.html` provides a printable bilingual prospectus and a copyable brief for the planned 12-week free-learning programme.
- Budget is **indicative**, USD 5,500 (1250+950+800+850+650+500+500). Planned targets are twelve volunteer lectures and 200 expressions of learner interest, not verified accomplishments.
- Calls to action use the academy's existing contact form. No new unprotected collection of donor, student or medical details; no card details or personal transfers.
- `index.html`, `academy.html`, `global-lectures.html` and `donate.html` link to these new hubs.

## What remains conditional
- Only **confirmed** speaker commitments, after verification, can be published. No institutional partners or grants are automatically announced.
- A private, consent-based process is still required to share meeting links; this feature intentionally does not embed them publicly.
- In-person medical review is required before ATLAS cases can become reviewed educational content or any skill can be described as validated.
- Public fundraising must wait for proof of registration, recipient eligibility or a suitable registered fiscal partner, financial oversight and payment-provider compliance.
- Official email/Telegram in `assets/js/config.js` still need institutional confirmation.
- Perform real-user mobile/browser/assistive-technology checks before considering the site fully production-validated.

## Manual smoke-test checklist
1. Open `/nabd-campus.html` logged out: personal counts must remain em dashes; no private information should show.
2. Log into the existing `/portal.html`, return to the campus: only this user's actual enrollments and certificates appear.
3. Check a normal learner never sees the admin form; attempt a direct table insert with a non-admin account and confirm RLS rejects it.
4. As admin, create a **draft** future lecture. Check public visitors cannot see it.
5. After obtaining speaker consent, publish a future session. Check anonymous visibility, then register using a student account.
6. Attempt duplicate registration (must be unique), cancel, and verify only the student's own registration is visible.
7. Confirm dates use the viewer's locale and that no meeting access URL is leaked in public JSON.
8. Switch Arabic/English on narrow and desktop screens; verify links, forms and print stylesheet.
9. Check `/nabd-partners.html` budget rows sum to USD 5,500, copy and print work.
10. Run `node --check assets/js/nabd-campus.js`, `node tests/nabd-campus.static.cjs` and existing academy checks.

## No-live-patient-data rule
Never store real patient identifiers in ATLAS scenarios, learning prompts, or materials submitted through the campus. Clinical simulations are fictional and educational only.

## Architecture
```
GitHub Pages (index / campus / partners)
   |   existing public Supabase publishable key (not a secret)
   +--> existing Auth + RLS enrollments / courses / certificates (read-only campus view)
   +--> new RLS-protected published sessions (read-only public)
           +--> private per-student signups (authenticated)
           +--> admin-only creation / publication
   +--> existing separately-scoped ATLAS / learning content (not clinically validated)
```
