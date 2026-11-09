# MOHAMMED AI TWIN — Android companion

**Free Android beta APK:** https://github.com/nabdacademy-arch/nabd-academy-2023/releases/download/moh-twin-android-beta/Mohammed-AI-Twin-Android-beta.apk

**Website (free GitHub Pages):** https://nabdacademy-arch.github.io/nabd-academy-2023/mohammed-ai-twin/

The Android app is built from source in `mohammed-ai-twin-android/`, with GitHub Actions workflow `.github/workflows/mohammed-ai-twin-android.yml`.

## Install
1. Download the APK from the repository's official **beta release**.
2. Open the download on Android. The system may ask whether you trust installation from your browser; review that source carefully and allow it only if you choose.
3. Launch MOHAMMED AI TWIN; the private twin website appears inside the application, and you can sign in with your existing owner account.
4. The phone action bar is at the top. It does not operate on websites or apps unless you tap a control or enter a command.

## Current Android actions
- One-shot Arabic voice recognition: explicit **🎙️ صوت** button; the phone's own speech-recognition UI handles the microphone. Audio processing depends on the device's voice provider and may occur on their servers.
- Show and open *launchable apps* that Android exposes through a standard launcher query.
- Pick one phone contact through the system contact picker, without granting blanket READ_CONTACTS.
- Open the system dialer with a user-selected number (never initiate the call automatically).
- Open SMS composer with selected number (never send automatically).
- Open general, Wi-Fi and Bluetooth system settings, open camera app.
- Type commands such as `افتح واتساب`, `افتح الذاكرة`, `اتصل 059...`, `افتح البلوتوث`, `افتح نبض`.
- Schedule device-local, inexact Android reminder notifications; reminders can fire when app is closed, and future reminders are rescheduled after reboot. Android may defer alarms and may restrict notifications.
- Access the separately hosted private AI Twin, including its authorized practice challenges and memory.

## Not implemented
- No covert 24/7 microphone, no invisible overlays, no third-party app interception, no hidden screen automation, no bypassing monitoring or proctored exams.
- No ability to access all installed accounts, SMS, email, app data, or contacts without native authorization.
- No autonomous outgoing calls or messages, no speech listening when system voice UI is not explicitly invoked.
- No Google Play account or store publishing required; this is a sideloadable beta build.
- No claims of full device-level integration or testing on the owner's phone.

## Security
- Source repository is public. Private AI memory and chat data are server-side with owner RLS policies and auth.
- The APK asks only for Internet, optional post-notification permission, and boot reminder restoration. No QUERY_ALL_PACKAGES, READ_CONTACTS, READ_SMS, CALL_PHONE, RECORD_AUDIO, BIND_ACCESSIBILITY_SERVICE or overlay permission.
- WebView is restricted to HTTPS for external links, JavaScript bridges are not used, web microphone requests are denied, and WebView debugging is off.
- GitHub Actions builds a **debug-signed beta APK**, with a fresh CI debug key on each run. Updating to a later APK may require uninstall/reinstall unless a persistent production signing setup is configured.
- Do not store secrets in the public source code, and install only files obtained from trusted sources.

## Build
The GitHub workflow installs Java 17, Android SDK API 36, Gradle 9.6 and Android Gradle Plugin 9.5.0, then runs `gradle --no-daemon :app:assembleDebug`. It publishes the APK as a GitHub Actions artifact and a beta release asset.

## Free services
GitHub Pages hosts the website free under public repo terms; GitHub Actions uses standard public-repository runners, subject to rate limits. The existing Supabase / Groq / Gemini integrations are subject to their own free-tier availability and quotas.
