/* NABD Scholarships Centre v1 — secured with Supabase Auth + PostgreSQL RLS */
(function(){
  "use strict";
  const home = document.querySelector("[data-scholarship-home]");
  const listings = document.querySelector("[data-scholarship-list]");
  const manager = document.querySelector("[data-scholarship-manager]");
  /* Keep the staff session separate from student/academy sessions. */
  const cfg = window.NABD_CONFIG || {};
  const client = manager && window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: {
          storageKey: "nabd-scholarships-manager-auth-v1",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : window.nabdSupabase;
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
    const cadence=home?30000:45000;
    setInterval(()=>{if(!document.hidden)fetchPublished()},cadence);
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)fetchPublished()});
  }

  if (!manager) return;
  const loginPanel = document.getElementById("sch-login-panel");
  const dashboard = document.getElementById("sch-dashboard");
  const loginForm = document.getElementById("sch-login-form");
  const publishForm = document.getElementById("sch-publish-form");
  const authStatus = document.getElementById("sch-auth-status");
  const publishStatus = document.getElementById("sch-publish-status");
  const posts = document.getElementById("sch-managed-posts");
  let signedInUser = null;
  let ownItems = [];
  const showLogin = () => {
    signedInUser=null;
    loginPanel.hidden=false;
    dashboard.hidden=true;
  };
  async function verifyPublisher(){
    if(!client){showLogin();setStatus(authStatus,"خدمة الدخول غير متاحة حاليًا.", "error");return;}
    const {data:{user},error:userError}=await client.auth.getUser();
    if(userError || !user){showLogin();return;}
    const {data:role,error:roleError}=await client.from("nabd_scholarship_publishers")
      .select("active").eq("user_id",user.id).maybeSingle();
    if(roleError || !role?.active){
      showLogin();
      await client.auth.signOut();
      setStatus(authStatus,"الحساب غير مخوّل لإدارة المنح. اطلب من إدارة الأكاديمية تفعيل صلاحية مدير المنح.", "error");
      return;
    }
    signedInUser=user;
    loginPanel.hidden=true;
    dashboard.hidden=false;
    setStatus(authStatus,"");
    document.getElementById("sch-current-email").textContent=user.email || "";
    await refreshOwnPosts();
  }
  loginForm?.addEventListener("submit",async (e)=>{
    e.preventDefault();
    const email=document.getElementById("sch-email").value.trim();
    const password=document.getElementById("sch-password").value;
    const button=document.getElementById("sch-login-button");
    if(!email || !password)return;
    button.disabled=true;
    setStatus(authStatus,"جارٍ التحقق من الحساب…");
    const {error}=await client.auth.signInWithPassword({email,password});
    button.disabled=false;
    document.getElementById("sch-password").value="";
    if(error){setStatus(authStatus,"تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور ومن تأكيد البريد الإلكتروني.", "error");return;}
    await verifyPublisher();
  });
  document.getElementById("sch-reset-password")?.addEventListener("click",async()=>{
    const email=document.getElementById("sch-email").value.trim();
    if(!email){setStatus(authStatus,"أدخل البريد الإلكتروني أولًا لطلب إعادة تعيين كلمة المرور.", "error");return;}
    const redirectTo=new URL("scholarship-manager.html",location.href).href;
    const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});
    setStatus(authStatus,error ? "تعذر طلب إعادة تعيين كلمة المرور." : "إذا كان البريد مسجلًا فستصله رسالة استعادة كلمة المرور.", error?"error":"success");
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
    await refreshOwnPosts();
  });
  if (!client){showLogin();setStatus(authStatus,"إعداد Supabase غير متاح.","error");return;}
  client.auth.onAuthStateChange((event)=>{
    if(event==="SIGNED_OUT")showLogin();
    if(event==="PASSWORD_RECOVERY"){
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
