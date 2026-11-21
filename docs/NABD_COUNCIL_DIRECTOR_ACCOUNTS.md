# Director-managed accounts for the eight NABD councils

## Where it appears
Open `admin.html` using an existing **NABD academy administrator account**, then select **♛ إدارة حسابات المجالس الثمانية**. The UI displays all eight councils, one at a time.

All users continue to log in through the single `councils.html` portal. Each council has a stable reference code and a deep link, for example `councils.html?council=academic`; this link only routes **after** verified authentication and active membership checks. Codes **are not access keys, passcodes or security controls**.

| Council code | Human-friendly code |
|---|---|
| `trustees` | NCN-TRU |
| `academic` | NCN-ACA |
| `research` | NCN-RES |
| `students` | NCN-STU |
| `international` | NCN-INT |
| `quality` | NCN-QUA |
| `digital` | NCN-DIG |
| `humanitarian` | NCN-HUM |

## Create an account
1. Choose the assigned council, then **إنشاء حساب جديد**.
2. Enter the member's real name, a **real email they control** (their login username), an initial strong password, and position (member/chair/vice-chair/secretary). Generate a random password if preferred.
3. Confirm you have verified the account owner's email and their consent. The server creates a Supabase Auth account with this email/password, attaches **only the chosen** council membership, and records the administrative action.
4. Copy the initial credentials **once**, share them privately with the member, and hide them from the admin screen. Passwords are never stored in council data or audit tables.
5. In `councils.html`, members sign in and use **أمان الحساب / Account security** to replace the initial password.

Do not use fake emails, reused passwords or public message groups to share credentials. New accounts with existing email addresses cannot be created again; use the existing-account option instead.

## Attach an existing account
Select **ربط حساب موجود في الأكاديمية**, search by name or email, choose the correct profile and council position, then assign it. The account's original student/instructor/admin `profiles.role` is retained. Its password is **not** read or changed. The server additionally fetches each searched account's canonical Auth email before presenting it.

## Memberships
The director can view current members per council, suspend or reactivate a membership, or assign the same existing account to another council. A suspended membership no longer authorizes access to that council's records. Other memberships remain unaffected.

## Security boundaries
- `supabase/functions/nabd-council-provision/index.ts` performs every mutation **server-side** using a secret credential from Supabase's environment, never the webpage.
- Each request validates the current Supabase JWT and re-reads `profiles.role = 'admin'` from the database. Browser-origin checks are an additional measure, not the primary authorization boundary.
- The `public.nabd_guard_profile_role_changes` trigger prevents regular users from promoting their own roles in `profiles`. This closes a pre-existing role-escalation path that could have compromised the council provisioning endpoint.
- Existing council membership and record RLS policies are unchanged.
- `nabd_council_account_audit` records administrative actions **without passwords or secrets**, readable only by admins.
- The director panel uses **email/password** credentials because the existing Supabase Auth login uses email; a display nickname alone is not an accepted login identifier.

## Validation
Automated checks: `node --test tests/council-director-provisioning.test.cjs tests/councils-gateway.test.cjs` and the NABD Councils CI workflow.

For post-release manual validation, use non-production test accounts with director authorization: create, assign, suspend, confirm the restricted portal route, log out, switch identities, and change a temporary password. No member accounts are automatically generated during deployment.