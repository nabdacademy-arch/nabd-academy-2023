# NABD Academy v2.1

A bilingual-ready digital academy platform designed for GitHub Pages + Supabase.

## Working features once Supabase is connected
- Public medical courses loaded from the database
- Course registration applications
- Student self-registration and email/password login
- Password reset flow
- Student dashboard with courses, progress, hours, and certificates
- Private certificate PDF files using signed URLs
- Public certificate verification without exposing the certificate table
- QR-ready verification URLs
- Protected admin dashboard (`role = admin`)
- Review/approve course applications
- Course CRUD
- Automatic certificate IDs by course and year
- Issue/revoke/restore certificates
- Research Center
- Evidence-first achievements
- Arabic/English landing page
- GitHub-Pages-compatible static frontend

## Security model
- No service-role key in the browser
- No database password in GitHub
- Row Level Security on private tables
- Public verification uses a restricted SQL function
- Certificate PDFs are stored in a private bucket
- Students can access only their own records/files
- Admin operations require an authenticated profile with `role='admin'`

See `SETUP.md` for deployment instructions.
