# NABD Moodle | Student Academic Hub

## Scope
The `nabd-moodle.html` page is the academy's custom Moodle-style student experience. It is **not** a deployment of Moodle LMS or an official Moodle partner instance.

### Student profile
- Uses the existing Supabase Auth session shared with `portal.html` and `learning/`.
- Displays the authenticated student's `profiles.full_name` and verified Auth email. No guest or other user's profile is displayed.
- Requires a current `profiles.role='student'` row; faculty and director accounts do not get student data from this page.

### Five existing courses
- Loads only actual `courses.status='active'` database records. As observed during implementation, there were exactly five: medical terminology, general anatomy, physiology, biochemistry and pathology.
- Displays real descriptions and recorded instructional hours, plus the user's own `enrollments` statuses.
- `تسجيل في الدورة` invokes `nabd_moodle_self_enroll(p_course_id)`. The SQL function checks **authenticated student**, **existing active course**, and inserts **only the caller's enrollment**, without exposing general INSERT privileges on `enrollments`. The constraint prevents duplicate enrollments.
- A course enrollment unlocks the academy's existing student course access. It does not automatically issue a certificate, grade or proof of course completion.
- This is *direct student enrollment* for active courses, not the older anonymous `course_applications` approval workflow. The old workflow and records remain intact.

### Live examinations
- The `nabd_quality_active_exams` RPC is used unchanged. Only director-approved published exams in their server-side open window appear to authenticated students.
- Direct `student-exams.html?exam=<UUID>` links open a particular approved live exam after the student page re-checks active-exam authorization; no private answer key or draft is exposed.
- No exams are published by the Moodle dashboard.

### Grades
- `nabd_quality_student_history` returns only this student's own exam submissions. Pending human grading remains visibly pending, without fabricated marks.
- Once the authorized director records `human_score`, results and any reviewer notes appear in the same Moodle page.
- Moodle refreshes when the student returns to the tab and about once per minute while visible.

### Academy integration
- New eighth pathway card on the academy homepage.
- Authenticated student portal dashboard shortcut, learning-space sidebar link and academic University OS/360 navigation links.
- Accessible Arabic-first RTL layout with English toggle and mobile responsiveness.

## Safety & verification
- Uses no new credentials or client-side privileged keys.
- Tested student self-enrollment on an existing active course inside a DB transaction rolled back afterward. Verified no test enrollment remained.
- Verified anonymous users cannot execute the enrollment function. RLS on existing enrollment rows remains in place.
- JavaScript syntax checked; all DOM IDs referenced by the Moodle JS exist in the HTML; student exam deep links use the existing authorized RPC.
- No published examination, course registration, grade or student personally identifiable record was seeded.
- Live browser rendering and end-to-end director publication → student examination → manual grading flow require an authenticated user acceptance test.

## Test it
1. Sign in to `portal.html` using a student account, then open `nabd-moodle.html` and verify the name and email.
2. Click `تسجيل في الدورة` on an active course and confirm status updates to enrolled.
3. On an approved exam, click `بدء وحلّ الامتحان`; `student-exams.html` should open the same exam after checking availability.
4. Submit an exam only for a real operational test. Until the director grades it, the Moodle results row must show `بانتظار التصحيح البشري`; after grading, it must show the actual score.
