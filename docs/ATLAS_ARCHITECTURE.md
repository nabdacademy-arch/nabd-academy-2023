# NABD ATLAS — Architecture Decision Record 001
Date: 2026-11-04
Status: Proposed, proof-of-concept implemented on feature branch only

## Product vision
Expand the existing NABD Academy (Arabic/English) into a cohesive learning platform: LEARN, MEDVERSE, OFFLINE, CONNECT, RESEARCH, SKILL PASSPORT, and CONTROL.

## Repository baseline observed
- Existing static HTML/CSS/JS front end, deployed separately from this change.
- Supabase JavaScript connection and flows for profiles, courses, enrollments and certificates.
- Student portal, admin dashboard, executive portal, skill passport and research sections.
- Executive portal SQL in \`portal/sql/001_executive_portal.sql\`.
- \`SETUP.md\` references \`supabase/schema.sql\`, but this file is not in the branch baseline. Do not infer that the live Supabase schema matches old documentation.

## Engineering boundaries
1. Preserve the production root pages, credentials, student enrollment, certificates and live schema.
2. Create new code in the isolated \`atlas/\` directory and preview through a feature branch.
3. Initially keep demos entirely in the browser, with no authentication or production writes.
4. No use of real patient records in teaching simulators.
5. All medical content must have a reviewer and revision date before release beyond the pilot.
6. Never store service_role keys or database passwords in the browser.
7. Implement Arabic RTL and English LTR consistently, accessible keyboard navigation, readable reduced-motion mode.
8. Keep the pilot lightweight, usable on low-end Android devices.

## Current deliverable
A free, static, self-contained web pilot in \`atlas/\`:
- Educational decision-tree simulation with reproducible feedback and a replay option.
- Virtual hospital hub with cardiac and neurological fictional training cases, in-progress browser-only drafts and a local attempt history. These are not medical assessments.
- Offline precache and user-initiated cache refresh.
- Browser-only recent-score storage and no remote data collection.
- Service Worker cache scope limited to \`atlas/\`.

## Later services and data model (not yet deployed)
- Learning: learning_units, learning_progress.
- MEDVERSE: clinical_scenarios, scenario_nodes, simulation_attempts, attempt_events.
- Skill Passport: skill_evidence, evidence_review.
- Collaborative learning: study_groups, group_messages.
- Offline sync: offline_sync_events, sync_conflicts, device_sessions.
- Quality: content_reviews, audit_events.

Before SQL migrations, inventory real production tables, column definitions, RLS policies, auth flows, storage buckets, and certificate verification functions. Prepare a backup and reversible migration plan.

## Offline architecture
- Phase A: same-device access through Service Worker, Cache Storage and local data persistence.
- Phase B: authenticated sync via backend API using idempotent operation IDs, bounded retries and conflict resolution, with no certificate issuance from unverified offline actions.
- Phase C: optional local classroom hub over an existing LAN, with identity, access control and safe data minimization.
- Phase D: Android app nearby transport where available, after security and interoperability testing.

**Offline PWA does not provide long-distance communications without a suitable network.**

## Acceptance checks for this pilot
- New files added only under \`atlas/\`, \`docs/\` and test workflow.
- Branch builds without JS syntax errors.
- Three simulated questions have three answers each and bounded scoring.
- RTL/LTR toggle updates text and direction.
- After downloading, the pilot loads with internet disabled and retains the local result.
- Existing production URLs remain untouched by this branch.
- Clinical review and browser QA remain required before a merge.
