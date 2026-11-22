# NABD Academy — verified Supabase safety and performance pass
**Audit date:** 2026-11-22 · **Project:** Production Supabase · **Scope:** PostgreSQL RLS, table privileges, indexes, public/private reads.  
**Release position:** Targeted hardening applied and verified. **Not** a universal security certification or proof that every role-based UI workflow works on real accounts.

## Production changes (migration history)
- `20261122133940` — Optimize six owner/admin/claim RLS policy expressions and add six covering foreign-key indexes in courses, certificates, enrollments, exams, and study plans.
- `20261122134039` — Optimize remaining four JWT identity lookup policies without changing who is allowed to read or update records.
- `20261122134111` — Drop six exact duplicate or redundant admin RLS policies; equivalent admin privileges remain in surviving policies.
- `20261122134213` — Revoke TRUNCATE, TRIGGER and REFERENCES on public tables from `anon` and `authenticated` while retaining CRUD permissions and RLS. This reduces exposure because RLS does not guard TRUNCATE.

The SQL for each migration is archived under `supabase/migrations/` with the exact production migration version. No rows, grades, uploads, certificates, enrollments or user roles were modified.

## Verified actual Postgres behavior
1. `public` schema: RLS enabled on **123 of 123** tables (audit baseline).
2. Anonymous read-only transaction: **5** active/public courses, **196** public Open Doors questions, **1** published research record were visible before and after hardening.
3. Authenticated read-only transaction with an intentionally nonexistent user ID: **0** profiles, **0** enrollments, **0** certificates visible; **5** public courses visible both before and after hardening.
4. Read-only authenticated role test using an existing admin identity, without printing identity or records: `is_admin() = true`, **100** profiles, **59** certificates, **13** enrollments, **5** courses visible. Existing admin access remained.
5. `anon` and `authenticated` possess **no direct** public-table TRUNCATE, TRIGGER or REFERENCES grants after the change.
6. Four file buckets for research, certificates, lectures and executive CVs are private (the storage configuration alone is not a full object-policy audit).
7. Research PDF, uploaded lecture PDFs, and certificate file references checked in the previous audit had no missing corresponding storage objects.

## Supabase database advisor changes
| Advisor | Before | After |
|---|---:|---:|
| `auth_rls_initplan` | 10 | **0** |
| `unindexed_foreign_keys` | 62 | **56** |
| `multiple_permissive_policies` | 62 | **32** |
| `unused_index` | 44 | **49** (newly created indexes have not yet accumulated use) |

Remaining multiple permissive policies are **not automatically defects**: some are intentional public read + private owner/admin access. Do not remove them without comparing every predicate and testing every role.

## Outstanding manual / security follow-ups
- Supabase Auth advisor reports leaked-password protection is disabled. Enable and verify it in **Supabase Dashboard → Authentication → Settings / Security & Protection**, depending on dashboard version. This setting is not exposed in the connected project tools.
- Audit the 4 anonymous and 44 signed-in callable `SECURITY DEFINER` functions individually. Some are deliberately public (certificate verification, application status check and applicant submission). Never blindly revoke them; use permission and rate-limit tests. The `is_admin()` helper is invoked from public RLS policies and returns false for visitors.
- The 16 tables with RLS and no policies may deliberately be private and RPC-only; verify per intended access model.
- Measure query workload before creating the remaining 56 FK indexes or deleting unused indexes. Newly created indexes can be reported unused until real queries run.
- No real student/lecturer/admin passwords or data changes were used in these tests. End-to-end production exam submissions, grade approvals, emails, offline behavior on devices and actual account roles still require dedicated test accounts.
- Review live GitHub Pages browser QA separately; successful HTTP and smoke tests do not prove every button is functional.

## Minimal regression checks (read-only transaction)
```sql
BEGIN READ ONLY;
SET LOCAL ROLE anon;
SELECT (SELECT count(*) FROM public.courses) AS public_courses,
       (SELECT count(*) FROM public.open_doors_questions) AS public_training;
ROLLBACK;
```
Use `set_config('request.jwt.claim.sub', '<test-uuid>',true)` with `SET LOCAL ROLE authenticated` only for authorized testing inside a read-only transaction. Do not store a real JWT, administrator email, or secret in repository files.
