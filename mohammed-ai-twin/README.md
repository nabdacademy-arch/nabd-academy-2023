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

## Foreground voice mode (V3)
- User may start a visible continuous recognition session from the chat page. A green microphone-status indicator and a clear stop control are displayed.
- Recognized spoken commands can navigate only **within this app**: memory, tasks, chat, profile, challenge, privacy and home. The stop phrase also ends listening.
- Other phrases are transcribed to the message composer and **not sent** to the AI or stored until the user explicitly presses Send.
- SpeechRecognition availability varies by mobile browser; the browser's recognition provider may process audio outside the app, and permission must be granted in browser controls.
- Microphone recognition stops immediately when the document is hidden, the app is backgrounded, the user signs out or the page is left. This web feature is **not 24/7 Android background listening**.
- A separately built, opt-in native Android assistant with visible permissions, Android role selection, and microphone indicators would be required for permitted device integrations. No hidden recording, anti-detection, unattended access to accounts, or proctored exam automation is built.

## V2 goal-planning agent — transparent workflows
- Open **الوكيل الذكي** and describe a concrete goal: e.g., plan a personal study week with optional reminders.
- The authenticated Supabase Edge Function `moh-twin-agent` now accepts `action: "plan"` and uses the owner's approved persona and memory, if the owner has opted into AI processing.
- The model returns a strictly validated JSON plan (up to 6 advisory steps of type reminder, draft, research or manual). No tool or device action is executed from model output.
- For a recommended reminder with a clear interval (15 minutes to 7 days), the app shows an explicit, individual confirmation. Only after approval does it create a row in the owner's RLS-protected personal tasks table; a server Cron may later generate an in-app reminder event.
- Plans are suggestions, not proof of actual research. The app does not auto-submit forms, log into third-party applications, bypass monitoring, or act inside graded/proctored exams.
- **Model availability requires server-side provider configuration** (Groq/Gemini), and provider quotas may limit usage. AI failures must be shown honestly rather than claimed as completed work.
