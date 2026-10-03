# NABD Academy v2.1 — Live Setup

## 1. Create a Supabase project
Create a new Supabase project and keep the database password private.

## 2. Run the schema
Open **SQL Editor** and run the full file:

`supabase/schema.sql`

This creates:
- student profiles
- courses
- public course applications
- enrollments
- certificates
- public-safe certificate verification RPC
- certificate ID sequence (`NABD-MT-2026-0001` style)
- private certificate PDF storage
- research projects
- documented achievements
- Row Level Security policies

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

## 4. Create the first admin
1. Open `portal.html` and create the admin account normally.
2. Confirm the email if Supabase email confirmation is enabled.
3. In SQL Editor run:

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
Keep the existing repository as a backup first. Upload this version only after testing in a branch or separate repository.

Recommended workflow:
- create branch `v2`
- upload v2.1 files
- test
- merge to `main`
- enable Pages from `main / root`

## 8. Contacts
`config.js` currently contains the WhatsApp/phone number already provided in the research document. Email and Telegram remain `TO_CONFIRM` until the exact public values are confirmed.

## 9. Awards
Do not publish the cancer-research award claim until its certificate, official letter, or verifiable correspondence is added. The system already supports evidence URLs.
