/* Teaching Studio: authorization is enforced by database RLS, never by the UI. */
(() => {
  'use strict';
  const el=id=>document.getElementById(id), db=window.nabdSupabase;
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeURL=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
  let user=null, assignments=[], courses=[], records=[], admin=false, offset=0, generation=0;
  const pageSize=30;
  const status=message=>{el('studio-status').textContent=message};
  const title=id=>{const c=courses.find(x=>String(x.id)===String(id));return c?.title_ar||c?.title||c?.title_en||id};
  const assigned=id=>assignments.some(x=>x.lecturer_id===user?.id&&x.active&&x.course_id===id);
  const canEdit=row=>admin||(row.lecturer_id===user?.id&&assigned(row.course_id));
  const checked=async query=>{const result=await query;if(result.error)throw result.error;return result.data||[]};
  function report(error){console.error(error);status(['42P01','PGRST205','42883','PGRST202'].includes(error.code)?'مساحة التدريس تحتاج إلى تفعيل مخطط قاعدة البيانات من إدارة الأكاديمية. لم يتم حفظ أي تغيير.':'تعذر إتمام الطلب. تحقق من الاتصال وصلاحية حسابك ثم حاول مجددًا.');}
  function options(items){return items.map(c=>`<option value="${escape(c.id)}">${escape(title(c.id))}</option>`).join('')}
  function render(){
    const q=el('studio-search').value.trim().toLocaleLowerCase(), filter=el('studio-filter').value;
    const visible=records.filter(x=>(filter==='all'||x.status===filter)&&[x.title,x.objective,title(x.course_id)].join(' ').toLocaleLowerCase().includes(q));
    el('studio-records').innerHTML=visible.length?visible.map(x=>{
      const link=safeURL(x.resource_url), date=x.starts_at?new Intl.DateTimeFormat('ar',{dateStyle:'medium',timeStyle:'short'}).format(new Date(x.starts_at)):'';
      return `<article class="nw-record"><span class="nw-badge">${x.status==='published'?'منشور':'مسودة'} · ${x.kind==='session'?'جلسة':'مورد'}</span><h3>${escape(x.title)}</h3><small>${escape(title(x.course_id))}${date?' · '+escape(date):''}</small><p><strong>هدف التعلّم</strong><br>${escape(x.objective)}</p>${x.description?`<p>${escape(x.description)}</p>`:''}${x.reference?`<p>المرجع: ${escape(x.reference)}</p>`:''}<div class="nw-toolbar">${link?`<a href="${escape(link)}" target="_blank" rel="noopener noreferrer">فتح المورد ↗</a>`:''}${canEdit(x)?`<button class="nw-btn secondary" data-edit="${escape(x.id)}">تعديل السجل</button>`:''}</div></article>`;
    }).join(''):'<p>لا توجد سجلات مطابقة ضمن النتائج المحمّلة.</p>';
    el('studio-stats').innerHTML=[[new Set(records.map(x=>x.course_id)).size,'دورات في النتائج المحمّلة'],[records.filter(x=>x.status==='published').length,'مواد منشورة محمّلة'],[records.filter(x=>x.kind==='session').length,'جلسات محمّلة']].map(([n,t])=>`<div class="nw-stat"><b>${n}</b><span>${t}</span></div>`).join('');
  }
  async function loadPage(reset=false){
    const token=generation;
    if(reset){offset=0;records=[];render()}
    const rows=await checked(db.from('nabd_teaching_records').select('*').order('created_at',{ascending:false}).order('id').range(offset,offset+pageSize-1));
    if(token!==generation||!user)return;
    const known=new Set(records.map(x=>x.id)); records.push(...rows.filter(x=>!known.has(x.id)));offset+=rows.length;
    el('studio-more').hidden=rows.length<pageSize;render();
  }
  async function refresh(){
    const token=++generation;records=[];assignments=[];courses=[];admin=false;
    el('studio-workspace').hidden=true;el('studio-admin').hidden=true;el('studio-editor').hidden=true;
    el('studio-record').reset();el('studio-record').elements.id.value='';el('editor-title').textContent='صمّم جلسة أو موردًا';
    const result=await db.auth.getUser();if(token!==generation)return;user=result.data?.user;
    el('studio-login').hidden=!!user;
    if(!user){status('سجّل الدخول لفتح مساحتك التعليمية.');return}
    status('جارٍ تحميل مساحة التدريس…');
    try{
      const [isAdmin, nextAssignments, nextCourses]=await Promise.all([checked(db.rpc('nabd_teaching_is_admin')),checked(db.from('nabd_teaching_assignments').select('*').order('created_at',{ascending:false})),checked(db.from('courses').select('*').order('created_at',{ascending:false}))]);
      if(token!==generation)return;admin=isAdmin===true;assignments=nextAssignments;courses=nextCourses;
      el('studio-name').textContent=admin?'إدارة استوديو المحاضر':assignments.some(x=>x.lecturer_id===user.id&&x.active)?'مساحة التدريس الخاصة بك':'موارد دوراتك التعليمية';
      el('studio-admin').hidden=!admin;
      const writable=courses.filter(c=>admin||assigned(String(c.id)));
      el('studio-editor').hidden=!writable.length;
      el('record-course').innerHTML=options(writable);el('assignment-course').innerHTML=options(courses);
      el('studio-assignments').innerHTML=admin?assignments.map(a=>`<p>${escape(a.display_name)} · ${escape(title(a.course_id))} · ${a.active?'مفعّل':'موقوف'}</p>`).join(''):'';
      el('studio-workspace').hidden=false;await loadPage(true);status('تم تحميل السجلات المتاحة وفق صلاحيات حسابك.');
    }catch(error){if(token!==generation)return;report(error);el('studio-login').hidden=false;el('studio-workspace').hidden=true;}
  }
  async function busy(button,action){if(button.disabled)return;button.disabled=true;try{await action()}catch(error){report(error)}finally{button.disabled=false}}
  el('studio-auth').addEventListener('submit',event=>{event.preventDefault();busy(event.submitter,async()=>{if(!db)throw Error('No client');const f=new FormData(event.target);const result=await db.auth.signInWithPassword({email:f.get('email').trim(),password:f.get('password')});if(result.error){status('تعذر الدخول. تحقق من البريد وكلمة المرور.');return}event.target.reset();await refresh()})});
  el('studio-record').addEventListener('submit',event=>{event.preventDefault();busy(event.submitter,async()=>{
    const f=new FormData(event.target), id=f.get('id'), course=f.get('course_id');
    const original=records.find(x=>x.id===id);if(!user||(!admin&&!assigned(course))||(id&&(!original||!canEdit(original))))throw Error('Unauthorized');
    const url=f.get('resource_url').trim();if(url&&!safeURL(url)){status('استخدم رابطًا يبدأ بـ https:// أو http://.');return}
    const payload={course_id:course,kind:f.get('kind'),title:f.get('title').trim(),objective:f.get('objective').trim(),description:f.get('description').trim(),reference:f.get('reference').trim(),resource_url:url,starts_at:f.get('starts_at')?new Date(f.get('starts_at')).toISOString():null,status:f.get('status')};
    if(!payload.title||!payload.objective){status('أدخل العنوان وهدف التعلّم.');return}
    if(id)await checked(db.from('nabd_teaching_records').update(payload).eq('id',id).select().single());
    else await checked(db.from('nabd_teaching_records').insert({...payload,lecturer_id:user.id}).select().single());
    await refresh();status('تم حفظ السجل بنجاح.');
  })});
  el('studio-assignment').addEventListener('submit',event=>{event.preventDefault();busy(event.submitter,async()=>{if(!admin)throw Error('Unauthorized');const f=new FormData(event.target);await checked(db.from('nabd_teaching_assignments').upsert({lecturer_id:f.get('lecturer_id').trim(),course_id:f.get('course_id'),display_name:f.get('display_name').trim(),active:f.get('active')==='true'},{onConflict:'lecturer_id,course_id'}).select());await refresh();status('تم حفظ التكليف.');})});
  el('studio-records').addEventListener('click',event=>{const button=event.target.closest('[data-edit]');if(!button)return;const row=records.find(x=>x.id===button.dataset.edit);if(!row||!canEdit(row))return;const form=el('studio-record');for(const name of ['id','course_id','kind','title','objective','description','reference','resource_url','status'])form.elements[name].value=row[name]||'';
    const d=row.starts_at?new Date(row.starts_at):null;form.elements.starts_at.value=d?new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16):'';el('editor-title').textContent='تعديل السجل';el('studio-editor').scrollIntoView({block:'start'});form.elements.title.focus();});
  el('studio-cancel').onclick=()=>{el('studio-record').reset();el('studio-record').elements.id.value='';el('editor-title').textContent='صمّم جلسة أو موردًا'};
  el('studio-refresh').onclick=()=>busy(el('studio-refresh'),refresh);
  el('studio-more').onclick=()=>busy(el('studio-more'),()=>loadPage());
  el('studio-logout').onclick=()=>busy(el('studio-logout'),async()=>{const result=await db.auth.signOut();if(result.error)throw result.error;await refresh()});
  el('studio-search').oninput=render;el('studio-filter').onchange=render;
  if(db){db.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){generation++;user=null;records=[];assignments=[];admin=false;el('studio-workspace').hidden=true;el('studio-login').hidden=false;el('studio-auth').reset();status('تم تسجيل الخروج.');}});refresh().catch(report)}else status('تعذر الاتصال بخدمة الحسابات. أعد تحميل الصفحة أو تواصل مع الإدارة.');
})();
