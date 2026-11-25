# NABD ZERO — Founding research and funding brief
**NABD Academy for Medical Sciences | Palestine | 25 November 2026 | v0.1 | Draft for independent review**

## Executive summary
NABD ZERO proposes a low-connectivity medical education toolkit and the NABD Medical Education Resilience Index (NMERI). The goal is to measure, rather than assume, whether learning, assessment and recovery remain possible during disruption. Neither the index nor the intervention has been validated, and novelty, awards, partnerships and funding are not claimed.

## Research questions
1. Can learners complete essential educational activities with intermittent connectivity and limited power?
2. How do completion, retention and recovery compare across the predeclared delivery conditions?
3. Is NMERI interpretable, reproducible and responsive to real disruptions?

## NMERI v0.1
Each domain is a percentage of observed successes among predeclared eligible opportunities. The weighted total is the sum of each fraction multiplied by its weight (range 0–100). No overall result is produced if any denominator is zero or any required evidence reference is absent.
| Domain | Weight | Numerator / denominator | Evidence |
|---|---:|---|---|
| Learning continuity | 25 | Completed planned activities / activities scheduled for eligible learners in window | Aggregated activity logs |
| Offline operation | 20 | Passed offline essential-function tests / predetermined tests | Reproducible device test matrix |
| Knowledge retention | 20 | Correct answers / assigned scored items in seven-day follow-up among respondents | Aggregate test scores; report nonresponse separately |
| Assessment continuity | 15 | Completed and saved planned assessments / eligible planned attempts | Assessment recovery logs |
| Accessibility | 10 | Eligible participants completing reference task on available devices / eligible participants | Aggregate usability test |
| Recovery | 10 | Successful state-restoration trials within predefined limit / planned trials | Recovery test logs |
The index is formative and exploratory, not an accreditation standard. A self-reported evidence code is not independent verification. Avoid cross-institution rankings until measurement comparability is established. Report component denominators, confidence intervals where appropriate, missingness, measurement windows and equal-weight sensitivity analysis. Freeze the protocol before data collection. Independent expert review should assess content validity, feasibility, accessibility and potential gaming; revise under version control.

## Pilot design
- Proposed 100 adult volunteer learners, 30 days, 10 clinician-reviewed learning modules. These are planning targets, not enrollment figures or statistically justified sample size.
- Phase A: technical usability pilot with synthetic records; device, low-storage, airplane-mode, interruption and recovery tests.
- Phase B: if approved, feasibility study with baseline, immediate post-test and seven-day follow-up; use comparable assessment forms and track completion, data transferred, device compatibility and recovery.
- A comparison group using normal access may be considered with independent review; never remove existing services or deliberately create hardship. Observational differences are not proof of causal efficacy.
- Primary outcome: proportion of assigned learning activities completed in the predefined window. Secondary outcomes: retention, assessment completion, access, technical recovery, data use, withdrawal and missingness.
- Report attrition by group; do not treat missing follow-up responses as correct. Use descriptive estimates with uncertainty; prespecify any inferential methods and consult a statistician about sample size.
- Publish aggregated findings, limitations, versioned code and reproducible synthetic examples. Do not publish individual learner records.

## Ethical and data safeguards
Obtain appropriate independent ethics approval before participant recruitment or identifiable research collection. Consent must be voluntary, understandable, and separable from educational benefits; withdrawal must not affect course access. Collect only minimum necessary data, use pseudonymous study IDs kept separate from contact details, restrict access, encrypt protected records, predefine retention and deletion, and assess reidentification risk. No patient records, medical diagnoses, real clinical cases containing identifiers, or unnecessary precise locations. The toolkit is education-only, not clinical decision support. The public calculator accepts aggregate counts only and makes no backend requests. Do not enter private evidence links or personal details.

