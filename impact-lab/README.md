# NABD World Impact — Pilot V2 (2026-11-15)

## V2 · November 15, 2026 — Six progressive upgrades

1. **AI Crash Test:** Repeatable six-scenario defensive testing bank (fabricated citations, uncertainty, prompt injection, personal-data privacy, overconfidence, unsafe decisions). Adds purely local text-pattern flags for potentially identifying information, injection strings, absolute certainty and absence of direct source URLs. Such matches are NOT medical accuracy verdicts.
2. **Truth Strike:** Optional public Crossref DOI metadata lookup; ONLY the explicitly entered DOI is sent to the Crossref API after the user's click. Bibliographic indexing neither validates a paper nor verifies a medical claim. All original claim summaries, notes and drafts stay local.
3. **Rescue Vault:** Additional version-aware, structural inspection of a previously encrypted vault file. The actual AES-256-GCM / PBKDF2 authenticated encrypt/decrypt functionality remains local and protected by a user passphrase. Inspection is not proof of authenticity, and V2 is NOT a distributed backup/recovery system.
4. **Black Box:** A 5×5 educational risk-priority calculation (human-selected likelihood and potential impact, optional safeguard discount) with JSON download. This is NOT validated clinical risk stratification or official accident investigation.
5. **Global Hours:** A locally generated editable ICS calendar for visible illustrative volunteer tasks, using next Monday at 10:00 in the browser's local timezone. These are NOT actual confirmed opportunities or booked sessions.
6. **Language Lifeline:** Portable TXT export of currently visible non-clinical phrase cards, a print layout and enlarged text, alongside existing device speech, offline cache and five languages.

### V2 foundations and testing

- Additive enhancement: tech-v2-core.js, tech-v2.js and tech-v2.css load after existing V1 tools so that their core workflows remain intact.
- Scoped, versioned PWA manifest and service-worker cache for public resources only; it NEVER caches entered text, encrypted user files or secrets. Offline install availability is browser dependent.
- Unit tests cover DOI validation, safe URL parsing, local security/AI-flag heuristics, priority scoring, calendar injection resistance, archive metadata validation, and UI integration. Headless Chromium checks the six enhanced flows with a mocked Crossref response.
- These are software design practices inspired by publicly available guidance, not official certifications:
  - NIST AI Risk Management Framework / Generative AI Profile: https://www.nist.gov/itl/ai-risk-management-framework
  - OWASP LLM Application Top 10 2026: https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/
  - W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- NOT built or claimed: completely automated and independently validated medical fact-checking; geographically distributed institutional backup; actual online volunteer registration; certified interpretation for medical consent; acceptance of real identifying patient records; proof of best-in-the-world technology.

### V2 privacy update

All original workflows still operate locally. The only intentional new external request is the OPTIONAL DOI metadata lookup, which the user initiates. It sends the DOI to api.crossref.org. The external provider can see normal request network metadata (e.g. IP), but the browser does not send claim text, private notes, encrypted files or clinical details in this lookup. Anyone who prefers fully local operation can skip the DOI lookup.


Single-entry link: **https://nabdacademy-arch.github.io/nabd-academy-2023/impact-lab/**

This microsite provides **six working, local-first pilot workflows** in Arabic and English. All tools are contained in one fast, mobile-responsive experience that does not depend on login or third-party AI billing. It is not an organizational network or certified clinical service.

| Module | Operational V1 feature | Explicitly not claimed |
|---|---|---|
| **AI Crash Test** | Structured human-scored 5-dimension risk review; draft report in Markdown; simple wording/URL flags | Automated verification of correctness, independent clinical AI certification |
| **Truth Strike** | Evidence citation worksheet with validated HTTPS source URLs, reviewer verdict and downloadable unpublished draft | Automatic fact-check, source retrieval, public published corrections |
| **Rescue Vault** | Actual client-side AES-256-GCM encryption / decryption; PBKDF2-HMAC-SHA256 with 310k iterations, random salt and nonce; download of versioned `.nabdvault` file | Remote backup, multi-device synchronization, guaranteed recovery, institution-ready data processing |
| **Black Box** | Anonymous/fictional incident learning report with factors, prevention and local Markdown export | Official incident recording, legal investigation, root-cause verification |
| **Global Hours** | Real skill-to-hours filtering and downloadable draft volunteer proposals for six **explicitly illustrative** missions | Registered volunteers, actual jobs, matching real organizations, sending applications |
| **Language Lifeline** | 14 non-clinical humanitarian phrases in AR/EN/FR/ES/TR with category filters, clipboard copy, large display and device TTS | Accredited linguistic review or use in clinical consent/treatment |

## Design & security

- Site is hosted as static HTML, CSS, JS under the dedicated `impact-lab/` path; no user-supplied input is sent to a NABD server by these pilots. The optional V2 Crossref lookup sends only the DOI after explicit opt-in.
- Browser `sessionStorage` or backend is **not used** to collect entries in the six tools; reports are available for download while the tab is open. User should retain their own exports.
- The optional service worker caches only public portal assets beneath `/impact-lab/` for limited revisit without internet; it does not persist user reports or keys. Browsers may evict the cache.
- No patient data, personally identifying event information, confidential institutional records or real case records should be entered without a formal governance review.
- File encryption is not a managed backup, and the passphrase cannot be recovered by the academy.
- Mobile layouts, semantic form controls, keyboard-readable tab navigation, visible focus and reduced-motion support are implemented; this does **not** assert a completed WCAG 2.2 AA audit.
- The AI criteria are **inspired by** risk management practices, not endorsed by any standards body. Use NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework and W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- No advertising, service keys, authentication tokens, external web fonts, analytics, tracking scripts or hosted user uploads. Public Crossref DOI lookup is optional.

## If production adoption is wanted

1. Complete expert review of the bilingual phrasebook and research/clinical content.
2. Add institution-level privacy policy, review workflow, data protection impact assessment and incident response process before ever accepting real patient-related data.
3. Provide secure backend schemas for volunteer positions and verified organizations, consent and anti-spam moderation, plus notifications; no public account creation is enabled in pilot V1.
4. Build independent source-verification and peer-review pipeline, including clear uncertainty levels and citations; avoid automatic medical misinformation verdicts.
5. Replace single-device file encryption with institution-approved distributed encrypted backup (versioning, safe key custody and recovery testing), after security review.
6. Run functional browser accessibility and mobile audit, penetration tests and cryptographic audits, followed by a supervised beta release.

## Verification

`node --check impact-lab/app.js`

`node --check impact-lab/sw.js`

`node tests/impact-lab.test.cjs`

Tests include a real encryption/decryption roundtrip, wrong password rejection, tampering rejection, size and password controls, six tabs, mobile CSS, and a home entry. No external API is called by the tests.
