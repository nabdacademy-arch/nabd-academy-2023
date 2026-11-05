# إصلاح مشكلة حصة المساعد التعليمي — NABD AI Tutor

**المشكلة:** تظهر في مساحة التعلّم رسالة \`QUOTA_DATABASE_UNAVAILABLE\` عند محاولة استدعاء المساعد. هذا يعني أن Edge Function وصلت إلى مرحلة فحص حصة الاستخدام في قاعدة البيانات، لكن استدعاء الدالة \`public.nabd_learning_take_tutor_slot()\` لم ينجح. **لا يثبت ذلك وجود مشكلة في رصيد OpenAI.**

**ما هو مؤكد من الشيفرة:** الدالة \`supabase/functions/nabd-tutor/handler.mjs\` ترسل \`POST /rest/v1/rpc/nabd_learning_take_tutor_slot\` باستخدام جلسة الطالب، وتعطي 503 إذا أعادت قاعدة البيانات خطأ HTTP. **لا يوجد لدينا سجل خطأ SQL الفعلي من Supabase الحية**؛ قد يكون السبب غياب الجدول/الدالة أو صلاحية التنفيذ أو إعداد مشروع غير مطابق.

## الحل المحدد — دون إعادة تشغيل ملف التفعيل الكامل

### الخطوة 1 — تنفيذ الإصلاح مرة واحدة

1. افتح [Supabase Dashboard](https://supabase.com/dashboard) وتأكد أنك داخل **نفس مشروع الأكاديمية المرتبط بالموقع**، والمشار إليه في ملف التفعيل بالمُعرّف \`zsmmmljgguycrvyrmakl\`.
2. افتح **SQL Editor → New query**.
3. افتح ملف [\`supabase/manual/fix_tutor_quota.sql\`](../supabase/manual/fix_tutor_quota.sql) بنسخة **Raw**، وانسخ محتواه كاملًا إلى محرر SQL.
4. اضغط **Run** مرة واحدة من حساب مسؤول المشروع. يجب أن تنتهي العملية بلا خطأ.
5. **لا** تعِد تشغيل \`supabase/activate_nabd.sql\`، ولا تُعطّل سياسات RLS، ولا تشارك مفاتيح الخدمة أو OpenAI.

ملف الإصلاح يعمل في معاملة واحدة (\`BEGIN/COMMIT\`)، ويُنشئ جدول الحصص الخاص فقط عند غيابه، ويستبدل دالة الحصة نفسها، ويمنح صلاحية استدعائها لحساب \`authenticated\` فقط، ويمنع الوصول المباشر إلى العداد من \`anon\` و\`authenticated\`. لا يمس سجلات الطلاب أو الشهادات أو المقررات. يمكن تشغيله مجددًا، ولا يصفر العدادات الموجودة.

### الخطوة 2 — تحقق آمن لا يستهلك الحصة

نفّذ الاستعلام التالي في **SQL Editor**، بعد تطبيق الملف:

\`\`\`sql
select
  to_regclass('nabd_learning_private.tutor_usage') is not null as quota_table_exists,
  to_regprocedure('public.nabd_learning_take_tutor_slot()') is not null as rpc_exists,
  has_function_privilege(
    'authenticated','public.nabd_learning_take_tutor_slot()','EXECUTE'
  ) as authenticated_can_call,
  has_function_privilege(
    'anon','public.nabd_learning_take_tutor_slot()','EXECUTE'
  ) as anon_can_call,
  has_schema_privilege(
    'authenticated','nabd_learning_private','USAGE'
  ) as private_schema_exposed;
\`\`\`

**النتيجة المطلوبة بالترتيب:** \`true, true, true, false, false\`.

هذا الاستعلام تشخيصي ولا يستدعي دالة الحصة، لذلك لا يستنزف عداد الطلبات ولا يحتاج إلى كشف بيانات المستخدمين.

### الخطوة 3 — الاختبار من الموقع

1. سجّل دخولًا إلى مساحة التعلّم في موقع نبض بحساب اختبار فعلي.
2. افتح المساعد التعليمي واسأله سؤالًا تأسيسيًا بسيطًا لا يتضمن معلومات مرضى.
3. إذا اختفى \`QUOTA_DATABASE_UNAVAILABLE\` وظهر جواب، فمسار الحصة يعمل.
4. إذا ظهر \`TUTOR_RATE_LIMIT\` بعد عدة طلبات، فهذا يعني أن نظام الحصص يرد، ولكن الحد الحالي هو **ستة طلبات لكل مستخدم في الدقيقة**.
5. إذا ظهر رمز جديد مثل \`PROVIDER_KEY_INVALID\` أو \`PROVIDER_QUOTA_EXHAUSTED\`، فدالة الحصة وصلت إلى الخطوة التالية؛ يلزم التعامل مع رمز المزوّد الجديد منفصلًا.
6. إن استمرت المشكلة، راجع **Edge Function Logs** في Supabase وحدّد حالة HTTP لطلب RPC والمشروع المستهدف. لا تُرسل مفاتيح JWT أو API أو نصوص مرضى.

## التحقق الآلي (من دون الاتصال بمشروعك الحي)

\`\`\`sh
npm install --prefix /tmp/nabd-quota-test --no-save @electric-sql/pglite@0.5.15
NODE_PATH=/tmp/nabd-quota-test/node_modules node learning/tests/quota-repair.cjs
node learning/tests/tutor.mjs
node learning/tests/tutor-standalone.mjs
\`\`\`

الاختبار يستخدم PostgreSQL افتراضيًا عبر PGlite ويتحقق من إنشاء الدالة، إعادة تشغيل التصحيح بلا فقدان العدادات، ستة طلبات ثم الرفض، بداية الدقيقة الجديدة، فصل المستخدمين، رفض المجهول، وعدم قراءة الجدول الخاص.

**نقطة مهمة:** نجاح GitHub Actions لا يعني أن SQL نُفِّذ على Supabase الحية. تعديل مستودع GitHub لا يشغّل SQL تلقائيًا في المشروع.
