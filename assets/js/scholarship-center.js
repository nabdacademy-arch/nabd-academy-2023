/* NABD Scholarships Centre v1 — secured with Supabase Auth + PostgreSQL RLS */
(function(){
  "use strict";
  const home = document.querySelector("[data-scholarship-home]");
  const listings = document.querySelector("[data-scholarship-list]");
  const manager = document.querySelector("[data-scholarship-manager]");
  /* Keep the staff session separate from student/academy sessions. */
  const cfg = window.NABD_CONFIG || {};
  if (!home && !listings && !manager) return;

  function initClient() {
    if (!manager) return window.nabdSupabase;
    if (!window.supabase?.createClient || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    try {
      return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: {
          storageKey: "nabd-scholarships-manager-auth-v1",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch {
      return null;
    }
  }
  const client = initClient();

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
  let publishedCache = [];
  async function fetchPublished() {
    if (!client) {
      if (home) home.textContent = "خدمة أخبار المنح غير متاحة حاليًا.";
      if (listings) setStatus(document.getElementById("sch-public-status"),"تعذر الاتصال بخدمة المنح.", "error");
      return;
    }
    const {data,error} = await client.from("nabd_scholarship_opportunities")
      .select("id,title,description,application_url,published_at")
      .eq("status","published").order("published_at",{ascending:false}).limit(100);
    if (error) {
      const message = "تعذر تحديث فرص المنح. يرجى إعادة المحاولة لاحقًا.";
      if (home) setStatus(document.getElementById("sch-home-status"),message,"error");
      if (listings) setStatus(document.getElementById("sch-public-status"),message,"error");
      return;
    }
    publishedCache = data || [];
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
    if (listings) renderPublicList();
  }
  function renderPublicList() {
    if(!listings) return;
    const search=(document.getElementById("sch-search")?.value || "").trim().toLocaleLowerCase();
    const filtered=publishedCache.filter(x=>(x.title+" "+x.description).toLocaleLowerCase().includes(search));
    listings.replaceChildren();
    if (!filtered.length) {
      const empty=document.createElement("div");
      empty.className="sch-alert";
      empty.textContent=search ? "لا توجد نتائج مطابقة." : "لم تنشر فرص بعد. راجع هذه الصفحة قريبًا.";
      listings.append(empty);
    } else filtered.forEach(x=>listings.append(card(x,false)));
    const count=document.getElementById("sch-results-count");
    if(count)count.textContent=filtered.length+" فرصة";
    setStatus(document.getElementById("sch-public-status"),"");
  }
  if (home || listings) {
    document.getElementById("sch-search")?.addEventListener("input",renderPublicList);
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
  if (!client) {
    document.getElementById("sch-login-form").addEventListener("submit", event => event.preventDefault());
    document.getElementById("sch-login-button").disabled = true;
    document.getElementById("sch-reset-password").disabled = true;
    setStatus(document.getElementById("sch-auth-status"),
      "تعذّر تحميل خدمة دخول مدير المنح. تحقق من اتصالك ثم أعد تحميل الصفحة.", "error");
    return;
  }
  const loginPanel = document.getElementById("sch-login-panel");
  const dashboard = document.getElementById("sch-dashboard");
  const loginForm = document.getElementById("sch-login-form");
  const publishForm = document.getElementById("sch-publish-form");
  const authStatus = document.getElementById("sch-auth-status");
  const publishStatus = document.getElementById("sch-publish-status");
  const posts = document.getElementById("sch-managed-posts");
  let signedInUser = null;
  let ownItems = [];
  let verification = 0;
  const retryRole = document.getElementById("sch-retry-role");
  const showLogin = () => {
    signedInUser=null;
    loginPanel.hidden=false;
    dashboard.hidden=true;
  };
  async function verifyPublisher(){
    const attempt=++verification;
    showLogin();
    retryRole.hidden=true;
    let user,role;
    try{
      const identity=await client.auth.getUser();
      if(attempt!==verification)return;
      if(identity.error?.name==="AuthSessionMissingError"||(!identity.error&&!identity.data?.user)){
        setStatus(authStatus,"");return;
      }
      if(identity.error||!identity.data?.user)throw Error("IDENTITY_UNAVAILABLE");
      user=identity.data.user;
      const result=await client.from("nabd_scholarship_publishers")
        .select("active").eq("user_id",user.id).maybeSingle();
      if(attempt!==verification)return;
      if(result.error)throw result.error;
      role=result.data;
    }catch{
      if(attempt!==verification)return;
      retryRole.hidden=false;
      setStatus(authStatus,"تعذر التحقق من الصلاحية. تحقق من الاتصال ثم أعد المحاولة. · Unable to verify access. Check your connection and retry.","error");
      return;
    }
    if(role?.active!==true){
      setStatus(authStatus,"الحساب غير مخوّل لإدارة المنح. اطلب من إدارة الأكاديمية تفعيل صلاحية مدير المنح.","error");
      await client.auth.signOut();
      return;
    }
    signedInUser=user;
    loginPanel.hidden=true;
    dashboard.hidden=false;
    setStatus(authStatus,"");
    document.getElementById("sch-current-email").textContent=user.email || "";
    await refreshOwnPosts();
  }
  retryRole.addEventListener("click",()=>{if(!retryRole.hidden)return verifyPublisher();});
  loginForm?.addEventListener("submit",async (e)=>{
    e.preventDefault();
    const email=document.getElementById("sch-email").value.trim();
    const password=document.getElementById("sch-password").value;
    const button=document.getElementById("sch-login-button");
    if(button.disabled || !email || !password)return;
    const attempt=++verification;
    retryRole.hidden=true;
    button.disabled=true;
    const passwordField=document.getElementById("sch-password");
    passwordField.value="";
    setStatus(authStatus,"جارٍ التحقق من الحساب…");
    try{
      let result;
      try{
        result=await client.auth.signInWithPassword({email,password});
      }catch{
        if(attempt===verification)setStatus(authStatus,"تعذر الاتصال بخدمة الدخول. تحقق من الاتصال وحاول مجددًا. · Check your connection and try again.","error");
        return;
      }
      if(attempt!==verification)return;
      if(result.error){
        const error=result.error;
        const interrupted=error.name==="AuthRetryableFetchError" || error.status===0 || error.status>=500;
        setStatus(authStatus,interrupted
          ?"تعذر الاتصال بخدمة الدخول. تحقق من الاتصال وحاول مجددًا. · Check your connection and try again."
          :"تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور ومن تأكيد البريد الإلكتروني. · Check your sign-in details.","error");
        return;
      }
      await verifyPublisher();
    }finally{
      button.disabled=false;
    }
  });
  const resetButton=document.getElementById("sch-reset-password");
  document.getElementById("sch-email").addEventListener("input",()=>{
    if(resetButton?.disabled)setStatus(authStatus,"");
  });
  resetButton?.addEventListener("click",async()=>{
    if(resetButton.disabled)return;
    const emailField=document.getElementById("sch-email");
    const email=emailField.value.trim();
    if(!email){setStatus(authStatus,"أدخل البريد الإلكتروني أولًا لطلب إعادة تعيين كلمة المرور.", "error");return;}
    const attempt=verification;
    const current=()=>attempt===verification && emailField.value.trim()===email && !loginPanel.hidden;
    resetButton.disabled=true;
    setStatus(authStatus,"جارٍ طلب رابط الاستعادة… · Requesting a recovery link…");
    try{
      const redirectTo=new URL("scholarship-manager.html",location.href).href;
      const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});
      if(error)throw error;
      if(current())setStatus(authStatus,"إذا كان البريد مسجلًا فستصله رسالة استعادة كلمة المرور. · If this email is registered, a recovery link will be sent.","success");
    }catch{
      if(current())setStatus(authStatus,"تعذر تأكيد طلب الاستعادة. تفقد بريدك قبل إعادة المحاولة. · Check your inbox before retrying.","error");
    }finally{
      resetButton.disabled=false;
    }
  });
  document.getElementById("sch-logout")?.addEventListener("click",async()=>{
    await client.auth.signOut();
    showLogin();
    publishForm?.reset();
    setStatus(authStatus,"تم تسجيل الخروج.","success");
  });
  function editItem(item) {
    document.getElementById("sch-edit-id").value=item.id;
    document.getElementById("sch-title").value=item.title;
    document.getElementById("sch-description").value=item.description;
    document.getElementById("sch-url").value=item.application_url;
    document.getElementById("sch-submit").textContent="حفظ التعديلات";
    document.getElementById("sch-cancel-edit").hidden=false;
    setStatus(publishStatus,"تعديل إعلان موجود. احفظ التغييرات أو اضغط إلغاء.");
    publishForm.scrollIntoView({behavior:"smooth",block:"start"});
    document.getElementById("sch-title").focus();
  }
  function resetEditor() {
    publishForm.reset();
    document.getElementById("sch-edit-id").value="";
    document.getElementById("sch-submit").textContent="نشر المنحة الآن";
    document.getElementById("sch-cancel-edit").hidden=true;
  }
  document.getElementById("sch-cancel-edit")?.addEventListener("click",()=>{resetEditor();setStatus(publishStatus,"");});
  async function refreshOwnPosts(){
    if(!signedInUser)return;
    const {data,error}=await client.from("nabd_scholarship_opportunities")
      .select("id,title,description,application_url,status,published_at")
      .eq("published_by",signedInUser.id).order("published_at",{ascending:false}).limit(100);
    if(error){setStatus(publishStatus,"تعذر تحميل قائمة الإعلانات.","error");return;}
    ownItems=data||[];
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
        archive.disabled=true;
        const next=item.status==="published"?"archived":"published";
        const {error:err}=await client.from("nabd_scholarship_opportunities")
          .update({status:next,updated_at:new Date().toISOString()})
          .eq("id",item.id).eq("published_by",signedInUser.id);
        archive.disabled=false;
        if(err){setStatus(publishStatus,"تعذر تعديل حالة الإعلان.","error");return;}
        setStatus(publishStatus,next==="archived"?"تمت أرشفة الفرصة وإخفاؤها عن الجمهور.":"أعيد نشر الفرصة بنجاح.","success");
        await refreshOwnPosts();
      });
      actions.append(edit,archive);row.append(info,actions);posts.append(row);
    });
  }
  publishForm?.addEventListener("submit",async(e)=>{
    e.preventDefault();
    if(!signedInUser)return;
    const title=document.getElementById("sch-title").value.trim();
    const description=document.getElementById("sch-description").value.trim();
    const application_url=document.getElementById("sch-url").value.trim();
    const id=document.getElementById("sch-edit-id").value;
    if(title.length<3 || title.length>180 || description.length<10 || description.length>12000 || !safeUrl(application_url)){
      setStatus(publishStatus,"تحقق من عنوان المنحة، والتفاصيل، ورابط تقديم صالح يبدأ بـ https:// أو http://.", "error");
      return;
    }
    const button=document.getElementById("sch-submit");
    button.disabled=true;
    setStatus(publishStatus,"جارٍ حفظ الإعلان…");
    const values={title,description,application_url,updated_at:new Date().toISOString()};
    let response;
    if(id) response=await client.from("nabd_scholarship_opportunities").update(values).eq("id",id).eq("published_by",signedInUser.id).select("id").single();
    else response=await client.from("nabd_scholarship_opportunities").insert({...values,published_by:signedInUser.id,status:"published"}).select("id").single();
    button.disabled=false;
    if(response.error){setStatus(publishStatus,"تعذر نشر الإعلان. تأكد من صلاحية الحساب واتصال الإنترنت ثم حاول مرة أخرى.", "error");return;}
    resetEditor();
    setStatus(publishStatus,id?"تم حفظ تعديلات المنحة بنجاح.":"نُشرت المنحة بنجاح وستظهر الآن في أخبار المنح على الموقع.","success");
    try{localStorage.setItem("nabd-scholarship-news-updated",String(Date.now()));}catch(_){}
    await refreshOwnPosts();
  });
  const recoveryPanel=document.getElementById("sch-new-password-panel");
  const passwordField=document.getElementById("sch-new-password-value");
  const savePassword=document.getElementById("sch-save-password");
  const passwordStatus=document.getElementById("sch-new-password-status");
  let recovery=null;
  function closeRecovery(){
    recovery=null;
    recoveryPanel.hidden=true;
    passwordField.value="";
    savePassword.disabled=false;
    setStatus(passwordStatus,"");
  }
  client.auth.onAuthStateChange((event,session)=>{
    if(event==="SIGNED_OUT" || (recovery && event==="SIGNED_IN" && session?.user?.id!==recovery.userId)){
      verification++;retryRole.hidden=true;closeRecovery();showLogin();
    }
    if(event==="PASSWORD_RECOVERY"){
      verification++;retryRole.hidden=true;closeRecovery();showLogin();
      if(!session?.user?.id)return;
      recovery={userId:session.user.id};
      recoveryPanel.hidden=false;loginPanel.hidden=true;
    }
  });
  document.getElementById("sch-new-password-form")?.addEventListener("submit",async(e)=>{
    e.preventDefault();
    const attempt=recovery;
    if(!attempt || savePassword.disabled)return;
    const password=passwordField.value;
    if(password.length<12){setStatus(passwordStatus,"استخدم كلمة مرور من 12 حرفًا على الأقل.","error");return;}
    savePassword.disabled=true;
    try{
      const identity=await client.auth.getUser();
      if(attempt!==recovery)return;
      if(identity.error)throw identity.error;
      if(identity.data?.user?.id!==attempt.userId){
        closeRecovery();showLogin();
        setStatus(authStatus,"تغيّر الحساب. افتح رابط استعادة الحساب المطلوب مجددًا.","error");
        return;
      }
      const {error}=await client.auth.updateUser({password});
      if(attempt!==recovery)return;
      if(error)throw error;
    }catch{
      if(attempt===recovery)setStatus(passwordStatus,"تعذر تأكيد تغيير كلمة المرور. تحقق من الاتصال وحاول مجددًا. · Password change could not be confirmed.","error");
      return;
    }finally{
      if(attempt===recovery)savePassword.disabled=false;
    }
    closeRecovery();
    await verifyPublisher();
  });
  verifyPublisher();
})();
