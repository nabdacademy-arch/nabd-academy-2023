# أكاديمية نبض العلوم الطبية | NABD Academy of Medical Sciences — Deployment & Readiness

## 1. Create a Supabase project
Create a new Supabase project and keep the database password private.

## 2. Verify the deployed schema — do not run a nonexistent bootstrap file
**Important:** This repository does not contain `supabase/schema.sql`; the previous instruction was stale. An existing Supabase project powers the website, and deployed schema should be inspected before any migration.

Relevant source files:
- `supabase/migrations/` — versioned SQL migrations; review which ones are already applied.
- `supabase/activate_nabd.sql` — **one-time additive** teaching/learning activation for existing tables, not a bootstrap script; its own header explicitly requires a backup, existing schema and a review before executing it.
- `supabase/functions/` — Edge Functions; deployment and provider secrets are separate work.

**Never** run migrations, elevation SQL or an activation file directly against production until a backup, schema comparison, staging rehearsal, permissions review and explicit operator approval have been completed. Applying the script a second time is not supported. Student profile, enrollment and certificate preservation is a release requirement.

Review actual database tables, RLS, `verify_certificate` RPC, authentication redirects, student-to-course access, issuance and private storage; the presence of source files alone does not prove these services work in production.

## 3. Connect the frontend
In **Project Settings / API**, copy only:
- Project URL
- anon/publishable public key

Put them in `assets/js/config.js`:

```js
supabaseUrl: "https://YOUR-PROJECT.supabase.co",
supabaseAnonKey: "YOUR-PUBLISHABLE-OR-ANON-KEY"
```

**Never** put a service-role key or database password in the website or GitHub.

## 4. Verify administrator access (production-sensitive)
1. Open `portal.html` and create the admin account normally.
2. Confirm the email if Supabase email confirmation is enabled.
3. **For a new installation only**, the verified project owner may carefully assign the approved first administrator role after confirming the exact email and account UUID. Review existing permissions and audit logs before any role change. Do not run examples blindly. Example:

```sql
update public.profiles
set role='admin'
where email='YOUR_ADMIN_EMAIL';
```

4. Sign in at `admin.html`.

## 5. Student workflow
1. Student submits `enroll.html`.
2. Student creates a Portal account using the same email.
3. Admin opens **Applications** and clicks Approve.
4. Enrollment appears in the student's portal.
5. When completed, admin issues a certificate.
6. The database generates the certificate ID automatically.
7. Optional PDF is stored privately and is visible only to the student/admin via a short-lived signed URL.
8. Anyone can verify the public certificate fields by certificate ID/QR.

## 6. Password reset
Add your GitHub Pages URL to Supabase Auth **Redirect URLs**, including:

`https://nabdacademy-arch.github.io/nabd-academy-2023/update-password.html`

## 7. GitHub Pages deployment
Keep a backup of the existing repository and deployed configuration, plus a protected database backup. Test frontend changes in a branch, then open a PR with checks. GitHub Pages serves static assets; database-backed student services must be tested independently.

Recommended workflow:
- create a feature branch
- run scoped frontend tests, link checks and available GitHub Actions workflows
- test RTL/LTR, mobile and keyboard navigation
- verify Auth redirects, public verification and RLS against an approved staging environment
- merge reviewed changes into `main`
- verify the Pages deployment for the exact merged commit; use hard refresh only after confirming successful deployment

## 8. Contacts
`config.js` currently contains the WhatsApp/phone number already provided in the research document. Email and Telegram remain `TO_CONFIRM` until the exact public values are confirmed.

## 9. Awards
Do not publish the cancer-research award claim until its certificate, official letter, or verifiable correspondence is added. The system already supports evidence URLs.

## 10. Institutional release gates (updated 2026-11-06)
- **Brand:** use the user-approved Arabic name **أكاديمية نبض العلوم الطبية** consistently. Preserve founder identity and portrait from `assets/images/founder.jpg`.
- **Accessibility and navigation:** keyboard navigation, readable contrast, focus indicators, local quick search and low-data alternate entry; perform real-browser/mobile checks.
- **Credentials:** only verified completion certificates; not an accredited degree, professional qualification or license.
- **Safety:** ATLAS clinical cases remain educational previews until every case has qualified expert review; see `docs/MEDVERSE_CONTENT_REVIEW.md`. Never put real patient details in the demos.
- **Future services:** Global Lectures needs confirmed volunteers and timetable; consultations require clinicians, consent, clinical governance and suitable privacy safeguards before a public launch.
- **Partnerships:** do not publish agreements, funders or attendee counts as confirmed without evidence.
- **Security:** no service-role secret in the client. Review deployed RLS, auth flow and data retention; automated frontend checks are not a security certification.
- **Rollback:** keep the last known-good commit and follow GitHub Pages deployment status for each release.
