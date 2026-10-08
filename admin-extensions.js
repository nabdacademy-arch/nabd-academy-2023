/* NABD Admin Executive Control Center v3
   All new functionality is loaded separately from admin.html.
   Never include Supabase secret/service role keys in a browser file. */
(() => {
  'use strict';
  const ROLES = [
    ['deputy','نائب المدير العام','Deputy Director'],
    ['academic','مدير الشؤون الأكاديمية','Academic Affairs'],
    ['research','مدير البحث العلمي','Research'],
    ['operations','مدير العمليات','Operations'],
    ['partnerships','مدير العلاقات والشراكات','Partnerships'],
    ['scholarships','مدير المنح ودعم الطلبة','Scholarships'],
    ['finance','مدير التمويل وتنمية الموارد','Finance'],
    ['media','مدير الإعلام والعلاقات العامة','Media & PR'],
    ['technology','مدير التقنية والتحول الرقمي','Technology'],
    ['hr','مدير الموارد البشرية والمتطوعين','HR & Volunteers'],
    ['secretary','أمين سر المجلس التنفيذي','Executive Secretary']
  ];
  const ROLE_NAMES = Object.fromEntries([['founder','المؤسس والمدير العام'],...ROLES.map(r=>[r[0],r[1]])]);
  const REG = /^[-0-9a-f]{36}$/i;
  const E = x => String(x??'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const $ = id => document.getElementById(id);
  const stamp = v => v ? new Date(v).toLocaleString('ar-PS') : '—';
  const val = id => ($(id)?.value || '').trim();
  const opts = (items, value='')=>items.map(x=>`<option value="${E(x[0])}" ${String(value)===String(x[0])?'selected':''}>${E(x[1])}</option>`).join('');
  const roleOptions = (selected='') => opts(ROLES,selected);
  const statusText = (s)=>({todo:'للعمل',in_progress:'قيد التنفيذ',done:'منجزة',draft:'مسودة',submitted:'بانتظار المراجعة',approved:'موافَق عليه (غير منشور)',rejected:'مرفوض',changes_requested:'أُعيد للتعديل'})[s]||s||'—';
  const K = {profiles:[], media:[], reviews:[], tasks:[], meetings:[], bulletins:[], links:[], audit:[], errors:[], loaded:false};
  let busy=false;
  const show = (msg,err=false)=>{if(typeof note === 'function')note(msg,err);else alert(msg)};
  const setMsg=(id,str)=>{const target=$(id);if(target)target.textContent=str;};
  const requireAdmin=()=>{if(!S?.u)throw new Error('يرجى تسجيل الدخول بصفة مدير الموقع أولًا.')};
  const pValue=(i)=> K.profiles.find(p=>p.user_id===i)?.full_name || i || '—';
  function switchTab(id) {
    document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
    document.querySelectorAll('[data-tab]').forEach(b=>{
      const active = b.dataset.tab===id;
      b.classList.toggle('secondary',!active);
      b.setAttribute('aria-selected',String(active));
    });
    const section=$(id);
    if(section)section.classList.remove('hidden');
    if(location.hash!==`#${id}`)history.replaceState(null,'',`#${id}`);
  }
  function installNav() {
    document.querySelectorAll('[data-tab]').forEach(button => {
      button.onclick=()=>switchTab(button.dataset.tab);
      button.setAttribute('role','tab');
    });
    const preferred=location.hash.slice(1);
    switchTab(preferred && $(preferred) ? preferred : 'overview');
  }
  window.NABD_ADMIN_REGISTER_MODULE = function(module) {
    if(!module||!/^[-a-z0-9]{3,40}$/.test(module.id)||!module.title||typeof module.render!=='function')throw Error('Invalid plugin module');
    if($(module.id))return false;
    const nav=document.querySelector('.tabs');
    const button=document.createElement('button');button.type='button';button.className='btn secondary';button.dataset.tab=module.id;button.textContent=module.title;
    const panel=document.createElement('section');panel.className='panel card hidden';panel.id=module.id;
    document.getElementById('app').append(panel);nav.append(button);
    panel.addEventListener('nabd-refresh',()=>module.render(panel,{db,user:S.u}));
    button.addEventListener('click',()=>{switchTab(module.id);panel.dispatchEvent(new Event('nabd-refresh'))});
    return true;
  };
  async function fetchAll(){
    requireAdmin();
    const req=[
      ['profiles',()=>db.from('portal_profiles').select('*').order('created_at',{ascending:false})],
      ['media',()=>db.from('portal_media_items').select('*').order('created_at',{ascending:false}).limit(500)],
      ['reviews',()=>db.from('portal_admin_media_reviews').select('*')],
      ['tasks',()=>db.from('portal_tasks').select('*').order('created_at',{ascending:false}).limit(500)],
      ['meetings',()=>db.from('portal_admin_meetings').select('*').order('scheduled_at',{ascending:false}).limit(250)],
      ['bulletins',()=>db.from('portal_admin_bulletins').select('*').order('created_at',{ascending:false}).limit(250)],
      ['links',()=>db.from('portal_admin_links').select('*').order('created_at',{ascending:false}).limit(250)],
      ['audit',()=>db.from('portal_admin_audit').select('*').order('created_at',{ascending:false}).limit(100)]
    ];
    const out=await Promise.all(req.map(async ([id,fn])=>{
      try{return [id,await fn()]}catch(ex){return [id,{data:[],error:ex}]}
    }));
    K.errors=[];
    for(const [id,r] of out){K[id]=r.data||[];if(r.error)K.errors.push(`${id}: ${r.error.message||r.error}`)}
    K.loaded=true;
    ['adminExtraError'].forEach(id=>{setMsg(id,K.errors.length?'⚠️ '+K.errors.join(' | '):'');$(id)?.classList.toggle('hidden',!K.errors.length)});
    renderAll();
  }
  async function refresh(){if(busy)return;busy=true;setMsg('adminExtraStatus','جارٍ تحميل البيانات...');try{await fetchAll();setMsg('adminExtraStatus','آخر تحديث: '+stamp(new Date()))}catch(e){show(e.message,true)}finally{busy=false}}
  const btn = (text,fn,cls='secondary')=>`<button type="button" class="btn ${cls}" data-action="${fn}">${E(text)}</button>`;
  const empty = text=>`<p class="dim">${E(text)}</p>`;
  function renderOverview(){
    const submitted=K.media.filter(m=>m.status==='submitted'&&!getReview(m)).length;
    const stats=[
      ['الطلاب في النظام',S.p?.filter(p=>p.role==='student').length||0],
      ['الشهادات',S.cert?.length||0],
      ['طلبات المناصب',S.apps?.length||0],
      ['المديرون المفعّلون',K.profiles.filter(p=>p.is_active&&p.role!=='founder').length],
      ['الأخبار بانتظار المراجعة',submitted],
      ['مهام غير منجزة',K.tasks.filter(t=>t.status!=='done').length]
    ];
    $('executiveOverview').innerHTML=stats.map(([name,count])=>`<div class="metric"><b>${E(count)}</b><span>${E(name)}</span></div>`).join('');
  }
  function renderExecutives(){
    const q=val('execSearch').toLowerCase();
    const boxes=ROLES.filter(r=>!q||[...r,...K.profiles.filter(p=>p.role===r[0]).map(p=>p.full_name)].some(x=>x.toLowerCase().includes(q)));
    $('executiveGrid').innerHTML=boxes.map(([id,label,english])=>{
      const people=K.profiles.filter(p=>p.role===id);
      return `<article class="executive-card"><div class="actions" style="justify-content:space-between;align-items:center"><strong>${E(label)}</strong><span class="tag">${E(english)}</span></div>
      ${people.length?people.map(p=>`<div class="person-row"><div><b>${E(p.full_name)}</b><small class="dim">UID: ${E(p.user_id)}</small><span class="tag ${p.is_active?'ok':'off'}">${p.is_active?'فعّال':'موقوف'}</span></div><div class="actions">${btn('تعديل','editexec:'+p.user_id)}${btn(p.is_active?'تعطيل':'تفعيل','toggleexec:'+p.user_id,p.is_active?'danger':'secondary')}</div></div>`).join(''):empty('لا يوجد حساب مرتبط بهذا المنصب بعد.')}</article>`;
    }).join('') || empty('لا توجد نتائج مطابقة');
    const founder=K.profiles.filter(p=>p.role==='founder');
    $('founderReadonly').textContent=founder.length?'حساب المؤسس (للعرض فقط): '+founder.map(p=>p.full_name).join('، '):'حساب المؤسس لا يُدار من هذه الصفحة.';
  }
  function getReview(m) {
    const r=K.reviews.find(x=>x.media_id===m.id);
    if(!r)return null;
    if(m.status==='submitted' && r.reviewed_at && m.submitted_at && new Date(m.submitted_at)>new Date(r.reviewed_at))return null;
    return r;
  }
  function mediaState(m){const r=getReview(m);return r?.decision||m.status}
  function renderMedia(){
    const filter=val('mediaFilter');const search=val('mediaSearch').toLowerCase();
    const list=K.media.filter(m=>(!filter||mediaState(m)===filter)&&(m.title+' '+m.summary).toLowerCase().includes(search));
    $('mediaCount').textContent=K.media.filter(m=>m.status==='submitted'&&!getReview(m)).length+' بانتظار القرار';
    $('mediaList').innerHTML=list.map(m=>{
      const r=getReview(m),pending=m.status==='submitted'&&!r;
      return `<article class="record"><div class="actions justify-between"><span class="tag">${E({news:'خبر',announcement:'إعلان',content:'محتوى إعلامي'}[m.category]||m.category)}</span><span class="tag ${pending?'warn':r?.decision==='approved'?'ok':''}">${E(statusText(mediaState(m)))}</span></div><h3>${E(m.title)}</h3><p>${E(m.summary)}</p><small class="dim">${E(pValue(m.created_by))} · ${E(stamp(m.created_at))} · ${E(m.channel)}</small>
      ${r?.note?`<p class="review-note"><b>ملاحظة المراجعة:</b> ${E(r.note)}</p>`:''}
      <div class="actions">${btn('قراءة المحتوى','viewmedia:'+m.id)}${pending?btn('اتخاذ قرار','reviewmedia:'+m.id,''):''}</div></article>`;
    }).join('')||empty('لا يوجد محتوى مطابق حاليًا.');
  }
  function renderTasks(){
    const s=val('taskFilter');
    $('taskRows').innerHTML=K.tasks.filter(t=>!s||t.status===s).map(t=>{
      const owner=t.assigned_user?pValue(t.assigned_user):(ROLE_NAMES[t.assigned_role]||t.assigned_role);
      return `<tr><td><strong>${E(t.title)}</strong><br><small>${E(t.details)}</small></td><td>${E(owner)}</td><td>${E(t.due_date||'—')}</td><td><select class="input compact" data-taskstatus="${E(t.id)}">${opts([['todo','للعمل'],['in_progress','قيد التنفيذ'],['done','منجزة']],t.status)}</select></td></tr>`;
    }).join('')||'<tr><td colspan="4">لا توجد مهام بعد.</td></tr>';
  }
  function renderMeetings(){
    $('meetingList').innerHTML=K.meetings.map(m=>`<article class="record"><div class="actions justify-between"><h3>${E(m.title)}</h3><span class="tag">${E({scheduled:'مجدول',held:'انعقد',cancelled:'أُلغي'}[m.state])}</span></div><p>${E(stamp(m.scheduled_at))}</p><p>${E(m.agenda)}</p>${m.minutes?`<details><summary>محضر الاجتماع</summary><p class="textblock">${E(m.minutes)}</p></details>`:''}<div class="actions">${btn('تعديل الاجتماع','editmeeting:'+m.id)}${btn('حذف','delmeeting:'+m.id,'danger')}</div></article>`).join('')||empty('لم تُضَف اجتماعات بعد.');
  }
  function renderBulletins(){
    $('bulletinList').innerHTML=K.bulletins.map(b=>`<article class="record"><div class="actions justify-between"><h3>${E(b.title)}</h3><span class="tag">${b.state==='approved'?'معتمد داخليًا':'مسودة'}</span></div><p class="textblock">${E(b.content)}</p><small class="dim">الجمهور المقترح: ${E(b.audience)} · ${E(stamp(b.created_at))}</small><div class="actions">${b.state==='draft'?btn('اعتماد داخلي','approvebulletin:'+b.id):''}${btn('حذف','delbulletin:'+b.id,'danger')}</div></article>`).join('')||empty('لا توجد تعميمات محفوظة.');
  }
  function renderLinks(){
    $('linkList').innerHTML=K.links.map(l=>`<article class="record"><h3>${E(l.label)}</h3><p>${E(l.description)}</p><div class="actions"><a class="btn secondary" href="${E(l.url)}" target="_blank" rel="noopener noreferrer">فتح الرابط ↗</a>${btn('حذف','dellink:'+l.id,'danger')}</div></article>`).join('')||empty('لا توجد روابط مؤسسية.');
  }
  function renderAudit(){
    $('auditRows').innerHTML=K.audit.map(a=>`<tr><td>${E(stamp(a.created_at))}</td><td>${E(a.action)}</td><td>${E(a.target_kind)}</td><td>${E(a.target_id)}</td></tr>`).join('')||'<tr><td colspan="4">لا توجد أحداث إدارية مسجلة.</td></tr>';
  }
  function renderAll(){renderOverview();renderExecutives();renderMedia();renderTasks();renderMeetings();renderBulletins();renderLinks();renderAudit()}
  async function perform(action,fn){
    requireAdmin();if(busy)return;busy=true;
    try {await fn();show(action+' ✅');await fetchAll()}
    catch(e){show(e.message||'تعذر التنفيذ',true)}finally{busy=false}
  }
  function openExecutive(p){
    const edit=!!p;
    open(`<h2>${edit?'تعديل عضو المجلس':'ربط حساب بمنصب تنفيذي'}</h2><p class="dim">يجب إنشاء حساب الدخول أولًا في Authentication → Users. لا تُخزَّن كلمات المرور في هذه الصفحة.</p>
      <form id="executiveForm" class="newform">
      <label>UID الخاص بالمستخدم <input class="input" id="executiveId" ${edit?'readonly':''} required value="${E(p?.user_id||'')}" placeholder="UUID من Supabase"></label>
      <label>الاسم الكامل <input class="input" id="executiveName" maxlength="160" required value="${E(p?.full_name||'')}"></label>
      <label>المنصب <select class="input" id="executiveRole">${roleOptions(p?.role||'media')}</select></label>
      <label class="inline-check"><input id="executiveActive" type="checkbox" ${p?.is_active!==false?'checked':''}> الحساب فعّال</label>
      <button class="btn" type="submit">حفظ الربط والصلاحيات</button></form>`);
    $('executiveForm').onsubmit = async e=>{e.preventDefault();const id=val('executiveId'),name=val('executiveName');if(!REG.test(id))return show('أدخل UUID صحيحًا.',true);
      await perform('تم تحديث العضوية',async()=>{
        const {error}=await db.rpc('nabd_admin_set_executive',{p_user_id:id,p_name:name,p_role:val('executiveRole'),p_active:$('executiveActive').checked});if(error)throw error;close();
      });
    };
  }
  function openMedia(m,review=false){
    const r=getReview(m);
    open(`<h2>${E(m.title)}</h2><p class="dim">${E(stamp(m.created_at))} · ${E(pValue(m.created_by))}</p><p><b>ملخص:</b> ${E(m.summary)}</p><div class="textblock">${E(m.body)}</div>${m.reference_url&&/^https:\/\//.test(m.reference_url)?`<p><a href="${E(m.reference_url)}" target="_blank" rel="noopener noreferrer">الرابط المرجعي ↗</a></p>`:''}
    ${r?.note?`<p class="review-note">${E(r.note)}</p>`:''}
    ${review?`<hr><h3>قرار الإدارة</h3><p class="dim">الموافقة لا تعني النشر على الموقع العام.</p><label>قرار المراجعة<select id="reviewDecision" class="input"><option value="approved">الموافقة (دون نشر)</option><option value="changes_requested">إعادة إلى مسودة للتعديل</option><option value="rejected">رفض المحتوى</option></select></label><label>سبب القرار / الملاحظات<textarea id="reviewNote" class="input" maxlength="3000" rows="4"></textarea></label><button class="btn" id="saveReview" type="button">حفظ القرار</button>`:''}`);
    if(review)$('saveReview').onclick=async()=>{
      const decision=val('reviewDecision'),comment=val('reviewNote');
      if(decision!=='approved'&&comment.length<5)return show('يرجى ذكر سبب لا يقل عن 5 أحرف.',true);
      if(!confirm('تأكيد قرار المراجعة؟'))return;
      await perform('تم حفظ قرار المراجعة',async()=>{const {error}=await db.rpc('nabd_admin_review_media',{p_media_id:m.id,p_decision:decision,p_note:comment});if(error)throw error;close()});
    };
  }
  function openTask(){
    const members=K.profiles.filter(p=>p.is_active&&p.role!=='founder');
    open(`<h2>إسناد مهمة إلى إدارة</h2><form id="taskForm" class="newform">
      <label>عنوان المهمة<input class="input" id="taskTitle" maxlength="160" required minlength="3"></label>
      <label>التفاصيل<textarea class="input" id="taskDetails" maxlength="2000" rows="4"></textarea></label>
      <label>الإدارة المعنية<select id="taskRole" class="input">${roleOptions()}</select></label>
      <label>موظف محدد (اختياري)<select id="taskPerson" class="input"><option value="">تعيين إلى المنصب عمومًا</option></select></label>
      <label>موعد الإنجاز (اختياري)<input id="taskDue" class="input" type="date"></label>
      <button type="submit" class="btn">إنشاء المهمة</button></form>`);
    const updatePeople=()=>{$('taskPerson').innerHTML='<option value="">تعيين إلى المنصب عمومًا</option>'+opts(members.filter(p=>p.role===val('taskRole')).map(p=>[p.user_id,p.full_name]))};
    $('taskRole').onchange=updatePeople;updatePeople();
    $('taskForm').onsubmit=async e=>{e.preventDefault();await perform('تم إنشاء المهمة',async()=>{
      const payload={title:val('taskTitle'),details:val('taskDetails'),assigned_role:val('taskRole'),assigned_user:val('taskPerson')||null,due_date:val('taskDue')||null,created_by:S.u.id};
      const {error}=await db.from('portal_tasks').insert(payload);if(error)throw error;close();
    })};
  }
  function openMeeting(m){
    const dt=m?.scheduled_at?new Date(new Date(m.scheduled_at).getTime()-new Date(m.scheduled_at).getTimezoneOffset()*60000).toISOString().slice(0,16):'';
    open(`<h2>${m?'تعديل':'إضافة'} اجتماع مجلس</h2><form id="meetingForm" class="newform">
      <label>العنوان<input id="meetingTitle" class="input" minlength="3" maxlength="180" required value="${E(m?.title||'')}"></label>
      <label>الموعد<input type="datetime-local" id="meetingTime" class="input" required value="${E(dt)}"></label>
      <label>جدول الأعمال<textarea id="meetingAgenda" class="input" rows="3" maxlength="4000">${E(m?.agenda||'')}</textarea></label>
      <label>محضر الاجتماع<textarea id="meetingMinutes" class="input" rows="5" maxlength="10000">${E(m?.minutes||'')}</textarea></label>
      <label>الحالة<select id="meetingState" class="input">${opts([['scheduled','مجدول'],['held','انعقد'],['cancelled','أُلغي']],m?.state||'scheduled')}</select></label>
      <button class="btn" type="submit">حفظ الاجتماع</button></form>`);
    $('meetingForm').onsubmit=async e=>{e.preventDefault();await perform('تم حفظ الاجتماع',async()=>{
      const payload={title:val('meetingTitle'),scheduled_at:new Date(val('meetingTime')).toISOString(),agenda:val('meetingAgenda'),minutes:val('meetingMinutes'),state:val('meetingState')};
      const q=m?db.from('portal_admin_meetings').update(payload).eq('id',m.id):db.from('portal_admin_meetings').insert({...payload,created_by:S.u.id});const {error}=await q;if(error)throw error;close();
    })};
  }
  function openBulletin(){
    open(`<h2>تعميم داخلي جديد</h2><p class="dim">هذه مسودة داخلية. لا ترسل بريدًا أو إشعارًا تلقائيًا للأعضاء.</p><form id="bulletinForm" class="newform">
      <label>العنوان<input id="bulletinTitle" class="input" minlength="3" maxlength="180" required></label>
      <label>الجمهور المستهدف<select id="bulletinAudience" class="input"><option value="all">جميع المجلس</option>${roleOptions()}</select></label>
      <label>المحتوى<textarea id="bulletinContent" class="input" minlength="3" maxlength="8000" rows="5" required></textarea></label>
      <button type="submit" class="btn">حفظ مسودة التعميم</button></form>`);
    $('bulletinForm').onsubmit=async e=>{e.preventDefault();await perform('تم حفظ التعميم',async()=>{
      const {error}=await db.from('portal_admin_bulletins').insert({title:val('bulletinTitle'),audience:val('bulletinAudience'),content:val('bulletinContent'),created_by:S.u.id});if(error)throw error;close();
    })};
  }
  function openLink(){
    open(`<h2>إضافة رابط مؤسسي</h2><form id="linkForm" class="newform">
      <label>الاسم<input id="linkLabel" class="input" maxlength="160" minlength="3" required></label>
      <label>رابط HTTPS<input type="url" id="linkUrl" class="input" required placeholder="https://..."></label>
      <label>ملاحظات<textarea id="linkDetails" class="input" maxlength="500" rows="3"></textarea></label>
      <button type="submit" class="btn">حفظ الرابط</button></form>`);
    $('linkForm').onsubmit=async e=>{e.preventDefault();const u=val('linkUrl');if(!/^https:\/\/[^\s]+$/.test(u))return show('يسمح فقط بروابط https الآمنة.',true);
      await perform('تم حفظ الرابط',async()=>{const {error}=await db.from('portal_admin_links').insert({label:val('linkLabel'),url:u,description:val('linkDetails'),created_by:S.u.id});if(error)throw error;close()})};
  }
  function exportCSV(type){
    const fields={
      council:['user_id','full_name','role','is_active','created_at'],
      content:['id','title','category','channel','status','created_by','created_at'],
      tasks:['id','title','details','assigned_role','assigned_user','status','due_date','created_at'],
      applications:['application_number','full_name_ar','full_name_en','email','position_applied','status','created_at']
    };
    const rows=type==='council'?K.profiles:type==='content'?K.media:type==='tasks'?K.tasks:S.apps;
    const cols=fields[type]||fields.council;
    const csv=[cols.join(','),...rows.map(r=>cols.map(k=>'"'+String(r[k]??'').replace(/"/g,'""')+'"').join(','))].join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const link=document.createElement('a');const url=URL.createObjectURL(blob);link.href=url;link.download=`nabd-${type}-${new Date().toISOString().slice(0,10)}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function downloadFileReport(){
    const report={generatedAt:new Date().toISOString(),members:K.profiles.length,active:K.profiles.filter(p=>p.is_active).length,pendingMedia:K.media.filter(m=>m.status==='submitted'&&!getReview(m)).length,pendingTasks:K.tasks.filter(t=>t.status!=='done').length,applications:S.apps?.length||0,meetings:K.meetings.length};
    const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='nabd-executive-summary.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function removeTableRow(tbl,id,label){if(!confirm(`تأكيد حذف ${label}؟`))return;
    await perform('تم الحذف',async()=>{const {error}=await db.from(tbl).delete().eq('id',id);if(error)throw error});
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-action]');if(!b||!S?.u)return;
    const [act,id]=b.dataset.action.split(':');
    if(act==='refresh')return refresh();
    if(act==='addexec')return openExecutive(null);
    if(act==='editexec')return openExecutive(K.profiles.find(p=>p.user_id===id));
    if(act==='toggleexec'){const p=K.profiles.find(p=>p.user_id===id);if(!p||!confirm(`تأكيد ${p.is_active?'إيقاف':'تفعيل'} عضوية ${p.full_name}؟`))return;
      return perform('تم تحديث حالة العضوية',async()=>{const {error}=await db.rpc('nabd_admin_set_executive',{p_user_id:p.user_id,p_name:p.full_name,p_role:p.role,p_active:!p.is_active});if(error)throw error});}
    if(act==='viewmedia'||act==='reviewmedia'){const m=K.media.find(m=>m.id===id);if(m)openMedia(m,act==='reviewmedia');return}
    if(act==='addtask')return openTask();
    if(act==='addmeeting')return openMeeting(null);
    if(act==='editmeeting')return openMeeting(K.meetings.find(m=>m.id===id));
    if(act==='delmeeting')return removeTableRow('portal_admin_meetings',id,'الاجتماع');
    if(act==='addbulletin')return openBulletin();
    if(act==='approvebulletin'){if(!confirm('اعتماد داخلي فقط، دون إرسال للأعضاء؟'))return;return perform('تم اعتماد التعميم داخليًا',async()=>{const {error}=await db.from('portal_admin_bulletins').update({state:'approved'}).eq('id',id);if(error)throw error})}
    if(act==='delbulletin')return removeTableRow('portal_admin_bulletins',id,'التعميم');
    if(act==='addlink')return openLink();
    if(act==='dellink')return removeTableRow('portal_admin_links',id,'الرابط');
    if(act==='report')return downloadFileReport();
    if(act==='csv')return exportCSV(id);
  });
  document.addEventListener('change',async e=>{
    if(!e.target.matches('[data-taskstatus]'))return;
    const id=e.target.dataset.taskstatus, status=e.target.value;
    await perform('تم تحديث المهمة',async()=>{
      const {error}=await db.from('portal_tasks').update({status}).eq('id',id);if(error)throw error;
    });
  });
  ['execSearch','mediaSearch','mediaFilter','taskFilter'].forEach(id=>{
    $(id)?.addEventListener('input',()=>{if(K.loaded)renderAll()});
  });
  installNav();
  // The pre-existing dashboard's admin() calls load(); keep that entire behavior,
  // then load the independent executive modules using the current session.
  const previousLoad=load;
  load=async function(){await previousLoad();if(S?.u)await refresh()};
  window.addEventListener('nabd-admin-reload',refresh);
})();
