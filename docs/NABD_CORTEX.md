# NABD CORTEX — Pilot 01 (2026-11-23)

This is an **authenticated internal pilot**, not an autonomous medical, financial, or cyber operator. It extends the existing NABD AI Executive, leaving the homepage, student records, and established workflows unchanged.

## Architecture
- GitHub Pages: `nabd-cortex.html`, Arabic responsive console and verified admin/active-founder start/stop buttons.
- Supabase PostgreSQL: 5 independent RLS-enabled tables (`nabd_cortex_settings`, `_sources`, `_runs`, `_tasks`, `_audit`).
- Edge Function: `nabd-cortex` routes tasks to operations, finance, medical, crisis, cybersecurity, and education agents. It authenticates Supabase Auth bearer JWT via `auth.getUser(jwt)`, then requires `nabd_agent_admin_info().authorized === true`.
- Admin/active-founder RPCs: `nabd_cortex_set_enabled`, `nabd_cortex_review_task`; signed-in admins are checked against `public.profiles.role='admin'`, and founders must have an active `portal_profiles` record. Anonymous and ordinary authenticated users have no control permissions. Task review is **approval for planning only**.
- Sources: official WHO, IFRS, NIST, UNDRR **metadata and links only**; no copyright-protected text is ingested or falsely cited.

## Live state and actual capabilities
- The Cortex switch defaults **OFF** until an authorized admin or active founder explicitly enables it.
- The **two buttons** save the enabled state on the database, not on a browser variable.
- When OFF, no new task is accepted. Every request is authenticated and checked twice (before processing and before recording).
- When ON, an authenticated administrator can submit a task. The system routes the domain, classifies high/medium/low risk, creates an internal task, and logs routing metadata, without storing raw prompts.
- Low-risk tasks are only logged internally. High/medium-risk tasks need an authorized admin/founder review. **No external side effects** (messages, payments, diagnoses, patient triage, permissions, student records, certificates, or deployments) are granted.
- Optional LLM-assisted planning uses server-only `OPENAI_API_KEY` and the configurable `NABD_CORTEX_MODEL` (default `gpt-4.1-mini`), only for low-risk administration, education and crisis requests, with no identifiers. When not configured or unavailable, it falls back to explicitly labeled deterministic policy steps.
- 8 requests/hour per admin user; request length 8–1500 characters; basic data-loss-prevention pattern screening; no full DLP guarantee.
- No unattended scheduler, real clinical decision support, full-text RAG or systemwide emergency stop is provided by this pilot. The switch controls **Cortex only**, not the older NABD Operator or the website.
- Source metadata is not automatically re-verified; an editorial/source-licensing workflow must be added before treating it as authoritative clinical or accounting evidence.

## Security controls
- Browser uses only the publishable key in existing `assets/js/config.js`. Never expose service-role or third-party model API keys.
- Database RLS allows admin/founder reads only; browser writes are blocked. The Edge Function uses service role **only after authenticating and authorizing** an administrator. It does not provide a general-purpose SQL/shell tool.
- `verify_jwt = false` is required to support modern JWT signing; the function itself checks each JWT using Supabase Auth, returns 401/403 for invalid users, and handles CORS preflights.
- Admin/founder controls and task reviews are audited in `nabd_cortex_audit`; LLM output is never authorized as an executable command.
- Incoming task text should contain no personal health, financial, identity, or login data. Screening is imperfect: users should not paste sensitive information.

## Deploy / verify
1. Apply `supabase/migrations/20261123183000_nabd_cortex_foundation.sql` (already applied to `nabd-academy-v2` for the current development pilot).
2. Deploy `supabase/functions/nabd-cortex/index.ts` using `supabase/config.toml`.
3. Run `node --test tests/nabd-cortex-contract.test.mjs`.
4. Confirm an unauthorized browser cannot access the dashboard or query the five tables.
5. Confirm admin/founder switch OFF returns 409 for the function and that logging tables remain unchanged. No test should generate a fake student session.
6. Test admin ON, an innocuous administrative task, and task review using a legitimate authorized session. Then turn OFF.
7. Review logs and database advisor warnings before enabling production traffic. Do not add API keys without approved privacy terms.

## Planned next increments
Evidence registry review and freshness, licensed retrieval + RAG, independent specialist evaluations, escalation workflows, stricter PII redaction, model cost controls, resiliency metrics, and a supervised scheduler with recurring source checks.

## 2026-11-23 control fix and timer
- Reason for the initial `Founder authorization required` failure: `nabd_agent_admin_info()` admitted profile admins, while the Cortex control RPCs required a separate active portal-founder record. The system had an authorized administrator but **zero** active founder records. The fix uses the same trusted admin-or-active-founder rule for toggle and review RPCs; **students and anonymous visitors remain blocked**.
- Migration: `supabase/migrations/20261123192000_nabd_cortex_admin_control_timer.sql` adds `active_since`, `last_stopped_at`, and `elapsed_seconds` to `nabd_cortex_settings`, accumulating completed ON intervals transactionally using a locked row. Repeated ON or OFF requests do not reset the clock.
- UI timer: live current uptime and accumulated uptime update every second and survive page reloads because the database persists the underlying timestamps. The last task duration is measured in the open browser session with `performance.now()`; it is not an unattended task runner.
- This does **not** switch on the engine on the user's behalf; the switch stays OFF until a verified admin requests ON. The on/off switch applies only to Cortex, not the rest of NABD Academy.
