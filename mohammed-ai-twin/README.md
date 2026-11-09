# MOHAMMED AI TWIN — Private MVP

Owner-only digital twin app with opt-in personality and memory, private AI chat, voice-on-demand, server reminders, and a **Human vs AI** self-study competition.

## Access
- Hosted as a standalone sub-app at /mohammed-ai-twin/ on existing GitHub Pages.
- Reuses existing NABD owner sign-in only; no student access or public sign-up.
- Personal tables use the moh_twin_ prefix and owner-only row-level security.
- Edge Function: moh-twin-agent, requiring a valid session, owner verification, and opt-in. Groq/Gemini secrets stay server-side.
- Server scheduler: cron job moh-twin-due-tasks runs every five minutes and calls twin_internal.tick_moh_twin_tasks().
- Cached static shell only. Login, memory, and AI need connectivity.

## How to use
1. Open the app and sign in with the owner's NABD account.
2. In Identity & Style, add your preferred persona, and opt in explicitly to AI use if desired.
3. Add memories manually, review or remove them at any time.
4. Chat by text, optional microphone input or read responses aloud with explicit button presses.
5. Schedule a task. A database job creates an in-app reminder at its due time even if browser is closed; mobile push notifications are not configured.
6. In Human vs AI, create a practice quiz with answer keys, answer personally first, then run independent AI answers on the same questions. The model never receives the answer key, but grading uses the key you supplied.
7. Export or delete private data in the Privacy screen.

## Limits and security
- No covert graded or proctored exam use; no bypassing monitoring, camera impersonation or interaction with third-party exam systems.
- The digital twin never claims to be the real human or a conscious clone.
- No automatic extraction from private accounts or always-on camera/microphone.
- AI quota: up to 30 calls / rolling 24 hours; provider availability and free tiers may vary.
- Server schedules produce in-app inbox events; autonomous reasoning / outbound email / push notifications are not in V1.
- The frontend source is public while personal records remain protected by Supabase RLS. Personal tables share the existing NABD Supabase project but are separate from academic tables.
- End-to-end authenticated functions should be tested manually by the real owner after signing in.

## Verify
Run: node --check --input-type=module < mohammed-ai-twin/app.js
GitHub Actions workflow: mohammed-ai-twin.yml.
