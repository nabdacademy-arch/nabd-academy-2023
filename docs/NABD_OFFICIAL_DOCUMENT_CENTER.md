# NABD Official Document Print Center

Open `admin.html` → **▤ مركز طباعة المستندات الرسمية** → `official-documents.html`. Authorized operators may also reach this page from the councils portal. The browser page is public HTML, but all actual identities, issue operations, history and delegated roles require verified Supabase Auth and server-side authorization.

## Six immutable templates

- **إفادة قيد بيانات** — confirms an account exists in NABD, *not* course enrollment or a degree.
- **تصريح مشاركة تنظيمي** — internal event participation permission only, not travel, entry, licensing or medical practice authorization.
- **تقرير إداري** — administrative record, never a medical report or diagnosis.
- **نموذج طلب علاج / إحالة** — treatment coordination request; no prescription, medication, dosing, diagnosis or clinical advice.
- **نموذج طلب استشارة** — consultation request, not a medical consultation.
- **استمارة تقديم شكوى** — standardized complaint form, with blank physical fields; no complaint narrative is sent to the QR service.

Every template has fixed wording. The only inserted human information comes from a *selected account* in the NABD `profiles` table, and the issuing administrator or delegated official. Date and unique issuance number are generated **server-side**, not supplied by the browser. Issued documents cannot be modified in place.

## Issuance workflow
1. Sign in as Academy admin, or an explicitly delegated operator.
2. Select one of the six permitted templates.
3. Search the name in NABD profiles and select the correct existing account.
4. Choose **إصدار المستند بالبيانات المعتمدة**.
5. A permanent document record is created, with server-issued timestamp, issuer identity and random QR verification token.
6. Review the formal A4 portrait letterhead with academy electronic seal, issuer identity and exact fixed template text.
7. Use **طباعة أو حفظ PDF** (browser Print → Save as PDF / printer). Print is disabled if QR fails to render.

**No handwritten signatures, imitated official seals or claims of government/medical accreditation.** The visible stamp is an Academy **digital institutional seal** and the "signature" is the authenticated issuer's name with an explicit electronic approval label. A document is an internal NABD communication, not proof of clinical competence.

## Operators and permissions
- Directors with `profiles.role='admin'` can issue all templates, see the full register, void records, and delegate selected types to individual accounts.
- Delegated operators have exact allowed types and `active` flag in `nabd_document_issuer_permissions`; they can issue only those categories and read only the documents they themselves issued.
- All searches of subjects and all document mutations happen in the server Edge Function after validating a **fresh Auth JWT** and server-side role/grants. Students/lecturers without explicit grants cannot issue documents.
- A public URL to the page does **not** grant permission.
- The director can revoke document issuance privileges and void previously issued documents, whose public status changes immediately.

## Public verification and privacy
QR → `official-document-verify.html?token=<unguessable uuid>`.

The public, read-only `nabd-document-verify` endpoint returns **only** document number, fixed category, issue timestamp and whether the document is **valid**, **void**, or unknown. It **never returns the student's name, issuer name, document text, health information, or complaint narrative**. The verifier explicitly states that it only establishes an internal NABD issuance.

Issuance function `nabd-official-documents` has `verify_jwt=true`; verifier has `verify_jwt=false` with random token. No service role key is included in the frontend. Both `nabd_official_documents` and `nabd_document_issuer_permissions` have RLS enabled and **no anon/authenticated table grants**. Service role reads and writes only via validating functions.

## Limitations
- No clinical diagnosis, prescription, treatment decision or doctor signature is generated. Real clinical documents require verified medical practitioners, detailed individual case evidence, professional sign-off and applicable local regulatory review, which this module does not attempt.
- There is no real qualified-signature certificate or legally recognized e-signature. The digital mark signifies a system-issued Academy record only.
- Documents are printed or saved using the browser print dialog, not uploaded PDFs or external attachments.
- Real end-to-end account, printer, mobile and QR testing still requires an **authorized test user**, which has not been created automatically.

## Deployment
- SQL migration: `supabase/migrations/20261121_official_documents_center.sql`
- Secure Edge Function: `supabase/functions/nabd-official-documents/index.ts`
- Public verification: `supabase/functions/nabd-document-verify/index.ts`
- UI: `official-documents.html`, `assets/css/official-documents.css`, `assets/js/official-documents.js`
- QR page: `official-document-verify.html`, `assets/js/official-document-verification.js`

Verify: `node --test tests/official-documents.test.cjs` plus NABD Councils CI workflow.


## Bilingual institutional issuance (v3)
Every **new** document displays Arabic and English together on a single A4 page. Each template keeps fixed, institutional wording in both languages. The document retains one server-generated number (`NABD-DOC-0000001` format), server-issued Palestine-local date, UUID-based QR verification, and a scannable CODE128 linear barcode. Reprinting an existing document uses the **same registered number, QR token and issue date**; requesting a new issuance creates a new number and token.

For statements, organizational permissions and administrative reports, the server additionally snapshots **only verified Academy data**, if available:
- The person's actual profile role, without inferring an undocumented title.
- Active council appointments, positions and membership numbers.
- Courses backed by `certificates.status = 'valid'`, labeled as certified.
- Courses marked `enrollments.status = 'active'`, **clearly labeled as ongoing / not certified**, not as completed.
- The issued document retains this record-time snapshot; editing a student's account after issuance cannot silently alter an already-issued statement.

The browser cannot send custom unverified role, course, title, name or issue date values. All evidence is loaded inside the authorized Edge Function using server-role **SELECT-only** grants to the relevant certificate, course and enrollment tables. Those fields are not included in the public QR response. Existing historical documents keep their original stored content and are **not** backfilled with later claims.

### Electronic director sign-off
The Academy's **digital institutional seal is positioned above the named electronic signatory**. When the sole director/admin account issues a document, the system records a printed director attribution (`محمد خالد العرجا` when the current director profile display name is empty). Delegated issuers are attributed by their own registered profile names and never automatically given the director's signature. This is **typed electronic authorization**, not an imitation of a handwritten personal signature. Uploading a genuine signature graphic would require the director's explicit provision and consent. Do not present the mark as a government-issued cryptographic signature.

QR and CODE128 are encoded in-browser with pinned scripts; if either is unavailable, the print action stays disabled rather than silently producing an unverifiable certificate. The printable layout remains fully bilingual even when shown on a small phone; choose Print → Save as PDF to create an A4 original.
