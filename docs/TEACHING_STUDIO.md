# NABD pathways and Teaching Studio

Prepared for publication alongside the existing academy pages. No accounts have been changed and the SQL migration has not been applied to the live database. Existing published ATLAS files are retained.

## Pages and integration

- `academy.html`: Arabic RTL directory of six existing/new academy workspaces, with a shared identity and the Learn → Reflect → Contribute → Document journey. Pathways are navigation, not claims of new accreditation or automated assessment.
- `lecturers.html`: uses the existing Supabase account and course records. Admins assign existing Auth UUIDs to existing courses. Lecturers create/edit sessions and resources, including objectives, references, scheduled time, and draft/published status. Students see published records for their enrolled courses. Search/status filters apply to loaded results; records load in pages of 30.
- `assets/js/academy-priorities.js`: registers an additional tab through the existing admin extension API. Reads at most 50 incomplete `portal_tasks`, ordered by due date. Counts explicitly describe this result set; overdue dates use Asia/Hebron. No emails, decisions, or automatic task updates.
- Existing home, student, executive and admin pages link to the new pages. Existing sign-in, enrollment and certificate logic is retained.

## Database activation (not applied)

Review and apply `supabase/migrations/20261105_teaching_studio.sql` once as the database owner after taking a backup. It runs in a transaction and deliberately fails on existing tables/functions instead of replacing unknown live objects.

Prerequisites verified from existing frontend queries, and still requiring confirmation against the live schema:

- `profiles.id` is the Auth user UUID and `profiles.role='admin'` grants academy administration.
- `courses.id` exists; UUID/numeric IDs are supported through text comparison.
- `enrollments.student_id` is the Auth user UUID and `enrollments.course_id` identifies the course. Access follows existence of this enrollment record, matching the existing student portal; no new assumptions about enrollment status fields are made.
- Existing RLS permits the expected course and enrollment reads. Portal founder alone does not grant this new admin authority: this follows the existing academic `profiles.role='admin'` model.

The migration adds two `nabd_teaching_*` tables, indexes, validation triggers, an admin-check function, and RLS policies. No service-role credential is used in the browser. Anonymous access and client deletes are not granted. A lecturer cannot self-assign, edit another lecturer's record, move a record to an unassigned course, or change its identity. Revocation removes teaching access; published materials remain available to enrolled students. Course existence is validated on writes; the migration does not alter the course table or add course-deletion behavior.

After activation, open the studio as an existing academy admin, select a course, enter an existing lecturer's Auth UUID and name, and save the assignment. The lecturer signs in with their existing account. Credentials are never entered by the admin in the assignment form. Use the existing student portal for account creation/recovery. Session dates are entered and shown in the viewer's local device timezone and stored as UTC.

## Validation

- `node --check assets/js/lecturers.js` and `node --check assets/js/academy-priorities.js`.
- Serve the root with `python -m http.server 8000`, then run `node tests/teaching-studio.browser.cjs` with Playwright installed. The test isolates the backend and checks guest/student/lecturer/admin/missing-schema states, editing, unsafe HTML and links, search, and mobile/desktop widths.
- `tests/teaching-studio.database.cjs` uses PGlite PostgreSQL in isolation with a minimal existing-schema fixture. Tests migration execution, RLS for each actor, assignment revocation, course validation, immutable identity, URL restrictions, and anonymous denial. Instructions for installing the test dependency into `/tmp` are at the top of the file.

Live account behavior and the actual Supabase schema have not been tested. Review the migration against that schema before activation; the interface reports missing-schema errors without pretending records were saved.
