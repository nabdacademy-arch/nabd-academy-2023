# NABD Examinations & Quality — Director-controlled release

## What is live in this release
- `quality-exams.html`: founder/director-only login, client-side text extraction from text-based PDFs (up to 15 MB), selected assessment types, question count 1–30, duration 5–180 minutes, AI-generated questions from lecture text and manual question editing.
- AI Edge Function `nabd-quality-generate`: requires Supabase verified JWT and the unique `nabd_exam_owner` authorization. Text-based PDFs send extracted text. Scanned PDFs send compact representative JPEG pages to Gemini/Groq vision; short scans (up to 5 pages and 5 MB) can use Gemini native PDF input. Generated questions and AI-proposed answer keys must be reviewed by the director before saving.
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
- Image-only PDF scans are supported through multimodal vision (not locally installed OCR). Long scanned documents use sampled pages and must be checked for missed sections; long text-based files are text-truncated before generation. A human must validate all questions against the original lecture.
- The external AI endpoint requires existing `GROQ_API_KEY` or `GEMINI_API_KEY` Edge Function secrets. Runtime quotas, model access and provider downtime can still prevent generation; the UI now returns reason-specific error messages rather than silently inventing content.
- 2026-11-13 repair: production logs recorded Gemini 503/404 and Groq 413 on a scanned PDF. Compressed page JPEG inputs, limited per-request page samples, added modern Gemini fallback models and a lower-payload Groq fallback, and improved frontend error reporting.
- Default student portal auth is reused (no new password). The director portal uses the same account and the existing unique director-user ID stored in `nabd_exam_owner`.
- No exam has been published, and no student answer has been seeded as part of this deployment.

## Verified checks
- DB migrations applied to the academy's connected Supabase production project.
- Role-separated database test: inserted a temporary exam as the director, published it via RPC, read student-safe questions (no answer key), verified students could not directly select the director's question JSON, inserted a test response as a student, then rolled back the transaction. Confirmed no test exam remains.
- Security adviser report included warnings on pre-existing unrelated tables/functions; new exam tables have scoped RLS and private storage.
- Original JavaScript syntax and static entry points were checked. The 2026-11-13 Edge Function update is deployed (v3); a new end-to-end PDF->AI generation test still requires the director's active authenticated browser session. No test exam was published.

## Practical acceptance test (no students affected until final click)
1. Sign in at `quality-exams.html` with the director account.
2. Upload a text PDF, choose question types/count and set 60 minutes.
3. Generate, review all AI-created questions and answer keys.
4. Save as a draft; confirm it is **absent** from `student-exams.html`.
5. For live release only, click `اعتماد ونشر الآن`; check a real student account can open the quiz.
6. Have a consenting test student submit; inspect human grading; after time expires verify the server refuses late submissions.

## 2026-11-15 — Import a prepared examination unchanged (director only)

- The director's `quality-exams.html` page now has a second, **independent** action: **رفع امتحان جاهز وتحويله إلى امتحان إلكتروني**. The lecture-to-question generator remains intact.
- Accepted files: PDF (including scanned exams), DOCX, TXT, JPG, PNG, up to 15 MB. DOCX is extracted client-side using Mammoth's plain-text mode; text PDFs are read with PDF.js. For scanned PDFs, every page is sent for vision, never a sample; scans over 10 pages are rejected with instructions to split. All PDFs over 20 pages and text over 50,000 characters are rejected rather than silently truncated.
- The new authenticated Supabase Edge Function `nabd-quality-import` checks the signed-in user's ID against `nabd_exam_owner`. It **transcribes existing** questions and options with instructions forbidding new content, translations, or guesses. The result is nevertheless AI-assisted and **requires visual comparison to the original**.
- The director reviews and edits questions and their answer keys in the existing editor. When a document lacks an explicit key, imported MCQ, true/false, matching and fill-in-the-blank answers remain missing until the director supplies them; saving is blocked for those unanswered objective keys. Multiple-choice questions with 2–6 alternatives retain their original number of options.
- The completed draft uses the existing exam table, 1 mark per question, human publication approval, student portal and grade-bot. A PDF original is stored in the existing private director-only PDF bucket when the draft is saved; **non-PDF originals are processed but are not stored**, only the file name and parsed questions. Never upload patient-identifiable data.
- Limitations: Rich typography, embedded diagrams, mathematical layout, complex tables, handwriting and poorly scanned material may not be reproduced as visually identical content. Check every imported question. For illustrations that materially affect a question, use an editable textual version or postpone publishing until the source can be represented faithfully.
- Production function was deployed with `verify_jwt=true`. A live director-authenticated document-to-student test still requires the director's signed-in browser session; CI covers syntax and isolated importer validation without publishing an exam.


## 2026-11-15 — Exam browser-signal monitor

