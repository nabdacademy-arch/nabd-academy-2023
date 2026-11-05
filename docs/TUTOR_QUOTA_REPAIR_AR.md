# إصلاح دالة حصة المساعد التعليمي — دون إعادة تفعيل الأكاديمية

**ما الذي نصلحه؟** تظهر رسالة `QUOTA_DATABASE_UNAVAILABLE` عندما لا تستطيع دالة Supabase Edge Function استدعاء `public.nabd_learning_take_tutor_slot()` عبر `/rest/v1/rpc/`. **هذه ليست رسالة استنفاد رصيد OpenAI**. يمكن أن يكون السبب غياب الدالة أو جدولها، أو عدم منح `EXECUTE` للدور `authenticated`، أو عدم تحديث مخطط PostgREST. لا يمكن الجزم بالسبب الدقيق دون رمز الخطأ الأصلي في سجلات قاعدة البيانات.

## الإجراء الوحيد على قاعدة الإنتاج

1. تأكد أنك داخل **مشروع Supabase الذي تستخدمه أكاديمية نبض بالفعل** (نفس مشروع `SUPABASE_URL` الخاص بالموقع والدالة المستضافة). لا تنشئ مشروعًا جديدًا.
2. احتفظ بنسخة احتياطية مناسبة لقاعدة البيانات وفق صلاحياتك.
3. افتح **SQL Editor** باستخدام حساب مسؤول قاعدة البيانات. افتح [ملف الإصلاح المستقل](../supabase/manual/fix_tutor_quota.sql) بصيغة Raw وانسخ **هذا الملف وحده** إلى نافذة SQL Editor. **لا تشغّل `activate_nabd.sql` ولا أي ترحيل تعليمي شامل مجددًا**.
4. نفّذ الملف مرة واحدة. يقتصر على مخطط الحصة الخاص وجدول العداد ودالة RPC وصلاحياتها؛ لا يُحدّث الدورات أو الطلاب أو الشهادات. تستطيع إعادة تشغيله إذا نجح سابقًا دون مسح عداد الطلبات.
5. يُرسل الملف `NOTIFY pgrst, 'reload schema'` تلقائيًا بعد إعداد الدالة والصلاحيات، حتى تتعرّف واجهة Supabase REST على RPC.
6. اختبر سؤالًا تعليميًا من الموقع بعد **تسجيل الدخول بحساب طالب فعلي**. لا تضع أي توكن جلسة أو مفتاح سري في المحادثة أو في مستودع GitHub.

## التحقق الآمن دون استهلاك حصة

نفّذ الاستعلام التالي **بشكل منفصل** في SQL Editor. لا يستهلك أي طلب من حصة الطالب:

```sql
select
  to_regclass('nabd_learning_private.tutor_usage') is not null as quota_table_exists,
  to_regprocedure('public.nabd_learning_take_tutor_slot()') is not null as rpc_exists,
  has_function_privilege('authenticated', 'public.nabd_learning_take_tutor_slot()', 'EXECUTE') as student_can_call,
  has_function_privilege('anon', 'public.nabd_learning_take_tutor_slot()', 'EXECUTE') as anonymous_can_call,
  has_schema_privilege('authenticated', 'nabd_learning_private', 'USAGE') as private_schema_exposed,
  has_schema_privilege('authenticated', 'public', 'USAGE') as public_schema_usable;
```

النتائج المطلوبة بالترتيب: `true`, `true`, `true`, `false`, `false`, `true`. إذا كان آخر حقل `false` فهذه مشكلة صلاحيات في المخطط `public` تستلزم مراجعة مستقلة، وليس فتح مخطط الحصة الخاص.

**مهم:** تشغيل `select public.nabd_learning_take_tutor_slot()` داخل SQL Editor بحساب `postgres` دون JWT طالب **يُفترض أن يرجع false**؛ هذا ليس فشلًا. الاختبار الحقيقي للحصة يتم من الموقع عبر جلسة `authenticated`، وهو يسمح بستة استدعاءات ناجحة في الدقيقة لكل طالب ثم يرجع `false` عند السابع، بدون كشف جدول العدّاد.

## إذا بقيت المشكلة

راجع **Supabase → Edge Functions → سجلات دالة `smart-processor`** (أو الاسم الفعلي الذي ينتهي به رابط الدالة)، وسجلات API عند استدعاء `/rest/v1/rpc/nabd_learning_take_tutor_slot`.

- `PGRST202` أو HTTP `404`: الوظيفة غير موجودة في مخطط API أو أن ذاكرة PostgREST قديمة. تحقق من تطابق المشروع واسم الدالة، ثم من إشعار التحديث.
- `42501` أو HTTP `401/403`: راجع جلسة JWT وصلاحية `EXECUTE` على الوظيفة. في حالة `SECURITY DEFINER`، افحص أيضًا أن **مالك الدالة** يستطيع القراءة والكتابة في `nabd_learning_private.tutor_usage`.
- `42P01`: الجدول الخاص غير موجود أو تعريفه لا يتطابق مع المتوقع؛ إصلاح SQL يفشل بأمان بدل حذف البيانات.
- `TUTOR_RATE_LIMIT`: انتهت طلبات الدقيقة، وهذه حالة طبيعية ومختلفة عن خطأ الاتصال.
- `PROVIDER_QUOTA_EXHAUSTED`: مشكلة حصة واجهة OpenAI **بعد نجاح فحص الحصة داخل Supabase**، ولا تصلحها قاعدة البيانات.

لا تعطل التحقق من JWT، ولا تكشف `nabd_learning_private` في Data API، ولا تستخدم مفتاح `service_role` في المتصفح. يحتاج تعديل `Edge Function` نفسه إلى نشر مستقل داخل Supabase؛ تعديل ملفات GitHub وحدها لا ينشر SQL أو الدالة في مشروع الإنتاج.

## الاختبارات الآلية

الملف `learning/tests/quota-repair.cjs` يستخدم PostgreSQL معزولًا داخل PGlite، ويختبر إعادة تطبيق الإصلاح دون تصفير الأعداد، ست طلبات في الدقيقة لكل مستخدم، إعادة العدّ في الدقيقة التالية، عدم السماح للزائر المجهول، وعزل جدول الحصة عن المستخدمين. النجاح في هذا الاختبار **لا يثبت تطبيق SQL على قاعدة Supabase الحقيقية**.
