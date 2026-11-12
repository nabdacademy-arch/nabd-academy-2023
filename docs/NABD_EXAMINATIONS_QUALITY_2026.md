# NABD Examinations & Quality — Director-controlled release

## What is live in this release
- `quality-exams.html`: founder/director-only login, client-side text extraction from text-based PDFs (up to 15 MB), selected assessment types, question count 1–30, duration 5–180 minutes, AI-generated questions from lecture text and manual question editing.
- AI Edge Function `nabd-quality-generate`: requires Supabase verified JWT and the unique `nabd_exam_owner` authorization. The requested PDF's **extracted text** (not the binary PDF) is sent to the configured Groq or Gemini backend. Generated questions and AI-proposed answer keys must be reviewed by the director before saving.
- Drafts are private and **never auto-published**. Director alone clicks `اعتماد ونشر الآن` after confirmation. The server records the opening timestamp and end timestamp using database time.
- `student-exams.html`: users with `profiles.role='student'` see only published exams during the time window. Other signed-in roles and anonymous visitors cannot read questions. Answers are sent once per student and remain ungraded until a human grades them.
- Question types: multiple choice, true/false, essay, matching, fill-in-the-blank.
- A faculty review/grade panel in the director portal lets the director enter a numeric score out of 100 and notes; no automatic grading or certificates.
- Student account entry points are added to `portal.html`, `learning/index.html`, `university-os.html`, and `nabd-university-360.html`; the academy homepage also links the director and student portals.

## Technical and privacy boundaries
- PDF source files are stored in the **private** Supabase Storage bucket `nabd-quality-lecture-pdfs`, director-only via Storage RLS. Files should not contain confidential patient/participant data.
- Database RLS ensures only the unique director can read/modify exam drafts and review submissions. Students can read exam prompts **only** via a SECURITY DEFINER RPC that redacts `answer_key`, rubric and source excerpts and checks the open window.
- The server checks deadline again on insertion: manipulating the browser clock cannot reopen an expired exam.
- Closed exams remain in the database for audit and manual grading but no longer appear in the student active list.
- PDF image scans without a text layer are not supported (no OCR is installed). Very long files are text-truncated before AI generation. A human must validate all questions against the original lecture.
- The external AI endpoint requires existing `GROQ_API_KEY` or `GEMINI_API_KEY` Edge Function secrets. An active function does not guarantee provider credits/quotas at runtime. Generation fails visibly rather than inventing content.
- Default student portal auth is reused (no new password). The director portal uses the same account and the existing unique director-user ID stored in `nabd_exam_owner`.
- No exam has been published, and no student answer has been seeded as part of this deployment.

## Verified checks
- DB migrations applied to the academy's connected Supabase production project.
- Role-separated database test: inserted a temporary exam as the director, published it via RPC, read student-safe questions (no answer key), verified students could not directly select the director's question JSON, inserted a test response as a student, then rolled back the transaction. Confirmed no test exam remains.
- Security adviser report included warnings on pre-existing unrelated tables/functions; new exam tables have scoped RLS and private storage.
- JavaScript syntax and static entry points checked; production browser login and an actual PDF->AI generation round-trip remain to be tested with the real director session.

## Practical acceptance test (no students affected until final click)
1. Sign in at `quality-exams.html` with the director account.
2. Upload a text PDF, choose question types/count and set 60 minutes.
3. Generate, review all AI-created questions and answer keys.
4. Save as a draft; confirm it is **absent** from `student-exams.html`.
5. For live release only, click `اعتماد ونشر الآن`; check a real student account can open the quiz.
6. Have a consenting test student submit; inspect human grading; after time expires verify the server refuses late submissions.
