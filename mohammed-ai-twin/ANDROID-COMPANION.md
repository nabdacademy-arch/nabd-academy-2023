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
- No autonomous outgoing calls or messages. Continuous speech recognition is available **only after the user starts the foreground microphone service**, with an ongoing Android notification and stop control. Android may interrupt it.
- No Google Play account or store publishing required; this is a sideloadable beta build.
- No claims of full device-level integration or testing on the owner's phone.

## Security
- Source repository is public. Private AI memory and chat data are server-side with owner RLS policies and auth.
- The APK declares Internet, boot reminder restoration, foreground microphone service and recording permissions. Android asks for microphone access before user-started continuous listening and may ask for notification access. It does **not** request QUERY_ALL_PACKAGES, READ_CONTACTS, READ_SMS, CALL_PHONE, BIND_ACCESSIBILITY_SERVICE or overlay permission.
- WebView is restricted to HTTPS for external links, JavaScript bridges are not used, web microphone requests are denied, and WebView debugging is off.
- GitHub Actions builds a **debug-signed beta APK**, with a fresh CI debug key on each run. Updating to a later APK may require uninstall/reinstall unless a persistent production signing setup is configured.
- Do not store secrets in the public source code, and install only files obtained from trusted sources.

## Build
The GitHub workflow installs Java 17, Android SDK API 36, Gradle 9.6 and Android Gradle Plugin 9.5.0, then runs `gradle --no-daemon :app:assembleDebug`. It publishes the APK as a GitHub Actions artifact and a beta release asset.

## Free services
GitHub Pages hosts the website free under public repo terms; GitHub Actions uses standard public-repository runners, subject to rate limits. The existing Supabase / Groq / Gemini integrations are subject to their own free-tier availability and quotas.

## Android share-sheet integration (v0.3)
- Select text in another Android app, tap **Share**, then choose **MOHAMMED AI TWIN**.
- The native app displays the received text for your explicit approval. Approving inserts up to 2,000 characters into the private twin chat composer only; **nothing is uploaded or sent to AI until you personally press Send**.
- The app does not scan other applications, read device clipboard history, read contacts wholesale, or intercept third-party sessions.
- For Android foreground microphone service, a visible permission grant and ongoing notification are required; availability is subject to device and OS restrictions. Restarting background capture automatically on reboot is not supported.

## دليل عربي سريع — الإصدار 0.3 التجريبي
1. اضغط رابط ملف APK الموجود أعلى الصفحة، وثبّته على هاتفك بموافقتك من مصدر GitHub الرسمي.
2. افتح التطبيق وسجّل دخولك إلى مساحة التوأم بحساب المدير. لا تحفظ رموز الدخول أو مفاتيح الذكاء الاصطناعي في ملفات عامة.
3. استخدم شريط الأدوات لفتح التطبيقات التي يعرضها Android، أو اختيار جهة اتصال من شاشة الهاتف، أو إعداد اتصال/رسالة تحتاج تأكيدًا منك.
4. اضغط **🎙️ صوت** لأمر صوتي قصير، أو **🎧 جلسة مستمرة** لبدء خدمة صوتية ظاهرة بإذن الميكروفون وإشعار Android. اضغط **⏹ إيقاف الصوت** أو زر الإشعار لإنهائها؛ قد يوقفها Android تلقائيًا.
5. من أي تطبيق يدعم مشاركة النصوص: اختر النص ← «مشاركة» ← MOHAMMED AI TWIN ← وافق على إدراجه. راجعه في مربع المحادثة واضغط «إرسال» فقط عندما تريد ذلك.
6. إن كان لديك إصدار تجريبي سابق بمفتاح توقيع مختلف فقد يطلب النظام إزالة النسخة السابقة قبل تثبيت الإصدار الجديد. تأكد من تصدير البيانات المهمة أولًا.

**حدود هذا الإصدار:** ليس مساعدًا خفيًا، ولا يملك القدرة على قراءة كل الحسابات أو التحكم بكل تطبيق دون أذوناته. لم تُختبر جميع الوظائف على هاتفك الفعلي؛ نجاح البناء لا يعني ضمان عمل التعرف الصوتي في خلفية كل جهاز.
