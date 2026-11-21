# NABD Councils — Verifiable Membership IDs and Appointment Certificates

This is an **internal academy council membership** system, not a government accreditation, university degree, or medical license.

## Director workflow

Open `admin.html` → **إدارة حسابات المجالس الثمانية**. Select one council, then create a member account or assign an existing Academy account as before. The database now issues a permanent code automatically:

`NABD-NCN-ACA-0001` (first appointment to the Academic Council)

Each council has its own counter, and each membership's number is **unique and immutable**. Removing or suspending an appointment does not change another member's number. An account appointed to two councils gets **two distinct council membership numbers**. No membership records or fake recipients were inserted while implementing this feature.

In the selected council's membership list, use **بطاقة العضوية وشهادة التكليف** to open the member's printable documents. The documents are generated from real RLS-protected membership data.

## Member workflow

A signed-in appointed member visits `councils.html` → **بطاقتي وشهادتي**, selects their active council and opens the document view. Members cannot open someone else's record without server-side permission. Their portal account has not changed, and **the number is not a login credential**.

The document page at `council-documents.html` provides:
- A formal navy-and-gold council membership card with name, council, role, permanent ID and scannable QR.
- A landscape appointment certificate showing the same code, role, council and appointment date.
- **طباعة / حفظ PDF** opens the browser print dialog. Choose *Save as PDF* (or an available printer) — no server-side PDF upload or downloadable file is created automatically.

The document view relies on the already-used third-party QRCode.js script loaded over HTTPS, but generates QR content **locally in the browser** (the member's token is not sent to a QR image service). If the script cannot load, the print button is disabled rather than issuing an unverifiable document.

## Public QR verification

A QR points to:
`https://nabdacademy-arch.github.io/nabd-academy-2023/council-verify.html?token=<unpredictable-uuid>`

The public `council-verify.html` calls the read-only Supabase Edge Function `nabd-council-verify`. It **does not require login**. The result is checked against the current database membership, not a static certificate snapshot.

- **Active**: shows member name, assigned council, role, permanent code and appointment date.
- **Suspended**: shows a clearly **inactive** result, without the person's name.
- **Unknown/revoked**: shows invalid.
- **Network/backend error**: shows *could not verify*; never incorrectly claims the membership is valid.

The URL token is a generated random UUID and **is distinct from the sequential member number**; simply knowing a member's public code cannot retrieve their profile. QR links may reveal the verified member's name and institutional role to whoever receives the card, which is part of their intended purpose. **Do not publish QR links for members who have not consented to sharing their identity.**

No passwords, emails, account UUIDs, or secret backend keys are placed in the QR. No service-role key appears in browser files. Both membership tables remain behind RLS.

## Security and schema

`supabase/migrations/20261121_council_member_numbers_and_verification.sql`:
- Adds `member_code` and `verify_token` to `nabd_council_memberships`.
- Adds a private-to-API per-council sequence counter with RLS and **no anon/authenticated grants**.
- Assigns numbers and random tokens in a **database trigger**, including for memberships created via the existing director workflow.
- Backfills existing memberships without resetting positions or activation status.
- Adds uniqueness constraints and disallows direct updates to the new columns.

`supabase/functions/nabd-council-verify/index.ts` is read-only, validates token format, checks the current `active` flag and deliberately returns only minimal safe fields. It is publicly callable by design. Director account-provisioning remains `verify_jwt = true`; public QR verification uses `verify_jwt = false` per `supabase/config.toml`.

## Validation

Run `node --test tests/council-identity-verification.test.cjs`. Additional existing councils checks run from the same workflow. Manual end-to-end verification with a **consenting test member** is required before issuing credentials or cards at scale, particularly QR readability on physical prints and browser print margins.
