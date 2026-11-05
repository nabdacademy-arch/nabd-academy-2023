# NABD connected learning platform

The academy name, founder section, Mohammed Khaled Al-Arja's name and original portrait are retained. Existing students, courses, enrollments, certificates and the published MEDVERSE hospital remain in place. This is an additive implementation, not a database replacement.

## Available without backend activation

`learning/` is an Arabic/English learning application with ten views:

- Student Universe: learning entry point, local practice progress and achievements; existing account records appear when connected.
- NABD LMS: four original public foundation lessons (terminology, circulation, anatomical language and evidence literacy), ten multiple-choice practice questions, explanations, search and device progress. These are self-study materials, not accredited assessments or clinical competencies.
- Medical Tutor: source-linked retrieval from the supplied notes. This mode does **not** generate new answers or analyze images. The separate generative AI action needs the backend activation below.
- Medical Library: ten official reference entries, with search, subject filtering and device bookmarks. External books and articles are linked, not copied. Free reading access does not imply free republication; each source's rights apply.
- Knowledge Graph: eight educational nodes linking anatomy, physiology, a condition and a medication category, with interactive connections and references. Not a diagnostic or prescribing tool.
- Grand Rounds: a three-stage, explicitly scripted terminology discussion, links to the existing hospital case simulations, and a list of academy-published sessions. No fabricated speakers or schedules.
- Scholarships Hub: five official program directories and a local application checklist. No claims about current openings, deadlines, eligibility or guaranteed funding; check official calls.
- Academic Community: contribution form and moderated discussions after database activation; no fabricated members or posts.
- Offline Mode: opt-in public learning pack, actual offline lessons/quizzes/graph, removable cache and a standalone downloadable HTML reading copy.
- Account: connection to the existing Supabase account; sign-up/recovery continue in the existing student portal.

Home, pathways, lecturer and existing student pages provide visible entry points. The home page links all eight development areas and explains that connected services depend on activation. The founder section and portrait are checked against commit `429e071`.

## Offline design

The public pack is approximately 115 KB uncompressed at the time of implementation; final transfer size varies by revision and compression. No external fonts, videos, full textbooks or model files are required. It includes only the learning shell and original public summaries/questions.

`learning/sw.js` is scoped to `learning/` and caches only an exact allowlist. It does not intercept cross-origin requests, POSTs, authorization-bearing requests, the existing student/admin pages or Supabase responses. Account data is discarded from the displayed application on offline/sign-out events and is never placed in the offline cache. The existing SDK may persist its normal authentication session; the pack does not replace that authentication policy. Device practice data contains only public lesson IDs, read flags and best practice scores, independent of a user identity. It never updates official enrollment progress or issues a certificate. Clearing this cache does not touch the separate ATLAS cache or server records.

Private enrolled-course lessons, account records, live session URLs, external references and generative AI require connectivity. The exported HTML reading copy can be opened without a server. The interactive offline application needs HTTPS (or localhost) and Service Worker support.

## Database activation — not applied to the live project

The environment has no configured administrative Supabase credentials. The implementation and tests do not imply that live tables were created.

Review `supabase/migrations/20261105_learning_platform.sql` against the actual schema, take a backup, then apply it once as the project database owner. It is transactional and deliberately fails on existing objects instead of overwriting unknown live definitions. It is independent of the earlier Teaching Studio migration; activate both if both systems are required.

Prerequisites match existing frontend queries:

- `profiles.id` is an Auth UUID; `profiles.role='admin'` grants academic administration.
- `courses.id` exists (UUID and numeric IDs are accepted through text comparison).
- `enrollments.student_id` is an Auth UUID; `enrollments.course_id` identifies the course. Access follows the existence of enrollment, matching the existing portal. No new assumption about enrollment status columns is made.
- Existing course, profile, enrollment and certificate read policies remain in effect. The new account view uses `enrolled_at` and `issue_date` ordering, matching the existing portal.

The migration adds lessons, question metadata, read progress, quiz attempts, assignment submissions, sessions and moderated contributions. Answer keys and tutor quota counters live in a private schema that must not be exposed through PostgREST. The schema is revoked from anonymous/authenticated roles. Student question reads exclude the keys. Grading, assignment submission/review and progress writes are authenticated database functions that validate enrollment and caller identity; client-supplied scores are never accepted. Quiz feedback intentionally reveals explanations after submission: these are repeatable practice assessments, not proctored examinations. Quizzes and tutor requests have six-per-minute guards; the tutor quota counter uses atomic upsert.

Administrators use the added **التعلّم · LMS والمجتمع** tab in the current admin dashboard to create/edit lessons and assignments, add question-bank items, review assignments, publish/edit Grand Rounds and approve/reject contributions. Click **تحديث السجلات** after edits to refresh lists. Public community publication requires moderator approval; authors can read their own pending posts. No automatic email or external message is sent. All query counts describe bounded loaded results, not total academy membership.

No scores, practice points, read flags, grades or moderator approvals automatically award existing academy certificates.

## Generative AI activation — not deployed

The public reference helper works without an AI key. For true generation and educational image explanation:

1. Apply the learning database migration, including the tutor quota function.
2. Deploy `supabase/functions/nabd-tutor/` as the authenticated `nabd-tutor` Edge Function (standard Supabase JWT verification must remain enabled). `index.ts` wraps the dependency-free `handler.mjs`; the curated context is included locally.
3. Configure `OPENAI_API_KEY` as a server-side function secret. `SUPABASE_URL` and `SUPABASE_ANON_KEY` must be available to the function. Optional `OPENAI_MODEL` defaults to `gpt-4.1-mini`; optional `NABD_APP_ORIGIN` defaults to `https://nabdacademy-arch.github.io`. Never put a provider or service-role key into frontend files.
4. Test with an actual academy account. Only the configured origin is accepted. The function verifies the user through Auth and consumes the server-side quota before calling the provider. PNG/JPEG educational images are limited to 2 MB, with MIME/signature checks and a bounded request body. Never upload patient-identifiable images or personal health information.

Requests and answers use `Cache-Control: no-store`. Application code does not log prompts or images. Provider requests use `store:false`; this is not a promise about provider retention policies. The system prompt limits the assistant to education and disallows individual diagnosis, doses, treatment decisions, invented citations, awards or permissions. Source links accompany the answer, but they are supplied references, not live-retrieved full texts; generated answers still need verification. Missing activation fails explicitly without a fake generated answer. Image explanation remains unavailable until this service is deployed and configured.

## Verification

From the repository root:

```sh
node learning/tests/core.mjs
node learning/tests/tutor.mjs
NODE_PATH=/tmp/nabd-db-check/node_modules node learning/tests/database.cjs
python -m http.server 8000
# With the server running, in another terminal:
node learning/tests/browser.cjs
node learning/tests/cloud-browser.cjs
```

The isolated database test uses `@electric-sql/pglite` (install it into `/tmp/nabd-db-check` or adapt NODE_PATH). Browser tests require Playwright and `/usr/bin/chromium`. They cover Arabic/English routes at 320/390/768/1440 widths, quizzes, source retrieval, bookmarks, graph, discussion, cloud state, missing schema, moderation, AI output escaping, sign-out and a real offline reload after disconnecting the browser. Tutor tests mock all provider calls; no real AI requests or costs were incurred. Database tests check RLS, private keys, grading, spoof attempts, enrollment isolation, assignment review/resubmission, community moderation, anonymous restrictions, quota limits and original record counts.

The live Supabase schema, real user sign-in and the external AI service have not been exercised from this environment. Official external reference URLs are curated stable entry points, not a claim of current link or scholarship-cycle verification.