A new director-only card **مراقب الامتحانات الذكي** has been added to the existing
\`quality-exams.html\`. It is independent of the AI grading bot.

**Director workflow**: choose a previously published exam; when its examination
window is actually open, press **تشغيل المراقب**. Press **إيقاف المراقب** to disable
it for that one exam. The state lives in Supabase, so it does not depend on
keeping the director's browser open. The card shows a recent log (up to 150
events), the student's profile name, full account UUID (there is no separate
student number in \`profiles\`), event type and server timestamp. The director
can refresh the log; only the exam director may use these APIs.

**Student workflow**: proctoring is disclosed before exam start and a status
notice is displayed inside the exam paper. The student sees a confirmation
before opening an exam when monitoring is already enabled. The student page
polls the server every 15 seconds to reflect live director toggles; monitoring
ends on successful submission, voluntary exit or exam expiry.

**Events** (browser-native best effort):
- \`tab_hidden\`: document became hidden, e.g. tab switch, minimizing, phone app switch or lock.
- \`window_blur\`: exam window lost focus while remaining visible.
- \`printscreen_key\`: PrintScreen key event was delivered to the page, **not proof that a screenshot occurred**.
- \`print_shortcut\`: browser received a Ctrl/Command+P shortcut.
- \`copy_attempt\`: browser's \`copy\` event inside the exam.

A normal browser **cannot reliably detect OS screenshots, photo capture from
a second device, or actual cybersecurity intrusion**. No webcam, microphone,
desktop recording, invasive tracking, or background monitoring is performed.
Signals can have innocent causes (calls, disconnection, accessibility tools)
and are NEVER automatic grade penalties or a finding of cheating.

**Security and privacy**: dedicated private Supabase tables are RLS-enabled
and not granted to clients. SECURITY DEFINER RPCs verify director ownership
or the signed-in student role; the server takes \`auth.uid()\` for student
identity and \`now()\` for timestamps. Students cannot read another student's
events or forge the target user ID through the API. Invalid signals are
rejected; repeated signals are throttled and capped. A pg_cron job deletes
events older than 30 days. Data is not transferred to an external AI model.

**Rollout verification**: PostgreSQL migration applied to production, schema
and RPCs checked, repository tests validate syntax and integrations. No real
student exam or screenshot attempt has been used as an end-to-end test. The
system observes client-reported browser events and is not tamper-proof.

## 2026-11-15 — multi-free-provider failover for AI exams

The director's existing lecture-to-exam generation and ready-paper transcription Edge Functions now attempt several model routes without manual switching:

- **Groq:** `openai/gpt-oss-20b` then `openai/gpt-oss-120b` for text, and `qwen/qwen3.8-27b` for sampled scanned-page images.
- **Google Gemini:** `gemini-3.5-flash-lite`, `gemini-3.8-flash`, then `gemini-2.5-flash-lite` where the account remains eligible. Gemini 2.5 access is restricted for some newer API projects; a provider may reject it without affecting the others.
- **OpenRouter Free (optional third-party reserve):** exclusively `openrouter/free`. The provider routes this alias among zero-cost models but enforces free request limits (typically 50 requests/day and 20/minute without paid credits); model availability and multimodal support can change. This integration does **not** work until a director adds a personal `OPENROUTER_API_KEY` server-side to the NABD Supabase Edge Function secrets. Generate a key via <https://openrouter.ai/settings/keys>, then set it in the Supabase project's **Edge Function Secrets** section; **never** place the key in GitHub or website JavaScript.

The code automatically switches to the next configured provider if a model returns a quota, network, authentication, or malformed-output failure. It does not hide exhausted quotas, retry indefinitely, invoke paid OpenRouter models, or publish without director approval. Source data may be sent to the selected AI provider for processing; do not upload confidential student/patient data. On Gemini Free, user-submitted data may be used to improve Google's products per its terms.

This change adds resilience, **not unlimited inference**. Existing Groq and Gemini API project billing tiers remain governed by the academy's provider-account settings. For strict $0 spending, verify the original Groq/Gemini keys are tied to free-only, no-billing accounts. OpenRouter route is exclusively free, but its key must still be installed. All outputs remain subject to the existing format, source and language checks; a failed AI call cannot silently create exam questions.

Verification: CI tests mock exhausted upstream providers and confirm correct fall-through to `openrouter/free` without any paid-model choice or fabricated answer keys. A live end-to-end PDF test requires the director to sign in and upload their own document. No live student exams are modified.


## 2026-11-15 — Director can permanently delete exams with student answers

- The director's Delete Exam control invokes \`nabd_quality_delete_exam(p_exam)\` instead of deleting the parent record directly. The browser no longer blocks deletion just because \`nabd_quality_submissions\` already contains answers.
- The function requires the actual authorized director \`auth.uid()\` and verifies \`created_by\` ownership of the target exam under a row lock. Unauthenticated users and other students cannot execute it.
- After **two clear, irreversible-action confirmations**, the selected exam can be removed regardless of status, **even if it is currently open**. This immediately invalidates access to the paper, discards all submission answers, AI/human grades, notes and linked proctoring signals/settings.
- Deletion of submissions, proctor records and the exam is contained in **one database transaction**. Any error rolls back the entire deletion. Success includes verified exam ID and removed-row totals, and the UI refreshes. Linked private PDF files are cleaned up only after checking that no other exam references the file.
- This does not automatically delete any existing exam. It is a permanent destructive operation initiated by the director, not a background cleanup. Export any results needed for academic records **before** pressing Delete.
- The production function was installed on Supabase and checked for EXECUTE rights (authenticated: allowed but checked in the function; anon: denied). Existing exam/answer counts remained unchanged immediately after installation. The actual deletion of a real student-result exam is not exercised as part of automated verification.
