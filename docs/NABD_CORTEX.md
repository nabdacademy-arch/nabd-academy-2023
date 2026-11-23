# NABD CORTEX — Pilot 01 (2026-11-23)

This is an **authenticated internal pilot**, not an autonomous medical, financial, or cyber operator. It extends the existing NABD AI Executive, leaving the homepage, student records, and established workflows unchanged.

## Architecture
- GitHub Pages: `nabd-cortex.html`, Arabic responsive console and founder start/stop buttons.
- Supabase PostgreSQL: 5 independent RLS-enabled tables (`nabd_cortex_settings`, `_sources`, `_runs`, `_tasks`, `_audit`).
- Edge Function: `nabd-cortex` routes tasks to operations, finance, medical, crisis, cybersecurity, and education agents. It authenticates Supabase Auth bearer JWT via `auth.getUser(jwt)`, then requires `nabd_agent_admin_info().authorized === true`.
- Founder-only RPCs: `nabd_cortex_set_enabled`, `nabd_cortex_review_task`; only a verified active founder in `portal_profiles` can invoke them. Task review is **approval for planning only**.
- Sources: official WHO, IFRS, NIST, UNDRR **metadata and links only**; no copyright-protected text is ingested or falsely cited.

## Live state and actual capabilities
- The Cortex switch defaults **OFF** until the founder explicitly enables it.
- The **two buttons** save the enabled state on the database, not on a browser variable.
- When OFF, no new task is accepted. Every request is authenticated and checked twice (before processing and before recording).
- When ON, an authenticated administrator can submit a task. The system routes the domain, classifies high/medium/low risk, creates an internal task, and logs routing metadata, without storing raw prompts.
- Low-risk tasks are only logged internally. High/medium-risk tasks need founder review. **No external side effects** (messages, payments, diagnoses, patient triage, permissions, student records, certificates, or deployments) are granted.
- Optional LLM-assisted planning uses server-only `OPENAI_API_KEY` and the configurable `NABD_CORTEX_MODEL` (default `gpt-4.1-mini`), only for low-risk administration, education and crisis requests, with no identifiers. When not configured or unavailable, it falls back to explicitly labeled deterministic policy steps.
- 8 requests/hour per admin user; request length 8–1500 characters; basic data-loss-prevention pattern screening; no full DLP guarantee.
- No unattended scheduler, real clinical decision support, full-text RAG or systemwide emergency stop is provided by this pilot. The switch controls **Cortex only**, not the older NABD Operator or the website.
- Source metadata is not automatically re-verified; an editorial/source-licensing workflow must be added before treating it as authoritative clinical or accounting evidence.

## Security controls
- Browser uses only the publishable key in existing `assets/js/config.js`. Never expose service-role or third-party model API keys.
- Database RLS allows admin/founder reads only; browser writes are blocked. The Edge Function uses service role **only after authenticating and authorizing** an administrator. It does not provide a general-purpose SQL/shell tool.
- `verify_jwt = false` is required to support modern JWT signing; the function itself checks each JWT using Supabase Auth, returns 401/403 for invalid users, and handles CORS preflights.
- Founder controls and task reviews are audited in `nabd_cortex_audit`; LLM output is never authorized as an executable command.
- Incoming task text should contain no personal health, financial, identity, or login data. Screening is imperfect: users should not paste sensitive information.

## Deploy / verify
1. Apply `supabase/migrations/20261123183000_nabd_cortex_foundation.sql` (already applied to `nabd-academy-v2` for the current development pilot).
2. Deploy `supabase/functions/nabd-cortex/index.ts` using `supabase/config.toml`.
3. Run `node --test tests/nabd-cortex-contract.test.mjs`.
4. Confirm an unauthorized browser cannot access the dashboard or query the five tables.
5. Confirm founder switch OFF returns 409 for the function and that logging tables remain unchanged. No test should generate a fake student session.
6. Test founder ON, an innocuous administrative task, and task review using a legitimate authorized session. Then turn OFF.
7. Review logs and database advisor warnings before enabling production traffic. Do not add API keys without approved privacy terms.

## Planned next increments
Evidence registry review and freshness, licensed retrieval + RAG, independent specialist evaluations, escalation workflows, stricter PII redaction, model cost controls, resiliency metrics, and a supervised scheduler with recurring source checks.
