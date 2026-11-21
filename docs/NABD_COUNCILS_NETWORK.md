# NABD Councils Network (NCN)

## Scope
A private bilingual portal at `/councils.html` for the **eight non-executive councils**. It does not replace the existing Executive Council (`/portal/`), student portal, lecturer studio or homepage design.

Councils: Trustees, Scientific & Academic, Research & Innovation, Supreme Student, International Relations, Quality & Integrity, AI & Digital Transformation, Humanitarian & Sustainability.

## Access model
- Existing Supabase email/password account; the portal never offers self-service membership.
- `nabd_council_memberships` stores *explicit* council membership assignments.
- A normal account with no active council assignment is denied at login, even if it is a student or lecturer.
- Members see only their own council records; members of multiple councils may access each of their councils.
- Academy administrators with `public.profiles.role='admin'` may view/manage all eight councils.
- **All private records, membership reads, and membership changes are secured by database RLS.** A hidden button alone is never the authorization boundary.

## Appointments
1. Confirm the person's identity and create/locate their existing Supabase Authentication account.
2. Find the account UUID in Supabase Dashboard → Authentication → Users.
3. Enter the UUID, council and position in the portal's **إدارة العضويات / Manage members** (visible only to administrators), then approve.
4. The member can log in using their existing academy account.
5. Administrators can suspend or reactivate an appointment; suspending a user's final active appointment removes normal portal access.

Positions: member, chair, vice-chair, secretary. Only chairs/vice-chairs and administrators can change a record's status. Everyone with active access to a council can create proposals, meeting minutes, decisions, tasks and internal notices for that council.

## Data
- `public.nabd_council_memberships`: assigned user UUID, council code, position, active flag.
- `public.nabd_council_records`: council-scoped records and statuses.
- The portal reads up to the 200 most recent records the caller may access. The displayed counts are based on these loaded records, not complete institutional totals.
- No membership or records are auto-created, and there are no fictional sample users.
- Never put patient-identifying information, student grades, passwords or secret credentials in council records.

## Deployment
The SQL migration is `supabase/migrations/20261121_nabd_councils_network.sql`. It is additive and independent of the existing Executive Council. Apply it only once in new environments; verify RLS and explicit grants. The NABD production Supabase project received this migration on 2026-11-21.

Static files: `councils.html`, `assets/css/councils.css`, `assets/js/councils.js`. Searchable routes: `academy.html`, `assets/js/academic-core.js`, `assets/js/nabd-signature.js`.

## Test cases to review with real *authorised* test accounts
1. Logged-out visitor: sees login only; no private workspace data.
2. Ordinary student/lecturer without membership: is refused.
3. Member of one council: sees only that council's records; attempts to read other councils via REST are denied by RLS.
4. Member of two councils: sees both; cannot assign themselves to a third.
5. Chair: can approve/close a record in their own council, not another council.
6. Administrator: can assign and suspend memberships, and read all eight councils.
7. Switching between accounts or signing out clears previously loaded records immediately.
8. Test on mobile and desktop in Arabic and English. Run `node --test tests/councils-gateway.test.cjs`.

**Privacy notice:** A GitHub Pages HTML shell is publicly retrievable. Private content is protected by Supabase Auth and database policies, not by secrecy of the page URL.
