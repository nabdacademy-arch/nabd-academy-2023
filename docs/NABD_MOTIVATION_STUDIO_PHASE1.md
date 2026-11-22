# NABD Motivation Studio — Phase 1 / استوديو رسائل الدافع
**Entry page:** `motivation-studio.html`  
**Public route:** `https://nabdacademy-arch.github.io/nabd-academy-2023/motivation-studio.html`  
**Linked from:** `scholarships.html` (no homepage modifications).

## Experience
A standalone, responsive, bilingual Arabic/English interface with three stages:
1. **Opportunity:** scholarships, university admissions, employment, internships, research, volunteering, exchanges, fellowships, custom; 40+ searchable specialty suggestions, custom specialty allowed; destination, opportunity, host institution.
2. **Story:** name optional, personal background, real achievements with evidence, voluntary hardships/challenges, intended future impact.
3. **Fit and writing:** why this particular opportunity, why the applicant fits, official requirements pasted as context, Arabic/English/French letter language, authentic/confident/formal tone, short/standard/detailed length, excluded topics and explicit AI consent.

Users receive an editable letter, contextual writing notes, suggestions for missing factual detail, word count, clipboard and .txt export. A fresh variation requests a new generation; it cannot fabricate new credentials or facts. A client-side information completeness indicator evaluates **provided fields**, not probability of acceptance.

## AI generation and security
- Supabase Edge Function: `nabd-motivation-studio`, deployed with `verify_jwt=false` **only because it verifies Cloudflare Turnstile server-side and uses a private rate gate**.
- Strict expected browser origin `https://nabdacademy-arch.github.io`. Server verifies Cloudflare Turnstile `success`, `hostname` and action `motivation_generate`. One token is consumed per generation, including alternative drafts.
- HMAC(IP) anti-abuse digest (non-reversible from the public client) with six requests per rolling hour and 24 per rolling day per digest. The digest and timestamps are the only values stored, in `nabd_portal_private.nabd_motivation_rate_events`. The SQL function `nabd_motivation_try_rate` is callable **only from service_role**. Old records are deleted after 48 hours when rate-gate requests run.
- External AI providers: Groq (preferred) and Gemini (fallback). Credentials remain in Supabase secrets. When provider/secrets/rate gate/captcha fails, the endpoint reports a clear error **and does not fake a generated result**.
- Applicant prose and generated letters are **not persisted** in NABD's database or web storage by the app. Data is transmitted to the external AI provider when explicit consent is checked. Users should avoid sensitive data. Browser/AI provider/system logs and providers' retention policies are outside NABD's in-app data storage claim.
- Prompt requires concrete, personal, non-template letters with truthful evidence and no fabricated facts, invented awards, grades, dates, institutional details, or ungrounded guarantees. All provider output must be reviewed and edited by the applicant before submission.
- Does **not** promise AI-detection avoidance or guaranteed admission.

## Required runtime secrets
- `TURNSTILE_SECRET_KEY` — existing project key for Cloudflare Turnstile hostname.
- `NABD_RATE_LIMIT_HMAC_KEY` — 64 hexadecimal characters, never exposed in the browser.
- `GROQ_API_KEY` and/or `GEMINI_API_KEY` — external model provider.
- Supabase `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEYS.default`) for server-only rate-gate call.

## Verification
- `node --test tests/motivation-studio-phase1.test.cjs`
- `node tests/motivation-studio-browser.cjs` after installing pinned Playwright and Chromium.
- Automated GitHub workflow `NABD Motivation Studio - phase 1` checks security contracts, HTML form navigation on desktop and mobile, and a read-only live AI endpoint health/origin guard test.
- A live **AI generation request** needs a valid Turnstile token from a real user browser, appropriate model quota, and valid consent. The CI does **not** submit personal details or spend model credits to verify generation. A successful health check is not proof of letter quality.

## Planned later stages (not yet implemented)
Dedicated CV and applicant-profile import with explicit permission, comparative evaluation across multiple opportunities, export to PDF/DOCX, reviewer collaboration, and audited optional personal-draft storage. These require additional privacy and permission design before shipping.
