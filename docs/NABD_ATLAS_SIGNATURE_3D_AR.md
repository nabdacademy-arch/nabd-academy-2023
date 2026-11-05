# NABD ATLAS — Signature 3D release

**Status:** Front-end upgrade for the existing NABD Academy learning site, preserving the existing login, Groq/Gemini providers, student information and Supabase tables.

### What is now interactive?

- A true WebGL depth-buffered **3D conceptual** heart scene, not an image tilted with CSS.
- Four colored chambers, simplified vessel tubes, perspective orbit via drag/touch/keyboard, zoom and auto orbit.
- Animated particles show two deliberately simplified flow routes (less-oxygenated blood toward the lungs and oxygen-rich blood toward the body).
- Focus each chamber and learn its role; use a **seven-stage guided blood journey**.
- Full-screen study mode works on a phone or desktop.
- A reduced-motion preference starts paused. When WebGL is unavailable, the existing SVG teaching simulator remains available.
- The rest of the 19-organ library retains image zoom, reference links and bilingual paths. The gallery is still intentionally curated: *not every organ has a volumetric model*.

### Why this differs from a medical 3D model

This is original **procedural 3D illustration** (spheres, tube surfaces, real depth and shading), **not** volumetric imaging, a patient's scan, surgical anatomy, a diagnostic tool, or a medically measured reconstruction. Some artery and pulmonary routes are deliberately flattened/simplified for teaching. The 3D scene does not validate a clinical decision; student medical instructions must be verified against authoritative materials by qualified reviewers.

### Engineering and privacy

- Zero external JavaScript renderer/runtime dependency; engine resides at \`learning/heart-webgl.mjs\`.
- Lazy loaded only when the heart studio opens; rendering pauses when off-screen, when collapsed or under reduced-motion, and GPU buffers are disposed on navigation.
- Native keyboard and accessible controls; normal gallery and image zoom still work with no WebGL.
- The service worker precaches only public first-party assets (including the new engine). It **never** caches students, Supabase, generated responses, authentication, or API calls.
- No API credentials or payment configuration changes. No student data modifications.
- Test \`node learning/tests/heart3d.mjs\` checks four chambers and continuous flow paths.
- Chromium browser tests cover studio creation, route selection, chamber descriptions, guided tour, zoom, pause, fullscreen and original site routes at mobile/desktop widths.

### الدخول المباشر دون استهلاك حصة AI

أضفنا رابطًا مستقلًا تحت القائمة الجانبية: `learning/#atlas`. يمكن للطالب استكشاف 19 عضوًا والمختبر ثلاثي الأبعاد مجانًا، دون تسجيل دخول أو إرسال أي استدعاء إلى Groq/Gemini. لا تزال صور Wikimedia Commons تحتاج الإنترنت، بينما يحفظ Service Worker كود الواجهة العام فقط.
