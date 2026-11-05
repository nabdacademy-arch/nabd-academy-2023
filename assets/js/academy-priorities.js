/* Uses existing executive task records; no copies or external messages. */
(() => {
 'use strict';
 const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const register=window.NABD_ADMIN_REGISTER_MODULE;
 if(!register)return;
 register({id:'nabd-priorities',title:'نبض اليوم · أولويات المجلس',async render(panel,{db,user}){
  if(!user){panel.textContent='سجّل الدخول أولًا.';return}
  panel.innerHTML='<h2>نبض اليوم</h2><p>المهام غير المكتملة، مرتبة حسب الاستحقاق. تُعرض النتائج من سجلات المجلس الحالية وبصلاحيات حسابك.</p><div role="status">جارٍ التحميل…</div>';
  const result=await db.from('portal_tasks').select('id,title,status,due_date,assigned_role').neq('status','done').order('due_date',{ascending:true,nullsFirst:false}).limit(50);
  if(result.error){panel.querySelector('[role="status"]').textContent='تعذر تحميل المهام. تحقق من اتصال المجلس وصلاحيات حسابك.';return}
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Hebron',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const roles={founder:'المدير العام',deputy:'نائب المدير',academic:'الشؤون الأكاديمية',research:'البحث العلمي',operations:'العمليات',partnerships:'الشراكات',scholarships:'المنح',finance:'التمويل',media:'الإعلام',technology:'التقنية',hr:'الموارد البشرية',secretary:'أمانة المجلس'};
  const rows=result.data||[], overdue=rows.filter(x=>x.due_date&&x.due_date<today);
  panel.innerHTML=`<h2>نبض اليوم · أولويات المجلس</h2><p>أقرب 50 مهمة غير مكتملة، وفق صلاحياتك. التأخر محسوب بتوقيت فلسطين.</p><div class="nabd-overview"><div class="metric"><b>${rows.length}</b><span>مهام في هذه القائمة</span></div><div class="metric"><b>${overdue.length}</b><span>متأخرة ضمن القائمة</span></div><div class="metric"><b>${rows.filter(x=>x.due_date===today).length}</b><span>تستحق اليوم ضمن القائمة</span></div></div><div class="list-panel">${rows.map(x=>`<article class="record"><span class="tag ${x.due_date&&x.due_date<today?'warn':''}">${x.due_date&&x.due_date<today?'متأخرة':x.due_date===today?'تستحق اليوم':x.due_date?'قادمة':'دون موعد'}</span><h3>${escape(x.title)}</h3><p>${escape(roles[x.assigned_role]||x.assigned_role)} · ${escape(x.due_date||'لم يحدد موعد')}</p><span class="tag">${x.status==='in_progress'?'قيد التنفيذ':'جديدة'}</span></article>`).join('')||'<p>لا توجد مهام غير مكتملة متاحة لحسابك.</p>'}</div><p><a href="portal/">فتح المجلس لتحديث المهام ←</a> · <a href="lecturers.html">تكليف المحاضرين وإدارة مواردهم ←</a></p>`;
 }});
})();
