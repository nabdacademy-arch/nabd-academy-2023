/* NABD Executive Departments v4 — ten workspaces (Media stays in v2).
   This UI never assigns permissions: Supabase RLS is the sole authorization boundary.
   No credentials or secret keys are stored here. */
(() => {
  'use strict';
  const fallback = {
    deputy:[['coordination','تنسيق الإدارات','Department coordination'],['followup','متابعة الخطط','Plan follow-up'],['reports','التقارير الدورية','Periodic reports']],
    academic:[['courses','خطط الدورات','Course plans'],['lecturers','إدارة المحاضرين','Lecturer coordination'],['curriculum','المناهج والمقررات','Curriculum'],['evaluation','التقييم الأكاديمي','Academic evaluation']],
    research:[['projects','المشاريع البحثية','Research projects'],['teams','فرق البحث','Research teams'],['review','المراجعة العلمية','Scientific review'],['ethics','الأخلاقيات البحثية','Research ethics']],
    operations:[['events','الفعاليات والأنشطة','Events'],['logistics','التجهيزات واللوجستيات','Logistics'],['procedures','الإجراءات التشغيلية','Procedures']],
    partnerships:[['outreach','التواصل المؤسسي','Outreach'],['proposals','مقترحات الشراكة','Partnership proposals'],['agreements','مسودات الاتفاقيات','Draft agreements']],
    scholarships:[['opportunities','فرص المنح','Scholarship opportunities'],['support','مبادرات دعم الطلبة','Student support'],['nominations','خطط الترشيحات','Nominations']],
    finance:[['budgets','الميزانيات التقديرية','Budget proposals'],['funding','مبادرات التمويل','Funding initiatives'],['expenses','طلبات المصروفات','Expense requests']],
    technology:[['tickets','بلاغات الأعطال','Support tickets'],['roadmap','خطة التطوير','Roadmap'],['security','مراجعات الأمان','Security reviews']],
    hr:[['recruitment','خطط الاستقطاب','Recruitment'],['volunteers','إدارة المتطوعين','Volunteers'],['performance','متابعة الأداء','Performance']],
    secretary:[['meetings','الاجتماعات','Meetings'],['minutes','محاضر الجلسات','Meeting minutes'],['resolutions','متابعة القرارات','Resolutions']]
  };
  let context={client:null,role:null,user:null,lang:'ar',demo:false};
  let records=[],modules=[],reviews=[],query='',selected='all',loading=false,loadError='',loaded=false;
  const $ = id => document.getElementById(id);
  const esc = value => String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const arabic = () => context.lang!=='en';
  const msg=(ar,en)=>arabic()?ar:en;
  const date=v=>v?new Date(v).toLocaleDateString(arabic()?'ar-PS':'en-GB'):'—';
  const selectedModules=()=>modules.length?modules:
    (fallback[context.role]||[]).map((p,i)=>({role:context.role,code:p[0],title_ar:p[1],title_en:p[2],sort_order:(i+1)*10}));
  const title=x=>arabic()?x.title_ar:x.title_en;
  const moduleName=x=>title(selectedModules().find(m=>m.code===x.module_code)||{title_ar:x.module_code,title_en:x.module_code});
  const reviewFor=x=>{const rv=reviews.find(r=>r.record_id===x.id);return rv && x.status==='submitted' && x.submitted_at && new Date(x.submitted_at)>new Date(rv.reviewed_at)?null:rv;};
  const displayStatus=x=>({approved:msg('مُعتمد داخليًا','Internally approved'),changes_requested:msg('أُعيد للتعديل','Needs changes'),rejected:msg('مرفوض','Rejected'),submitted:msg('بانتظار المراجعة','Awaiting review'),draft:msg('مسودة','Draft')})[reviewFor(x)?.decision||x.status]||x.status;
  const makeCards=()=>{
    const visible=records.filter(r=>(selected==='all'||r.module_code===selected)&&(!query||`${r.title} ${r.summary}`.toLowerCase().includes(query)));
    if(!visible.length)return `<div class="dept-empty">${esc(msg('لا توجد سجلات بعد. أنشئ أول مسودة لهذه الإدارة.','No records. Create the first departmental draft.'))}</div>`;
    return visible.map(r=>`<article class="dept-record"><div class="dept-record-top"><span class="dept-chip">${esc(moduleName(r))}</span><span class="dept-chip ${r.status==='submitted'?'waiting':'ok'}">${esc(displayStatus(r))}</span></div>
      <h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p><small>${esc(date(r.created_at))}</small>
      ${reviewFor(r)?.note?`<p class="dept-review-note"><strong>${esc(msg('ملاحظة الإدارة:','Admin note:'))}</strong> ${esc(reviewFor(r).note)}</p>`:''}
      <details><summary>${esc(msg('قراءة التفاصيل','Read details'))}</summary><p class="dept-wrap-text">${esc(r.details||'—')}</p>${r.reference_url?`<a href="${esc(r.reference_url)}" target="_blank" rel="noopener noreferrer">${esc(msg('فتح الرابط المرجعي','Open reference'))}</a>`:''}</details>
      <div class="dept-buttons">${r.status==='draft'?`<button type="button" data-dept="edit" data-id="${esc(r.id)}">${esc(msg('تعديل','Edit'))}</button><button type="button" data-dept="submit" data-id="${esc(r.id)}" class="strong">${esc(msg('إرسال للمراجعة','Submit for review'))}</button><button type="button" data-dept="delete" data-id="${esc(r.id)}" class="danger">${esc(msg('حذف المسودة','Delete'))}</button>`:''}</div></article>`).join('');
  };
  const summary = () => ({total:records.length,drafts:records.filter(x=>x.status==='draft').length,
    submitted:records.filter(x=>x.status==='submitted'&&!reviewFor(x)).length,
    approved:records.filter(x=>reviewFor(x)?.decision==='approved').length,loaded});
  const refreshList=()=>{
    if($('dept-list'))$('dept-list').innerHTML=makeCards();
    if($('dept-total'))$('dept-total').textContent=String(records.length);
    const m=selectedModules().find(x=>x.code===selected);
    const scope=$('dept-selected-title');if(scope)scope.textContent=m?title(m):msg('جميع الأقسام','All departments');
    const desc=$('dept-selected-desc');if(desc)desc.textContent=m?msg('مساحة عمل هذا القسم: اعرض السجلات وأنشئ مسودة مرتبطة به مباشرة.','Workspace selected: review records or create a draft for this module.'):msg('اختر أحد الأقسام لفتح مساحة العمل الخاصة به، أو استعرض جميع السجلات.','Choose a module above to focus on its workspace, or see all records.');
    const count=$('dept-selected-count');if(count)count.textContent=String(records.filter(x=>selected==='all'||x.module_code===selected).length);
    document.querySelectorAll('[data-dept-filter]').forEach(el=>{const active=el.dataset.deptFilter===selected;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
  };
  const feedback=(s,bad=false)=>{const node=$('dept-message');if(node){node.textContent=s;node.classList.toggle('dept-error',bad);}else if(bad)alert(s);};
  async function load({client,role,user}){
    if(!client||!user||!fallback[role])return;
    if(context.role!==role){selected='all';query='';records=[];reviews=[];modules=[];loaded=false;}
    context={...context,client,role,user,demo:false};
    loading=true;loadError='';
    try{
      const [mod,rec,rev]=await Promise.all([
        client.from('portal_department_modules').select('role,code,title_ar,title_en,sort_order').eq('role',role).order('sort_order'),
        client.from('portal_department_records').select('id,role,module_code,title,summary,details,reference_url,status,created_at,submitted_at,created_by').order('created_at',{ascending:false}).limit(300),
        client.from('portal_department_reviews').select('record_id,decision,note,reviewed_at').limit(300)
      ]);
      if(mod.error||rec.error||rev.error)throw mod.error||rec.error||rev.error;
      modules=mod.data||[];records=rec.data||[];reviews=rev.data||[];loaded=true;
    }catch(err){loadError=String(err?.message||err);loaded=false;}
    finally{loading=false;refreshList();}
  }
  function view({role,roleLabel,lang,demo}){
    context={...context,role,lang,demo};
    const cats=selectedModules();
    const label=roleLabel || msg('مساحة عمل الإدارة','Department workspace');
    return `<section class="dept-wrap"><div class="page-head"><div class="eyebrow">NABD / DEPARTMENT WORKSPACE</div><h1>${esc(label)}</h1><p>${esc(msg('نظام المسودات والتقارير والطلبات الخاص بمنصبك؛ الإرسال للمراجعة لا يعني الموافقة أو النشر العام.','Your department records and proposals. Submission does not mean approval or public publication.'))}</p></div>
      <div class="dept-summary"><span>${esc(msg('عدد السجلات','Records'))}: <b id="dept-total">${records.length}</b></span><span>${esc(msg('المهام والتقارير معزولة حسب حسابك وصلاحيتك.','Records are restricted to your own authorized account.'))}</span></div>
      ${demo?`<div class="dept-notice">${esc(msg('معاينة فقط — لا تتيح الحفظ الفعلي.','Preview only — writes disabled.'))}</div>`:''}
      ${loadError?`<div class="dept-notice dept-error">${esc(msg('تعذر الاتصال بوحدة الإدارة. تأكد من تنفيذ SQL v4: ','Could not load department records. Run SQL v4: ')+loadError)}</div>`:''}
      <div id="dept-message" role="status" aria-live="polite"></div>
      <div class="dept-toolbar"><button type="button" class="dept-action" data-dept="new" ${demo?'disabled':''}>＋ ${esc(msg('إنشاء مسودة جديدة','New record'))}</button><button type="button" class="dept-action secondary" data-dept="refresh" ${demo?'disabled':''}>↻ ${esc(msg('تحديث','Refresh'))}</button></div>
      <div class="dept-module-grid">${cats.map((m,i)=>`<button type="button" data-dept-filter="${esc(m.code)}" aria-pressed="${selected===m.code}" class="dept-module ${selected===m.code?'active':''}"><span class="dept-module-icon">${['◈','▤','✦','◉'][i%4]}</span><span class="dept-module-copy"><strong>${esc(title(m))}</strong><small>${esc(msg('فتح مساحة القسم','Open workspace'))} ←</small></span></button>`).join('')}</div>
      <div class="dept-selected-banner"><div class="dept-current-icon">▤</div><div class="dept-selected-copy"><span>${esc(msg('مساحة العمل الحالية','CURRENT WORKSPACE'))}</span><h2 id="dept-selected-title">${esc(selected==='all'?msg('جميع الأقسام','All departments'):title(cats.find(x=>x.code===selected)||cats[0]))}</h2><p id="dept-selected-desc">${esc(msg('اختر قسمًا أعلاه لتركيز السجلات والمسودات على مجاله.','Choose a module above to focus your records and drafts.'))}</p></div><span class="dept-current-count"><b id="dept-selected-count">${records.filter(x=>selected==='all'||x.module_code===selected).length}</b> ${esc(msg('سجل','records'))}</span></div>
      <div class="dept-filters"><button class="dept-filter ${selected==='all'?'active':''}" type="button" data-dept-filter="all">${esc(msg('كل الأقسام','All'))}</button><input id="dept-search" class="input" aria-label="${esc(msg('البحث','Search'))}" placeholder="${esc(msg('ابحث عن عنوان أو ملخص','Search title or summary'))}" value="${esc(query)}"/></div>
      <div id="dept-list">${makeCards()}</div><p class="dept-privacy">${esc(msg('لا تُدرج بيانات شخصية حساسة للطلبة أو معلومات طبية أو كلمات مرور أو تفاصيل مالية سرية في هذه السجلات.','Do not store sensitive student or patient data, passwords, or confidential financial details in these records.'))}</p>
    </section>`;
  }
  function closeDialog(){const dialog=$('dept-dialog');if(dialog){dialog.close();dialog.remove();}}
  function formDialog(item){
    if(context.demo||!context.user)return;
    closeDialog();
    const cats=selectedModules();
    const dlg=document.createElement('dialog');dlg.id='dept-dialog';dlg.className='dept-dialog';
    dlg.innerHTML=`<div class="dept-dialog-head"><h2>${esc(item?msg('تعديل مسودة','Edit draft'):msg('إنشاء مسودة','New draft'))}</h2><button type="button" data-dept="close">×</button></div>
      <form id="dept-form"><input type="hidden" name="record_id" value="${esc(item?.id||'')}">
       <label>${esc(msg('مجال العمل','Module'))}<select name="module_code" class="input" ${item?'disabled':''}>${cats.map(m=>`<option value="${esc(m.code)}" ${(item?.module_code||selected)===m.code?'selected':''}>${esc(title(m))}</option>`).join('')}</select></label>
       <label>${esc(msg('العنوان','Title'))}<input class="input" name="title" minlength="4" maxlength="180" value="${esc(item?.title||'')}" required></label>
       <label>${esc(msg('ملخص / هدف','Summary'))}<textarea class="input" name="summary" maxlength="600" rows="3">${esc(item?.summary||'')}</textarea></label>
       <label>${esc(msg('التفاصيل والخطة','Details'))}<textarea class="input" name="details" maxlength="12000" rows="6">${esc(item?.details||'')}</textarea></label>
       <label>${esc(msg('رابط داعم HTTPS — اختياري','Reference URL (HTTPS) — optional'))}<input class="input" name="reference_url" type="url" value="${esc(item?.reference_url||'')}" placeholder="https://..."></label>
       <div class="dept-dialog-actions"><button type="submit" class="dept-action">${esc(msg('حفظ المسودة','Save draft'))}</button><button type="button" data-dept="close">${esc(msg('إلغاء','Cancel'))}</button></div>
       <p id="dept-form-error" class="dept-form-error" role="alert"></p>
      </form>`;
    document.body.append(dlg);dlg.addEventListener('click',ev=>{if(ev.target===dlg)closeDialog()});dlg.showModal();
  }
  async function run(kind,id){
    const item=records.find(x=>x.id===id);if(!item||item.status!=='draft'||!context.client) return;
    if(kind==='submit'&&!confirm(msg('إرسال هذه المسودة للمراجعة؟ بعد الإرسال لن تتمكن من تعديلها إلا إذا أعادتها الإدارة.','Submit for review? Editing will be locked until returned.')))return;
    if(kind==='delete'&&!confirm(msg('حذف هذه المسودة نهائيًا؟','Delete this draft permanently?')))return;
    const q=kind==='submit'?context.client.from('portal_department_records').update({status:'submitted'}).eq('id',id).eq('status','draft'):
      context.client.from('portal_department_records').delete().eq('id',id).eq('status','draft');
    const {data,error}=await q.select('id');if(error)throw error;if(!data?.length)throw Error(msg('لم تُنفذ العملية بسبب حالة السجل أو الصلاحيات.','Not authorized or record already changed.'));
    await load(context);feedback(kind==='submit'?msg('أُرسلت للمراجعة دون نشر عام.','Submitted for internal review.'):msg('حُذفت المسودة.','Draft deleted.'));
  }
  async function save(form){
    const data=new FormData(form),id=String(data.get('record_id')||'');
    const values={title:String(data.get('title')||'').trim(),summary:String(data.get('summary')||'').trim(),details:String(data.get('details')||'').trim(),reference_url:String(data.get('reference_url')||'').trim()};
    if(values.title.length<4||values.title.length>180)throw Error(msg('العنوان يجب أن يكون بين 4 و180 حرفًا.','Title must have 4–180 characters.'));
    if(values.reference_url&&!/^https:\/\/[^\s]+$/i.test(values.reference_url))throw Error(msg('الرابط يجب أن يبدأ بـ https://','Reference must be HTTPS.'));
    if(id && !records.some(x=>x.id===id&&x.status==='draft'))throw Error(msg('هذه المسودة غير قابلة للتعديل.','Draft is locked.'));
    const request=id?context.client.from('portal_department_records').update(values).eq('id',id).eq('status','draft'):
      context.client.from('portal_department_records').insert({...values,role:context.role,module_code:String(data.get('module_code')),created_by:context.user.id,status:'draft'});
    const {data:written,error}=await request.select('id');if(error)throw error;if(!written?.length)throw Error(msg('لم يتم الحفظ، تحقق من الصلاحيات.','Save failed. Verify permissions.'));
    closeDialog();await load(context);feedback(msg('تم حفظ المسودة في قاعدة البيانات.','Draft saved to the database.'));
  }
  document.addEventListener('click',async ev=>{
    const filter=ev.target.closest('[data-dept-filter]');if(filter){selected=filter.dataset.deptFilter;refreshList();return;}
    const b=ev.target.closest('[data-dept]');if(!b)return;
    const action=b.dataset.dept,id=b.dataset.id;
    if(action==='close'){closeDialog();return;}
    if(context.demo||!context.client)return;
    if(action==='new'){formDialog(null);return;}
    if(action==='edit'){const item=records.find(x=>x.id===id);if(item?.status==='draft')formDialog(item);return;}
    try{b.disabled=true;if(action==='refresh')await load(context);if(action==='submit'||action==='delete')await run(action,id)}
    catch(err){feedback(String(err?.message||err),true)}finally{if(b.isConnected)b.disabled=false}
  });
  document.addEventListener('input',ev=>{if(ev.target.id==='dept-search'){query=ev.target.value.toLowerCase().trim();refreshList()}});
  document.addEventListener('submit',async ev=>{
    if(ev.target.id!=='dept-form')return;ev.preventDefault();const b=ev.target.querySelector('[type="submit"]');b.disabled=true;
    try{await save(ev.target)}catch(err){if($('dept-form-error'))$('dept-form-error').textContent=String(err?.message||err)}finally{if(b.isConnected)b.disabled=false}
  });
  window.NABD_DEPARTMENTS={view,load,summary,reset(){context={client:null,role:null,user:null,lang:'ar',demo:false};records=[];modules=[];reviews=[];query='';selected='all';loadError='';loaded=false;closeDialog();}};
})();
