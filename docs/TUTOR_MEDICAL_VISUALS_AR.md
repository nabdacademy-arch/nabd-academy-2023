# NABD Medical Tutor — تعليم بصري مرتبط بالإجابات

هذا التطوير خاص **بواجهة التعلم العامة** في مجلد \`learning/\`، ولا يتطلب تعديل Supabase أو SQL أو مفاتيح Groq/Gemini.

## ما الذي يراه الطالب؟

عند السؤال عن القلب أو الرئتين أو الدماغ أو الكلى أو الجهاز الهضمي، تعرض واجهة المساعد تلقائيًا **رسمًا تعليميًا ذا مصدر موثق** أسفل الإجابة، مع رابط إلى المصدر الأصلي واسم الفنان والترخيص. ويظهر إلى جانبه تسلسل مبسط يربط بين الأعضاء ووظائفها بطريقة بصرية. يعرض النظام موضوعين على الأكثر في السؤال الواحد، ولا يعرض صورة غير مرتبطة بالسؤال. تعمل البطاقات أيضًا بعد البحث في الحزمة المرجعية بدون ذكاء اصطناعي.

النصوص المولدة تظهر بعناوين وقوائم قابلة للقراءة، بدل إظهار علامات \`##\` و\`**\` حرفيًا. العرض يضع كل النصوص غير الموثوقة في \`textContent\`، وليس \`innerHTML\`، ليمنع حقن HTML أو JavaScript.

## صور واعتمادات Wikimedia Commons

- القلب: [Diagram of the human heart.svg](https://commons.wikimedia.org/wiki/File:Diagram_of_the_human_heart.svg)، Wapcaplet وYaddah، CC BY-SA 3.0.
- التنفس: [Respiratory system complete en.svg](https://commons.wikimedia.org/wiki/File:Respiratory_system_complete_en.svg)، LadyofHats وJmarchn، ملكية عامة.
- الدماغ: [Human head and brain diagram.svg](https://commons.wikimedia.org/wiki/File:Human_head_and_brain_diagram.svg)، Patrick J. Lynch وC. Carl Jaffe، CC BY 2.5.
- الكلى: [Kidney.svg](https://commons.wikimedia.org/wiki/File:Kidney.svg)، Flac، CC BY-SA 3.0.
- الهضم: [Digestive system without labels.svg](https://commons.wikimedia.org/wiki/File:Digestive_system_without_labels.svg)، LadyofHats وJmarchn، ملكية عامة.

هذه الصور تظهر في الصفحة من Wikimedia Commons عبر \`Special:FilePath\`؛ إذا فشل تحميل الصورة تبقى وصلة المصدر متاحة. **تحميل الصور الخارجية يحتاج إنترنت**، ولا تخزّنها حزمة التعلم المحلية. يمكن أن يعرف مستضيف الصور عنوان IP والمتصفح عند طلب الصورة؛ ولا يرسل الموقع السؤال أو بيانات الطالب إلى Wikimedia. يتطلب نشر الصور العامة الحفاظ على نسبتها وشروط تراخيصها، وتبقى الرسومات للتعليم لا للتشخيص الطبي.

## الاختبار

- \`node learning/tests/medical-visuals.mjs\` للتحقق من مطابقة الكلمات وصحة مصادر الاعتماد.
- \`learning/tests/browser.cjs\` لاختبار ظهور الرسم والمخطط في مسار البحث المرجعي، بالإضافة إلى فحوص التوافق مع الهاتف والتعلم دون إنترنت.
- إجراء GitHub Actions \`learning-medical-visuals.yml\` يشغل الاختبارات تلقائيًا.

لا تعد هذه النسخة باستخراج صور من أي سؤال تلقائيًا من الإنترنت، أو بتحليل مريض، أو بتوليد صور طبية بواسطة النموذج. البداية قائمة مصغرة مدققة من خمس موضوعات، ويمكن للمراجعين الأكاديميين توسيعها لاحقًا.
