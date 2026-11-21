/* NABD Councils Network — real Supabase Auth & RLS. No client-side membership grants. */
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const councils = [
    {code:"trustees",icon:"♛",ar:"المجلس الأعلى للأمناء",en:"Board of Trustees",arDesc:"الحوكمة والاتجاه المؤسسي",enDesc:"Governance and strategic stewardship",color:"#f2d399"},
    {code:"academic",icon:"✺",ar:"المجلس العلمي والأكاديمي",en:"Scientific & Academic Council",arDesc:"المناهج والمراجعة العلمية",enDesc:"Curricula and scientific review",color:"#65f0d6"},
    {code:"research",icon:"⌬",ar:"مجلس البحث العلمي والابتكار",en:"Research & Innovation Council",arDesc:"أبحاث ومشاريع قابلة للنشر",enDesc:"Research and innovation projects",color:"#9eafff"},
    {code:"students",icon:"◈",ar:"المجلس الطلابي الأعلى",en:"Supreme Student Council",arDesc:"تمثيل الطلبة والمبادرات",enDesc:"Student representation and initiatives",color:"#f6bbad"},
    {code:"international",icon:"◎",ar:"مجلس العلاقات والشراكات الدولية",en:"International Relations Council",arDesc:"التعاون الجامعي والشراكات",enDesc:"University collaboration and partnerships",color:"#7fdff3"},
    {code:"quality",icon:"⬡",ar:"مجلس الجودة والنزاهة الأكاديمية",en:"Quality & Integrity Council",arDesc:"التحسين والرقابة الأكاديمية",enDesc:"Academic oversight and improvement",color:"#d2c1ff"},
    {code:"digital",icon:"✧",ar:"مجلس الذكاء الاصطناعي والتحول الرقمي",en:"AI & Digital Transformation Council",arDesc:"التعلم الذكي والتقنيات الجديدة",enDesc:"Intelligent learning and digital systems",color:"#a8ecb9"},
    {code:"humanitarian",icon:"♡",ar:"مجلس العمل الإنساني والاستدامة",en:"Humanitarian & Sustainability Council",arDesc:"دعم التعليم المجاني واستدامته",enDesc:"Sustaining free medical education",color:"#ffc390"}
  ];
  const kinds = [
    {value:"meeting",ar:"محضر اجتماع",en:"Meeting minutes"},
    {value:"decision",ar:"قرار",en:"Decision"},
    {value:"task",ar:"مهمة",en:"Task"},
    {value:"proposal",ar:"مقترح",en:"Proposal"},
    {value:"announcement",ar:"تعميم داخلي",en:"Internal notice"}
  ];
  const positions = [
    {value:"member",ar:"عضو",en:"Member"},
    {value:"chair",ar:"رئيس المجلس",en:"Chair"},
    {value:"vice_chair",ar:"نائب الرئيس",en:"Vice-chair"},
    {value:"secretary",ar:"مقرر المجلس",en:"Secretary"}
  ];
  const statuses = [
    {value:"draft",ar:"مسودة",en:"Draft"},
    {value:"open",ar:"مفتوح",en:"Open"},
    {value:"in_progress",ar:"قيد التنفيذ",en:"In progress"},
    {value:"approved",ar:"معتمد",en:"Approved"},
    {value:"closed",ar:"مغلق",en:"Closed"}
  ];
  const titles = {
    overview:["لوحة قيادة المجالس","Councils leadership dashboard"],
    records:["سجل أعمال المجالس","Councils work register"],
    compose:["إنشاء سجل جديد","Create council record"],
    members:["إدارة عضويات المجالس","Manage council members"],
    security:["أمان الحساب","Account security"],
    identity:["بطاقتي وشهادتي","My membership documents"]
  };
  const state = {db:null,user:null,profile:null,isAdmin:false,memberships:[],records:[],lang:"ar",tab:"overview",councilFilter:"all",authEpoch:0,loading:false,deepLinkApplied:false};
  const T = (ar,en) => state.lang === "ar" ? ar : en;
  const esc = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const codeName = code => {const c=councils.find(x=>x.code===code);return c?(state.lang==="ar"?c.ar:c.en):code;};
  const statusName = val => {const s=statuses.find(x=>x.value===val);return s?(state.lang==="ar"?s.ar:s.en):val;};
  const kindName = val => {const s=kinds.find(x=>x.value===val);return s?(state.lang==="ar"?s.ar:s.en):val;};
  const positionName = val => {const s=positions.find(x=>x.value===val);return s?(state.lang==="ar"?s.ar:s.en):val;};
  const ownMemberships = () => state.memberships.filter(m=>m.user_id===state.user?.id && m.active);
  const canAccess = code => state.isAdmin || ownMemberships().some(m=>m.council_code===code);
  const canReview = code => state.isAdmin || ownMemberships().some(m=>m.council_code===code && ["chair","vice_chair"].includes(m.position));
  const visibleCouncils = () => councils.filter(c=>canAccess(c.code));
  const displayDate = d => {try{return new Intl.DateTimeFormat(state.lang==="ar"?"ar-PS":"en-GB",{year:"numeric",month:"short",day:"numeric"}).format(new Date(d));}catch(_){return ""; }};

  function notice(message="",error=false,target="#workspace-message") {
    const el=$(target); if(!el)return;
    el.textContent=message;el.classList.toggle("error",error);el.classList.toggle("success",!!message&&!error);
  }
  function setLanguage(lang) {
    state.lang=lang==="en"?"en":"ar";
    document.documentElement.lang=state.lang;
    document.documentElement.dir=state.lang==="ar"?"rtl":"ltr";
    $$("#language").forEach(el=>el.textContent=state.lang==="ar"?"EN":"عربي");
    $$("[data-ar][data-en]").forEach(el=>{
      const value=el.getAttribute("data-"+state.lang);
      if(el.matches(".hero-copy h1"))el.innerHTML=value; // static trusted bilingual markup
      else el.textContent=value;
    });
    try{localStorage.setItem("nabdCouncilsLanguage",state.lang);}catch(_){}
    if(state.user){renderDashboard();setTab(state.tab);} else fillDate();
  }
  function fillDate() {$("#current-date").textContent=displayDate(new Date());}
  function setGate(message="",error=false){
    $("#gate").hidden=false;$("#workspace").hidden=true;
    $("#password").value="";
    notice(message,error,"#gate-message");
  }
  function setTab(tab) {
    if(tab==="members"&&!state.isAdmin)tab="overview";
    if(!Object.prototype.hasOwnProperty.call(titles,tab))tab="overview";
    state.tab=tab;
    $$(".view").forEach(el=>el.hidden=el.id!==tab+"-view");
    $$("[data-tab]").forEach(el=>{const active=el.dataset.tab===tab;el.classList.toggle("active",active);el.setAttribute("aria-current",active?"page":"false");});
    $("#view-title").textContent=T(...titles[tab]);
    if(tab==="records")renderRecords();
    if(tab==="members")renderMembers();
    if(tab==="identity")renderMemberDocuments();
  }
  function addOptions(selector,items,all=false) {
    const el=$(selector);if(!el)return;
    const old=el.value;el.textContent="";
    if(all){const op=document.createElement("option");op.value="all";op.textContent=T("كل المجالس","All councils");el.append(op);}
    items.forEach(item=>{const op=document.createElement("option");op.value=item.value;op.textContent=state.lang==="ar"?item.ar:item.en;el.append(op);});
    if(Array.from(el.options).some(o=>o.value===old))el.value=old;
  }
  function renderCouncilGrid(){
    const target=$("#council-grid");
    target.innerHTML=councils.map(c=>{
      const allowed=canAccess(c.code);
      const own=ownMemberships().find(m=>m.council_code===c.code);
      const councilName=state.lang==="ar"?c.ar:c.en;
      const summary=state.lang==="ar"?c.arDesc:c.enDesc;
      const label=allowed
        ? (state.isAdmin&&!own?T("إشراف الإدارة","Administration"):T("فتح المجلس","Open council"))
        : T("غير مكلّف","Restricted access");
      // Each council illustration is local, lightweight and decorative.
      // Records still load through authenticated Supabase requests with RLS.
      const art="assets/images/councils/"+c.code+".svg";
      return '<button type="button" class="council-card" style="--accent:'+c.color+'" '
        +(allowed?'data-council="'+c.code+'"':'disabled aria-disabled="true"')
        +' aria-label="'+esc(councilName+(allowed?"":T(" - دخول مقيد"," - Restricted")))+'">'
        +'<span class="council-art" aria-hidden="true"><img loading="lazy" decoding="async" width="760" height="340" alt="" src="'+art+'"></span>'
        +'<div class="council-content"><span class="council-icon" aria-hidden="true">'+esc(c.icon)+'</span>'
        +'<div class="council-text"><h3>'+esc(councilName)+'</h3><p>'+esc(summary)+'</p>'
        +'<span class="council-foot">'+esc(label)+' <span aria-hidden="true">←</span></span></div></div>'
        +'<span class="council-arrow" aria-hidden="true">‹</span>'
        +'</button>';
    }).join("");
    $$("[data-council]").forEach(btn=>btn.addEventListener("click",()=>{
      state.councilFilter=btn.dataset.council;
      $("#filter-council").value=state.councilFilter;
      setTab("records");
    }));
  }
  function renderMemberDocuments(){
    const root=$("#identity-list");
    const mine=ownMemberships();
    if(!mine.length){
      root.innerHTML='<div class="empty-card">'+esc(T("لا توجد عضويات نشطة باسم هذا الحساب. يدير المدير إصدار بطاقات الأعضاء من لوحة المدير.","This account has no active council memberships. Directors can issue member documents from the director dashboard."))+'</div>';
      return;
    }
    root.innerHTML=mine.map(m=>{
      const href="council-documents.html?member="+encodeURIComponent(state.user.id)+"&council="+encodeURIComponent(m.council_code);
      return '<article class="record-card"><div class="record-heading"><span class="kind-tag">'+esc(codeName(m.council_code))+'</span><span class="status-tag">'+esc(positionName(m.position))+'</span></div>'
        +'<h3 class="member-identity-number" dir="ltr">'+esc(m.member_code||"—")+'</h3>'
        +'<p>'+esc(T("هذه عضويتك الرسمية في المجلس، ويمكن التحقق من تكليفك عبر QR.","This is your institutional council appointment, verifiable through a QR code."))+'</p>'
        +'<a class="member-identity-link" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(T("فتح البطاقة وشهادة التكليف ↗","Open membership card and certificate ↗"))+'</a></article>';
    }).join("");
  }
  function renderStats(){
    // Show real active appointments, not the number of councils available to admins.
    const count=state.isAdmin
      ? state.memberships.filter(m=>m.active).length
      : ownMemberships().length;
    $("#stat-memberships").textContent=String(count);
    $("#stat-memberships-label").textContent=state.isAdmin
      ? T("العضويات النشطة","Active appointments")
      : T("عضوياتك النشطة","Your active appointments");
    $("#stat-records").textContent=String(state.records.length);
    $("#stat-tasks").textContent=String(state.records.filter(r=>r.kind==="task"&&["open","in_progress"].includes(r.status)).length);
  }
  function recordMarkup(r) {
    const canEdit=canReview(r.council_code);
    const options=statuses.map(s=>'<option value="'+s.value+'" '+(r.status===s.value?"selected":"")+'>'+esc(state.lang==="ar"?s.ar:s.en)+'</option>').join("");
    return '<article class="record-card"><div class="record-head"><div class="record-heading"><span class="kind-tag">'+esc(kindName(r.kind))+'</span><span class="status-tag">'+esc(statusName(r.status))+'</span></div><span class="record-meta">'+esc(displayDate(r.created_at))+'</span></div><h3>'+esc(r.title)+'</h3><div class="record-meta"><span>'+esc(codeName(r.council_code))+'</span>'+(r.due_at?'<span>◷ '+esc(displayDate(r.due_at))+'</span>':"")+'</div>'+(r.body?'<p>'+esc(r.body)+'</p>':"")+(canEdit?'<div class="status-editor"><label class="sr-only" for="status-'+esc(r.id)+'">'+esc(T("حالة السجل","Record status"))+'</label><select id="status-'+esc(r.id)+'" data-status-select="'+esc(r.id)+'">'+options+'</select><button type="button" data-save-status="'+esc(r.id)+'">'+esc(T("اعتماد التغيير","Save status"))+'</button></div>':"")+'</article>';
  }
  function recordsHtml(rows) {
    return rows.length?rows.map(recordMarkup).join(""):'<div class="empty-card">'+esc(T("لا توجد سجلات ضمن هذا الاختيار بعد.","There are no records for this selection yet."))+'</div>';
  }
  function wireStatusButtons(scope){
    scope.querySelectorAll("[data-save-status]").forEach(btn=>btn.addEventListener("click",()=>saveStatus(btn.dataset.saveStatus)));
  }
  function renderRecent(){
    const el=$("#recent-list");
    el.innerHTML=recordsHtml(state.records.slice(0,4));
    wireStatusButtons(el);
  }
  function renderRecords(){
    const search=$("#record-search").value.trim().toLowerCase();
    const code=$("#filter-council").value||state.councilFilter;
    const kind=$("#filter-kind").value||"all";
    const list=state.records.filter(r=>(code==="all"||r.council_code===code)&&(kind==="all"||r.kind===kind)&&(!search||(r.title+" "+r.body+" "+codeName(r.council_code)).toLowerCase().includes(search)));
    const el=$("#records-list");el.innerHTML=recordsHtml(list);wireStatusButtons(el);
  }
  function renderMembers(){
    const el=$("#members-list");
    if(!state.isAdmin){el.textContent="";return;}
    const rows=state.memberships.slice().sort((a,b)=>a.council_code.localeCompare(b.council_code));
    el.innerHTML=rows.length?rows.map(m=>'<article class="record-card member-entry"><div><div class="record-heading"><span class="kind-tag">'+esc(codeName(m.council_code))+'</span><span class="status-tag">'+esc(positionName(m.position))+'</span></div><h3 class="member-id">'+esc(m.user_id)+'</h3><p class="record-meta">'+esc(m.active?T("عضوية نشطة","Active"):T("عضوية معلقة","Suspended"))+'</p></div><div class="membership-actions"><button data-toggle-member="'+esc(m.user_id)+'" data-toggle-council="'+esc(m.council_code)+'" data-next-active="'+(!m.active)+'">'+esc(m.active?T("تعليق","Suspend"):T("تفعيل","Activate"))+'</button></div></article>').join(""):'<div class="empty-card">'+esc(T("لم يتم تكليف أعضاء حتى الآن.","No appointments have been made yet."))+'</div>';
    el.querySelectorAll("[data-toggle-member]").forEach(btn=>btn.addEventListener("click",()=>toggleMember(btn)));
  }
  function renderDashboard(){
    if(!state.user)return;
    $("#account-name").textContent=state.profile?.full_name||state.user.email||T("عضو نبض","NABD member");
    $("#account-role").textContent=state.isAdmin?T("إدارة الأكاديمية","Academy administrator"):T("عضو مجلس معتمد","Approved council member");
    $("#membership-tab-button").hidden=!state.isAdmin;
    $("#current-date").textContent=displayDate(new Date());
    addOptions("#filter-council",visibleCouncils().map(c=>({value:c.code,ar:c.ar,en:c.en})),true);
    if($("#filter-council").querySelector('option[value="'+state.councilFilter+'"]'))$("#filter-council").value=state.councilFilter;
    else state.councilFilter="all";
    addOptions("#new-council",visibleCouncils().map(c=>({value:c.code,ar:c.ar,en:c.en})));
    addOptions("#member-council",councils.map(c=>({value:c.code,ar:c.ar,en:c.en})));
    addOptions("#filter-kind",kinds,true);
    addOptions("#new-kind",kinds);
    addOptions("#member-position",positions);
    renderStats();renderCouncilGrid();renderRecent();renderRecords();renderMembers();
  }
  async function loadRecords(epoch){
    const {data,error}=await state.db.from("nabd_council_records").select("id,council_code,kind,title,body,status,due_at,created_by,created_at").order("created_at",{ascending:false}).limit(200);
    if(epoch!==state.authEpoch)return;
    if(error){notice(T("تعذر تحميل سجلات المجالس. راجع الاتصال والصلاحيات.","Could not load council records. Check the connection and permissions."),true);state.records=[];return;}
    state.records=data||[];
    renderDashboard();
  }
  async function loadMembers(epoch){
    const {data,error}=await state.db.from("nabd_council_memberships").select("user_id,council_code,position,active,appointed_at,member_code").order("appointed_at",{ascending:false});
    if(epoch!==state.authEpoch)return false;
    if(error){notice(T("تعذر التحقق من العضوية. الدخول محجوب.","Membership verification failed. Access is blocked."),true,"#gate-message");return false;}
    state.memberships=data||[];
    return true;
  }
  async function verifyAccess(){
    const epoch=++state.authEpoch;
    // Never display records retained from a previous account while a new session is checked.
    state.user=null;state.profile=null;state.isAdmin=false;state.memberships=[];state.records=[];
    $("#gate").hidden=false;$("#workspace").hidden=true;
    notice(T("جارٍ التحقق من الحساب والعضوية...","Verifying account and membership..."),false,"#gate-message");
    if(!state.db){setGate(T("الاتصال الآمن غير متاح حاليًا. حاول لاحقًا.","Secure service is unavailable. Please try again later."),true);return;}
    try{
      const {data:auth,error:authError}=await state.db.auth.getUser();
      if(epoch!==state.authEpoch)return;
      if(authError||!auth?.user){state.user=null;state.profile=null;state.memberships=[];state.records=[];state.isAdmin=false;setGate();return;}
      const user=auth.user;
      const [profileResponse,adminResponse]=await Promise.all([
        state.db.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle(),
        state.db.rpc("is_admin")
      ]);
      if(epoch!==state.authEpoch)return;
      state.user=user;
      state.profile=profileResponse.error?null:profileResponse.data;
      state.isAdmin=adminResponse.data===true || state.profile?.role==="admin";
      const checked=await loadMembers(epoch);
      if(epoch!==state.authEpoch||!checked)return;
      if(!state.isAdmin&&!ownMemberships().length){
        state.records=[];
        setGate(T("الحساب صحيح، لكن ليس لديه تكليف فعّال في مجالس نبض. تواصل مع الإدارة للحصول على قرار عضوية.","Signed in, but this account has no active NABD council appointment. Contact the administration."),true);
        return;
      }
      // A council link routes the member only after authorization; it never grants access.
      if(!state.deepLinkApplied){
        const direct=new URLSearchParams(location.search).get("council");
        if(direct && councils.some(c=>c.code===direct) && canAccess(direct)){
          state.councilFilter=direct;
          state.tab="records";
        } else if(!state.isAdmin && ownMemberships().length===1) {
          state.councilFilter=ownMemberships()[0].council_code;
          state.tab="records";
        }
        state.deepLinkApplied=true;
      }
      $("#gate").hidden=true;$("#workspace").hidden=false;
      notice("");
      renderDashboard();
      setTab(state.tab);
      await loadRecords(epoch);
    }catch(_){
      if(epoch===state.authEpoch){state.user=null;state.records=[];setGate(T("تعذر إتمام التحقق الآمن. أعد المحاولة.","Secure verification failed. Please retry."),true);}
    }
  }
  async function login(event){
    event.preventDefault();
    if(state.loading||!state.db)return;
    const email=$("#email").value.trim(),password=$("#password").value;
    if(!email||!password)return;
    state.loading=true;$("#login-submit").disabled=true;
    notice(T("جارٍ تسجيل الدخول...","Signing in..."),false,"#gate-message");
    try{
      const {error}=await state.db.auth.signInWithPassword({email,password});
      $("#password").value="";
      if(error){notice(T("تعذر تسجيل الدخول. تحقق من بيانات الحساب.","Sign-in failed. Check your account details."),true,"#gate-message");return;}
      await verifyAccess();
    }catch(_){notice(T("حدث خطأ في الاتصال. حاول مجددًا.","Network error. Try again."),true,"#gate-message");}
    finally{state.loading=false;$("#login-submit").disabled=false;$("#password").value="";}
  }
  async function saveRecord(event){
    event.preventDefault();if(!state.user||!state.db)return;
    const council_code=$("#new-council").value,kind=$("#new-kind").value,title=$("#new-title").value.trim(),body=$("#new-body").value.trim(),due_at=$("#new-due").value||null;
    if(!canAccess(council_code)||!kinds.some(k=>k.value===kind)||title.length<3||title.length>180||body.length>6000){notice(T("تحقق من بيانات السجل وصلاحية المجلس.","Check the record fields and your council permissions."),true);return;}
    const button=$("#save-record");button.disabled=true;notice(T("جارٍ حفظ السجل...","Saving the record..."));
    try{
      const {error}=await state.db.from("nabd_council_records").insert({council_code,kind,title,body,due_at,created_by:state.user.id,status:"open"});
      if(error){notice(T("تعذر حفظ السجل. قد تكون الصلاحية قد تغيّرت.","Could not save record. Your permissions may have changed."),true);return;}
      $("#record-form").reset();
      notice(T("تم حفظ السجل بنجاح.","Record saved successfully."));
      await loadRecords(state.authEpoch);
      setTab("records");
    }catch(_){notice(T("تعذر الاتصال أثناء الحفظ.","Connection failed while saving."),true);}finally{button.disabled=false;}
  }
  async function saveStatus(id){
    const r=state.records.find(x=>x.id===id);
    const select=$("#status-"+id);if(!r||!select||!canReview(r.council_code))return;
    const status=select.value;if(!statuses.some(s=>s.value===status))return;
    notice(T("جارٍ تحديث حالة السجل...","Updating record status..."));
    try{
      const {data,error}=await state.db.from("nabd_council_records").update({status}).eq("id",id).select("id");
      if(error||!data?.length){notice(T("لم يُسمح بالتحديث أو تغيّرت الصلاحيات.","The update was denied or permissions changed."),true);return;}
      notice(T("حُدّثت حالة السجل.","Record status updated."));
      await loadRecords(state.authEpoch);
    }catch(_){notice(T("فشل التحديث. أعد المحاولة.","Update failed. Please retry."),true);}
  }
  async function addMember(event){
    event.preventDefault();if(!state.isAdmin||!state.user)return;
    const user_id=$("#member-user-id").value.trim(),council_code=$("#member-council").value,position=$("#member-position").value;
    if(!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(user_id)||!councils.some(c=>c.code===council_code)||!positions.some(p=>p.value===position)){notice(T("تحقق من معرّف المستخدم والمجلس.","Check the user UUID and council selection."),true);return;}
    const btn=$("#save-member");btn.disabled=true;
    try{
      const {error}=await state.db.from("nabd_council_memberships").insert({user_id,council_code,position,active:true});
      if(error){notice(T("تعذر تعيين العضوية. قد تكون مكررة، أو أن الحساب غير موجود.","Appointment failed. It may already exist or the account ID is invalid."),true);return;}
      $("#member-form").reset();notice(T("تم اعتماد العضوية.","Membership approved."));
      await verifyAccess();setTab("members");
    }catch(_){notice(T("تعذر الاتصال أثناء التكليف.","Connection failed while appointing member."),true);}finally{btn.disabled=false;}
  }
  async function toggleMember(btn){
    if(!state.isAdmin)return;
    const user_id=btn.dataset.toggleMember,council_code=btn.dataset.toggleCouncil,active=btn.dataset.nextActive==="true";
    btn.disabled=true;
    try{
      const {data,error}=await state.db.from("nabd_council_memberships").update({active}).eq("user_id",user_id).eq("council_code",council_code).select("user_id");
      if(error||!data?.length){notice(T("تعذر تحديث العضوية.","Could not update membership."),true);return;}
      notice(T("تم تعديل حالة العضوية.","Membership status changed."));
      await verifyAccess();setTab("members");
    }catch(_){notice(T("تعذر الاتصال أثناء تعديل العضوية.","Connection failed while changing membership."),true);}finally{btn.disabled=false;}
  }
  async function changePassword(event){
    event.preventDefault();
    if(!state.user||!state.db)return;
    const next=$("#security-password").value;
    const confirm=$("#security-confirm").value;
    if(next!==confirm){notice(T("كلمتا المرور غير متطابقتين.","Passwords do not match."),true);return;}
    if(next.length<12||!/[A-Z]/.test(next)||!/[a-z]/.test(next)||!/[0-9]/.test(next)){
      notice(T("استخدم 12 حرفًا على الأقل مع حرف كبير وصغير ورقم.","Use at least 12 characters with uppercase, lowercase and a number."),true);return;
    }
    const button=$("#security-save");button.disabled=true;
    try{
      const {error}=await state.db.auth.updateUser({password:next});
      if(error)throw error;
      $("#security-form").reset();
      notice(T("تم تحديث كلمة المرور. لا تشاركها مع أي شخص.","Your password was updated. Keep it private."));
    }catch(_){notice(T("لم يتم تغيير كلمة المرور. حاول مرة أخرى.","Password change failed. Please try again."),true);}
    finally{button.disabled=false;}
  }
  async function signOut(){
    ++state.authEpoch;
    state.deepLinkApplied=false;
    $("#workspace").hidden=true;
    state.user=null;state.profile=null;state.isAdmin=false;state.memberships=[];state.records=[];
    try{await state.db?.auth.signOut();}catch(_){}
    setGate(T("تم إغلاق مساحة العمل على هذا الجهاز.","Workspace closed on this device."));
  }
  function init(){
    state.db=window.nabdSupabase||null;
    try{const saved=localStorage.getItem("nabdCouncilsLanguage");if(saved==="ar"||saved==="en")state.lang=saved;}catch(_){}
    setLanguage(state.lang);
    $("#login-form").addEventListener("submit",login);
    $("#record-form").addEventListener("submit",saveRecord);
    $("#security-form").addEventListener("submit",changePassword);
    $("#member-form").addEventListener("submit",addMember);
    $("#language").addEventListener("click",()=>setLanguage(state.lang==="ar"?"en":"ar"));
    $("#signout").addEventListener("click",signOut);
    $("#refresh").addEventListener("click",verifyAccess);
    $$("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>setTab(btn.dataset.tab)));
    $("#filter-council").addEventListener("change",()=>{state.councilFilter=$("#filter-council").value;renderRecords();});
    $("#filter-kind").addEventListener("change",renderRecords);
    $("#record-search").addEventListener("input",renderRecords);
    document.addEventListener("visibilitychange",()=>{if(!document.hidden&&state.user)verifyAccess();});
    if(state.db){
      state.db.auth.onAuthStateChange((event)=>{
        if(["SIGNED_IN","SIGNED_OUT","USER_UPDATED"].includes(event)){
          Promise.resolve().then(()=>verifyAccess());
        }
      });
    }
    verifyAccess();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
