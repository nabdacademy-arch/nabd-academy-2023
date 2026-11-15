# NABD World Impact — Pilot V1 (2026-11-15)

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

- Site is hosted as static HTML, CSS, JS under the dedicated `impact-lab/` path; no user-supplied input is sent to a NABD server by these pilots.
- Browser `sessionStorage` or backend is **not used** to collect entries in the six tools; reports are available for download while the tab is open. User should retain their own exports.
- The optional service worker caches only public portal assets beneath `/impact-lab/` for limited revisit without internet; it does not persist user reports or keys. Browsers may evict the cache.
- No patient data, personally identifying event information, confidential institutional records or real case records should be entered without a formal governance review.
- File encryption is not a managed backup, and the passphrase cannot be recovered by the academy.
- Mobile layouts, semantic form controls, keyboard-readable tab navigation, visible focus and reduced-motion support are implemented; this does **not** assert a completed WCAG 2.2 AA audit.
- The AI criteria are **inspired by** risk management practices, not endorsed by any standards body. Use NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework and W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- No advertising, service keys, authentication tokens, external web fonts, analytics, tracking scripts or hosted user uploads.

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
