# Open Doors Offline Android — implementation plan

Branch: feature/open-doors-offline-android

## Source and constraints
- Original UI: `open-doors-ai.html` (keep visual appearance and subject selection).
- Current browser app uses authenticated backend services; do NOT ship admin credentials or backend service-role keys in APK.
- Offline release must bundle question data legally available for local use, Arabic translations, explanations, and reference metadata. No online API requests in core exam flows.
- Never label simulated items as leaked/official Open Doors exams.

## Implementation
1. Extract HTML/CSS/JS into a local web application bundle, preserving layout and controls.
2. Replace remote login with an optional device-local profile or PIN; no cloud authentication required.
3. Export authorized training question bank from backend into versioned JSON and package with app; validate counts, subjects, answer keys and explanations. **This export is not yet available in this branch.**
4. Replace online translation with packaged English/Arabic strings; mark unavailable translations instead of contacting an API.
5. Implement local storage (IndexedDB or SQLite) for attempts, bookmarks, study progress, and randomization history.
6. Implement deterministic local scoring for single/multi-choice; written and oral responses are not automatically AI-graded offline without a bundled on-device model. Clearly mark rubric/self-assessment as provisional.
7. Preserve timed practice and realistic simulation, including random variants; persist timer/deadline through app backgrounding.
8. Integrate Capacitor Android with bundled web assets; set no server.url; validate all runtime assets local.
9. Build APK via Gradle/Android SDK or GitHub Actions; test airplane mode on a physical Android phone, including first launch, exam completion, reboot, audio, Arabic display, and saved results.

## Acceptance criteria
- Installs without requiring Play Store.
- Starts in airplane mode immediately after installation, no prior online first run.
- All packaged exams, explanations, and translations available offline.
- Local results survive restart.
- No embedded cloud secrets.
- Original website remains unchanged on main branch.

## Status
Repository inspected; dedicated implementation branch created. APK **not yet built**. Next: obtain authorized offline question-bank export and refactor the existing backend-dependent logic.