## Work packages and milestones
| Package | Output | Acceptance gate |
|---|---|---|
| WP1 Design | Registered protocol, reference definitions, review panel | Independent methodological and ethical review |
| WP2 Build | 10 reviewed offline modules, accessible bilingual UI, recovery tests | Documented device and offline test matrix |
| WP3 Pilot | Approved feasibility study | Consent, recruitment and data governance gates |
| WP4 Validate | Results report, sensitivity analysis, external review | Reproducible results and limitations |
| WP5 Disseminate | Manuscript, reusable package, partner brief | Transparent claims and evidence |
## Illustrative funding request (USD)
| Item | Planning estimate |
|---|---:|
| Learning devices / power / connectivity support | 5000 |
| Offline toolkit development and security testing | 3000 |
| Clinical educational content and accessibility review | 2000 |
| Research methods, ethics and independent evaluation | 2000 |
| Coordination, documentation and dissemination | 1500 |
| Contingency | 1500 |
| Total | 15000 |
Planning estimates only, not vendor quotes or committed expenditure; verify local costs, legal eligibility, procurement, safeguarding and funder overhead rules. No learner fees proposed. External grants must follow the academy's actual legal and fiscal capacity, or a verified fiscal partner.

## Partner ask
We invite universities, humanitarian innovation programs and educational technology partners to independently review the methods, contribute technical and clinical expertise, and consider funding a safe pilot. We are not seeking endorsement of an unvalidated index. Potential beneficiaries include learners in disrupted and low-connectivity settings worldwide.

## Arabic summary
مشروع نبض زيرو يهدف إلى تطوير منظومة تعليم طبي قابلة للعمل دون اتصال وقياس استمرارية المعرفة بمؤشر بحثي من ستة أبعاد. الأهداف المقترحة: 100 متطوع بالغ، 30 يومًا، 10 وحدات، وميزانية تخطيطية 15 ألف دولار. لا توجد نتائج ميدانية أو اعتماد أو تمويل مؤكد. يبدأ العمل باختبارات اصطناعية ومراجعة مستقلة وموافقة أخلاقية قبل إشراك الطلاب. تُنشر النتائج المجمعة بشفافية، ولا تُجمع بيانات مرضى أو هويات في الحاسبة العامة. لا يجوز وصف المؤشر بأنه الأول عالميًا قبل مراجعة الأدبيات والتحقق من الجدة.

## Software release v10 — 25 November 2026
The application release number is v10; the scientific index remains NMERI method v0.1. This version does not establish validity or novelty.
| Milestone | Implemented in application |
|---|---|
| v1 | Standalone bilingual navigation and dashboard |
| v2 | Ten introductory bilingual draft learning units |
| v3 | One formative self-check per unit, local progress |
| v4 | Single-file offline distribution without external runtime dependencies |
| v5 | Progress JSON backup and recovery, validated import |
| v6 | Six-domain NMERI calculator, strict complete-case validation |
| v7 | Equal-weight sensitivity score and domain breakdown |
| v8 | Synthetic versus observed record separation; aggregate JSON import/export |
| v9 | Browser self-test lab and downloadable diagnostic report |
| v10 | Research gates, funding overview, integrated dashboard and print support |
These are release milestones bundled in one application update, not ten separately deployed historical releases.
### Verification
18 automated JavaScript assertions passed on the same pure functions embedded in the released page: scoring boundaries, weights, missing/invalid data, order and evidence code, record mode, progress schema and scoring, unit count and weight total. Browser lab additionally checks local storage and a synthetic serialization round trip when run by the user. It has not been independently executed on physical devices. No formal accessibility audit, security penetration test, or clinical content review has been completed.
### Data and deployment limits
The learning module progress uses local browser storage if available, with manual JSON backup. No accounts, research participant database, cross-device sync or remote collection are implemented. Local storage on shared devices is not private; clear or back up progress when appropriate. The educational self-checks are unvalidated practice, not outcome instruments. The downloadable single HTML file has no required online runtime dependencies; actual offline and browser compatibility testing remains necessary. The existing research protocol link requires connectivity.
### Required before human research
Independent literature review and novelty assessment, medical content and instrument review, statistical review, ethics approval and informed consent, device testing, data governance and approved study operations remain outstanding. Do not use self-check scores or synthetic NMERI outputs as research findings or accreditation.
