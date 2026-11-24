/* NABD Scholarships Centre v1 — secured with Supabase Auth + PostgreSQL RLS */
(function(){
  "use strict";
  const home = document.querySelector("[data-scholarship-home]");
  const listings = document.querySelector("[data-scholarship-list]");
  const manager = document.querySelector("[data-scholarship-manager]");
  /* Keep the staff session separate from student/academy sessions. */
  const cfg = window.NABD_CONFIG || {};
  function initClient(){
    if(!manager)return window.nabdSupabase;
    if(!window.supabase?.createClient||!cfg.supabaseUrl||!cfg.supabaseAnonKey)return null;
    try{
      return window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{
        storageKey:"nabd-scholarships-manager-auth-v1",persistSession:true,
        autoRefreshToken:true,detectSessionInUrl:true
      }});
    }catch{return null}
  }
  const client=initClient();
  if (!home && !listings && !manager) return;

  const dateText = value => {
    try { return new Intl.DateTimeFormat("ar-PS",{year:"numeric",month:"short",day:"numeric"}).format(new Date(value)); }
    catch (_) { return ""; }
  };
  const safeUrl = raw => {
    try { const url = new URL(raw); return ["https:","http:"].includes(url.protocol) ? url.href : null; }
    catch (_) { return null; }
  };
  const setStatus = (el, message, kind) => {
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
    el.classList.remove("error","success");
    if (kind) el.classList.add(kind);
  };
  function card(item, compact) {
    const article = document.createElement("article");
    article.className = "sch-card";
    const label = document.createElement("span");
    label.className = "sch-card-label";
    label.textContent = "NABD · INTERNATIONAL SCHOLARSHIPS";
    const title = document.createElement("h3");
    title.textContent = item.title;
    const description = document.createElement("p");
    description.className = "sch-card-desc";
    const text = item.description || "";
    description.textContent = compact && text.length > 240 ? text.slice(0,240) + "…" : text;
    const time = document.createElement("time");
    time.dateTime = item.published_at;
    time.textContent = "نُشرت في " + dateText(item.published_at);
    const url = safeUrl(item.application_url);
    article.append(label,title,description,time);
    if (url) {
      const link = document.createElement("a");
      link.className = "sch-btn sch-btn--gold";
      link.href = url; link.target="_blank"; link.rel="noopener noreferrer nofollow";
      link.textContent = "رابط التقديم ↗";
      link.setAttribute("aria-label","التقديم إلى " + item.title + " (يفتح موقعًا خارجيًا)");
      article.append(link);
    }
    return article;
  }
  let publishedCache = null;
  let nextRefresh = 0;
  let lastAppliedRefresh = 0;
  async function fetchPublished() {
    if (!client) {
      if (home) home.textContent = "خدمة أخبار المنح غير متاحة حاليًا.";
      if (listings) {
        listings.replaceChildren();
        setStatus(document.getElementById("sch-public-status"),"تعذر الاتصال بخدمة المنح.", "error");
      }
      return;
    }
    const request = ++nextRefresh;
    let rows;
    try {
      const {data,error} = await client.from("nabd_scholarship_opportunities")
        .select("id,title,description,application_url,published_at")
        .eq("status","published").order("published_at",{ascending:false}).limit(100);
      if (error) throw error;
      rows = data || [];
    } catch {
      if (request < lastAppliedRefresh) return;
      lastAppliedRefresh = request;
      const message = "تعذر تحديث فرص المنح. يرجى إعادة المحاولة لاحقًا.";
      if (home) setStatus(document.getElementById("sch-home-status"),message,"error");
      if (listings) {
        if (publishedCache === null) listings.replaceChildren();
        setStatus(document.getElementById("sch-public-status"),message,"error");
      }
      return;
    }
    if (request < lastAppliedRefresh) return;
    lastAppliedRefresh = request;
    publishedCache = rows;
    if (home) {
      home.replaceChildren();
      if (!publishedCache.length) {
        const message=document.createElement("p");message.className="sch-home-empty";
        message.textContent="لم تُنشر فرص بعد. ستظهر الإعلانات الجديدة هنا فور نشرها.";
        home.append(message);
      } else {
        publishedCache.slice(0,3).forEach(x=>home.append(card(x,true)));
      }
      setStatus(document.getElementById("sch-home-status"),"");
    }
    if (listings) {
      setStatus(document.getElementById("sch-public-status"),"");
      renderPublicList();
    }
  }
  function renderPublicList() {
    if(!listings || publishedCache === null) return;
    const normalizeSearch = value => String(value ?? "").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g,"").replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/\s+/g," ").trim();
    const search=normalizeSearch((document.getElementById("sch-search")?.value || ""));
    const filtered=publishedCache.filter(x=>search.split(" ").every(word=>normalizeSearch((x.title||"")+" "+(x.description||"")).includes(word)));
    listings.replaceChildren();
    if (!filtered.length) {
      const empty=document.createElement("div");
      empty.className="sch-alert";
      empty.textContent=search ? "لا توجد نتائج مطابقة." : "لم تنشر فرص بعد. راجع هذه الصفحة قريبًا.";
      listings.append(empty);
    } else filtered.forEach(x=>listings.append(card(x,false)));
    const count=document.getElementById("sch-results-count");
    if(count)count.textContent=filtered.length+" فرصة";
  }
  if (home || listings) {
    document.getElementById("sch-search")?.addEventListener("input",renderPublicList);
    if (listings) window.addEventListener("online", () => { if (!document.hidden) fetchPublished(); });
    fetchPublished();
    // Live database notifications refresh newly published scholarships without a reload.
    // Visibility changes and periodic checks are fallbacks for slow/disconnected networks.
    if (client && typeof client.channel === "function") {
      client.channel("nabd-public-scholarship-news-v2")
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "nabd_scholarship_opportunities"
        }, () => { if (!document.hidden) fetchPublished(); })
        .subscribe();
    }
    const cadence = 30000;
    setInterval(()=>{if(!document.hidden)fetchPublished()},cadence);
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)fetchPublished()});
    window.addEventListener("storage",e=>{
      if (e.key==="nabd-scholarship-news-updated" && !document.hidden) fetchPublished();
    });
  }

  if (!manager) return;
  if(!client){
    const form=document.getElementById("sch-login-form");
    form?.addEventListener("submit",e=>e.preventDefault());
    document.getElementById("sch-login-button").disabled=true;
    document.getElementById("sch-reset-password").disabled=true;
    setStatus(document.getElementById("sch-auth-status"),
      "تعذّر تهيئة دخول مدير المنح. تحقّق من الاتصال وأعد تحميل الصفحة.","error");
    return;
  }
  const loginPanel = document.getElementById("sch-login-panel");
  const dashboard = document.getElementById("sch-dashboard");
  const loginForm = document.getElementById("sch-login-form");
  const publishForm = document.getElementById("sch-publish-form");
  const authStatus = document.getElementById("sch-auth-status");
  const publishStatus = document.getElementById("sch-publish-status");
  const posts = document.getElementById("sch-managed-posts");
  const draftStatus=document.getElementById("sch-draft-status");
  const discardDraft=document.getElementById("sch-discard-draft");
  const editId=document.getElementById("sch-edit-id");
  const submitButton=document.getElementById("sch-submit");
  const cancelEdit=document.getElementById("sch-cancel-edit");
  const editorFields=["sch-title","sch-description","sch-url"].map(id=>document.getElementById(id));
  let signedInUser = null;
  let ownItems = [];
  let ownPostsRequest = 0;
  let draft=null,savedDraft=null,submitting=false;
  const draftKey=userId=>"nabd-scholarship-manager-draft-v1:"+userId;
  function loadDraft(userId){
    draft=null;savedDraft=null;
    try{
      const raw=localStorage.getItem(draftKey(userId)),values=JSON.parse(raw);
      if(Array.isArray(values)&&values.length===editorFields.length&&
        values.every((value,index)=>typeof value==="string"&&value.length<=editorFields[index].maxLength)&&
        values.some(value=>value.trim())){draft=values;savedDraft=raw;}
    }catch{}
  }
  function clearDraft(userId,expected){
    try{
      if(expected===null)return true;
      const key=draftKey(userId);
      if(localStorage.getItem(key)!==expected)return false;
      localStorage.removeItem(key);return true;
    }catch{return false}
  }
  function showDraftStatus(message){
    if(discardDraft)discardDraft.hidden=!draft||!!editId.value;
    setStatus(draftStatus,editId.value?"":message);
  }
  function saveDraft(){
    if(!signedInUser||editId.value||submitting)return;
    const values=editorFields.map(field=>field.value),uid=signedInUser.id;
    if(!values.some(value=>value.trim())){
      const cleared=clearDraft(uid,savedDraft);
      if(cleared){draft=null;savedDraft=null;showDraftStatus("");}
      else showDraftStatus("تعذّر حذف المسودة من جهازك.");
      return;
    }
    draft=values;
    try{
      const serialized=JSON.stringify(values);
      localStorage.setItem(draftKey(uid),serialized);
      savedDraft=serialized;
      showDraftStatus("حُفظت المسودة على هذا الجهاز لهذا الحساب.");
    }catch{showDraftStatus("تعذّر الحفظ المحلي. أبقِ الصفحة مفتوحة للاحتفاظ بالمحتوى.");}
  }
  let verification=0;
  const roleRetry=document.getElementById("sch-retry-role");
  const logoutRetry=document.getElementById("sch-retry-logout");
  const showLogin = () => {
    signedInUser=null;draft=null;savedDraft=null;
    ownItems=[];ownPostsRequest++;
    posts.replaceChildren();
    resetEditor();
    document.getElementById("sch-current-email").textContent="";
    setStatus(publishStatus,"");
    loginPanel.hidden=false;
    dashboard.hidden=true;
  };
  async function verifyPublisher(){
    const request=++verification;
    try{
      const auth=await client.auth.getUser();
      if(request!==verification)return;
      if(auth.error)throw auth.error;
      const user=auth.data?.user;
      if(!user){showLogin();roleRetry.hidden=true;return;}
      const {data:role,error:roleError}=await client.from("nabd_scholarship_publishers")
        .select("active").eq("user_id",user.id).maybeSingle();
      if(request!==verification)return;
      if(roleError)throw roleError;
      if(!role?.active){
        showLogin();roleRetry.hidden=true;
        try{await client.auth.signOut();}catch{}
        setStatus(authStatus,"الحساب غير مخوّل لإدارة المنح. اطلب من الإدارة تفعيل الصلاحية.","error");
        return;
      }
      if(signedInUser?.id!==user.id){
        ownItems=[];posts.replaceChildren();
        loadDraft(user.id);
        resetEditor();
      }
      signedInUser=user;
      roleRetry.hidden=true;logoutRetry.hidden=true;
      loginPanel.hidden=true;dashboard.hidden=false;
      setStatus(authStatus,"");
      document.getElementById("sch-current-email").textContent=user.email||"";
      await refreshOwnPosts();
    }catch{
      if(request!==verification)return;
      showLogin();roleRetry.hidden=false;
      setStatus(authStatus,"تعذّر التحقق من صلاحية مدير المنح. تحقق من الاتصال ثم أعد المحاولة.","error");
    }
  }
  roleRetry?.addEventListener("click",()=>verifyPublisher());
  loginForm?.addEventListener("submit",async(e)=>{
    e.preventDefault();
    const email=document.getElementById("sch-email").value.trim();
    const field=document.getElementById("sch-password"),password=field.value;
    const button=document.getElementById("sch-login-button");
    if(button.disabled||!email||!password)return;
    button.disabled=true;
    setStatus(authStatus,"جارٍ التحقق من الحساب…");
    try{
      const {error}=await client.auth.signInWithPassword({email,password});
      if(error)throw error;
      await verifyPublisher();
    }catch{
      setStatus(authStatus,"لم يكتمل تسجيل الدخول. راجع البيانات والاتصال ثم حاول مجددًا.","error");
    }finally{field.value="";button.disabled=false;}
  });
  const resetButton=document.getElementById("sch-reset-password");
  resetButton?.addEventListener("click",async()=>{
    if(resetButton.disabled)return;
    const email=document.getElementById("sch-email").value.trim();
    if(!email){setStatus(authStatus,"أدخل البريد الإلكتروني أولًا لطلب الاستعادة.","error");return;}
    resetButton.disabled=true;
    try{
      const redirectTo=new URL("scholarship-manager.html",location.href).href;
      const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});
      if(error)throw error;
      setStatus(authStatus,"إذا كان البريد مسجلًا فستصله رسالة استعادة كلمة المرور.","success");
    }catch{setStatus(authStatus,"تعذّر تأكيد إرسال رابط الاستعادة. تحقق من البريد والاتصال ثم حاول مجددًا.","error")}
    finally{resetButton.disabled=false;}
  });
  async function signOutManager(){
    ++verification;
    showLogin();logoutRetry.hidden=true;roleRetry.hidden=true;
    try{
      const {error}=await client.auth.signOut();
      if(error)throw error;
      publishForm?.reset();
      setStatus(authStatus,"تم تسجيل الخروج.","success");
    }catch{
      logoutRetry.hidden=false;
      setStatus(authStatus,"تعذّر تأكيد تسجيل الخروج. أعد المحاولة قبل ترك الجهاز.","error");
    }
  }
  logoutRetry?.addEventListener("click",()=>signOutManager());
  document.getElementById("sch-logout")?.addEventListener("click",()=>signOutManager());
  function editItem(item) {
    if(submitting||!signedInUser)return;
    editId.value=item.id;
    document.getElementById("sch-title").value=item.title;
    document.getElementById("sch-description").value=item.description;
    document.getElementById("sch-url").value=item.application_url;
    document.getElementById("sch-submit").textContent="حفظ التعديلات";
    cancelEdit.hidden=false;
    showDraftStatus("");
    setStatus(publishStatus,"تعديل إعلان موجود. احفظ التغييرات أو اضغط إلغاء.");
    publishForm.scrollIntoView({behavior:"smooth",block:"start"});
    document.getElementById("sch-title").focus();
  }
  function resetEditor(){
    publishForm.reset();
    editId.value="";
    submitButton.textContent="نشر المنحة الآن";
    cancelEdit.hidden=true;
    if(draft)editorFields.forEach((field,index)=>{field.value=draft[index]});
    showDraftStatus(draft
      ?(savedDraft===JSON.stringify(draft)?"استُعيدت مسودة محفوظة على هذا الجهاز.":"المسودة في هذه الصفحة فقط.")
      :"");
  }
  cancelEdit.addEventListener("click",()=>{if(!submitting){resetEditor();setStatus(publishStatus,"")}});
  publishForm.addEventListener("input",saveDraft);
  discardDraft?.addEventListener("click",()=>{
    if(!signedInUser||submitting||editId.value||!draft)return;
    if(!window.confirm("هل تريد حذف مسودة الإعلان من هذا الجهاز؟"))return;
    if(!clearDraft(signedInUser.id,savedDraft)){
      showDraftStatus("تعذّر حذف المسودة المحفوظة من الجهاز.");return;
    }
    draft=null;savedDraft=null;resetEditor();setStatus(publishStatus,"");
    editorFields[0].focus();
  });
  async function refreshOwnPosts(){
    const owner=signedInUser;
    if(!owner)return;
    const request = ++ownPostsRequest;
    let rows;
    try {
      const {data,error}=await client.from("nabd_scholarship_opportunities")
        .select("id,title,description,application_url,status,published_at")
        .eq("published_by",owner.id).order("published_at",{ascending:false}).limit(100);
      if(error)throw error;
      rows=data||[];
    } catch {
      if(request===ownPostsRequest && owner===signedInUser){
        setStatus(publishStatus,"تعذر تحميل قائمة الإعلانات.","error");
      }
      return;
    }
    if(request!==ownPostsRequest || owner!==signedInUser)return;
    ownItems=rows;
    posts.replaceChildren();
    if(!ownItems.length){
      const p=document.createElement("p");p.textContent="لم تنشر أي فرصة حتى الآن.";posts.append(p);return;
    }
    ownItems.forEach(item=>{
      const row=document.createElement("div");row.className="sch-manage-item";
      const info=document.createElement("div");
      const name=document.createElement("strong");name.textContent=item.title;
      const sub=document.createElement("small");sub.textContent=(item.status==="published"?"منشورة":"مؤرشفة")+" · "+dateText(item.published_at);
      info.append(name,sub);
      const actions=document.createElement("div");actions.className="sch-manage-actions";
      const edit=document.createElement("button");edit.type="button";edit.textContent="تعديل";edit.addEventListener("click",()=>editItem(item));
      const archive=document.createElement("button");archive.type="button";archive.textContent=item.status==="published"?"أرشفة":"إعادة نشر";
      archive.addEventListener("click",async()=>{
        if(archive.disabled || owner!==signedInUser)return;
        archive.disabled=true;
        const next=item.status==="published"?"archived":"published";
        try{
          const {data:changed,error}=await client.from("nabd_scholarship_opportunities")
            .update({status:next,updated_at:new Date().toISOString()})
            .eq("id",item.id).eq("published_by",owner.id).eq("status",item.status)
            .select("id,status").maybeSingle();
          if(owner!==signedInUser)return;
          if(error)throw error;
          if(changed?.id===item.id && changed.status===next){
            setStatus(publishStatus,next==="archived"?"تمت أرشفة الفرصة وإخفاؤها عن الجمهور.":"أعيد نشر الفرصة بنجاح.","success");
          }else{
            setStatus(publishStatus,"تغيّرت حالة الإعلان أو لم يعد متاحًا. راجع القائمة المحدّثة قبل إعادة المحاولة.","error");
          }
          await refreshOwnPosts();
        }catch{
          if(owner===signedInUser)setStatus(publishStatus,"تعذر تأكيد حالة الإعلان. أعد تحميل القائمة للتحقق منها.","error");
        }finally{
          archive.disabled=false;
        }
      });
      actions.append(edit,archive);row.append(info,actions);posts.append(row);
    });
  }
  publishForm?.addEventListener("submit",async(e)=>{
    e.preventDefault();
    if(!signedInUser||submitting)return;
    const owner=signedInUser,uid=owner.id;
    const title=editorFields[0].value.trim(),description=editorFields[1].value.trim();
    const application_url=editorFields[2].value.trim(),id=editId.value;
    if(title.length<3||title.length>180||description.length<10||description.length>12000||!safeUrl(application_url)){
      setStatus(publishStatus,"تحقق من عنوان المنحة، والتفاصيل، ورابط التقديم الرسمي.","error");return;
    }
    if(!id)saveDraft();
    const expectedDraft=savedDraft;
    submitting=true;
    const controls=[submitButton,cancelEdit,discardDraft].filter(Boolean);
    controls.forEach(button=>button.disabled=true);
    editorFields.forEach(field=>field.readOnly=true);
    setStatus(publishStatus,"جارٍ حفظ الإعلان…");
    const values={title,description,application_url,updated_at:new Date().toISOString()};
    let confirmed=false;
    try{
      const request=id
        ?client.from("nabd_scholarship_opportunities").update(values).eq("id",id).eq("published_by",uid)
        :client.from("nabd_scholarship_opportunities").insert({...values,published_by:uid,status:"published"});
      const {data,error}=await request.select("id").single();
      if(error||!data?.id)throw error||Error("Not confirmed");
      confirmed=true;
    }catch{
      if(signedInUser?.id===uid)setStatus(publishStatus,
        "تعذّر تأكيد الحفظ؛ احتفظنا بالنص. راجع قائمة إعلاناتك قبل إعادة المحاولة عند عودة الاتصال.","error");
    }finally{
      submitting=false;
      controls.forEach(button=>button.disabled=false);
      editorFields.forEach(field=>field.readOnly=false);
    }
    if(!confirmed||signedInUser?.id!==uid)return;
    const cleared=id||clearDraft(uid,expectedDraft);
    if(!id){draft=null;savedDraft=null;}
    resetEditor();
    if(!cleared)showDraftStatus("نُشر الإعلان، وتعذّر حذف المسودة من الجهاز.");
    setStatus(publishStatus,id?"تم حفظ التعديلات بنجاح.":"نُشرت المنحة وستظهر في قسم أخبار المنح.","success");
    try{localStorage.setItem("nabd-scholarship-news-updated",String(Date.now()))}catch{}
    await refreshOwnPosts();
  });
  if (!client){showLogin();setStatus(authStatus,"إعداد Supabase غير متاح.","error");return;}
  client.auth.onAuthStateChange((event,session)=>{
    if(event==="SIGNED_IN"&&signedInUser&&session?.user?.id!==signedInUser.id){
      showLogin();
      setTimeout(()=>verifyPublisher(),0);
    }
    if(event==="SIGNED_OUT")showLogin();
    if(event==="PASSWORD_RECOVERY"){
      showLogin();
      const resetPanel=document.getElementById("sch-new-password-panel");
      if(resetPanel){resetPanel.hidden=false;loginPanel.hidden=true;dashboard.hidden=true;}
    }
  });
  document.getElementById("sch-new-password-form")?.addEventListener("submit",async(e)=>{
    e.preventDefault();
    const password=document.getElementById("sch-new-password-value").value;
    if(password.length<12){setStatus(document.getElementById("sch-new-password-status"),"استخدم كلمة مرور من 12 حرفًا على الأقل.","error");return;}
    const {error}=await client.auth.updateUser({password});
    setStatus(document.getElementById("sch-new-password-status"),error?"تعذر تغيير كلمة المرور.":"تم تحديث كلمة المرور. يمكنك دخول البوابة الآن.",error?"error":"success");
    if(!error){document.getElementById("sch-new-password-panel").hidden=true;await verifyPublisher();}
  });
  verifyPublisher();
})();
