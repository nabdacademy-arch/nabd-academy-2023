/* NABD Research Centre v1 — Supabase Auth + PostgreSQL RLS + private PDF Storage. */
(function () {
  "use strict";
  const home = document.querySelector("[data-research-home]");
  const listing = document.querySelector("[data-research-list]");
  const manager = document.querySelector("[data-research-manager]");
  if (!home && !listing && !manager) return;
  const cfg = window.NABD_CONFIG || {};
  const client = manager && window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: {
          storageKey: "nabd-research-publisher-auth-v1",
          persistSession: true, autoRefreshToken: true, detectSessionInUrl: true
        }
      })
    : window.nabdSupabase;
  const bucket = "nabd-research-pdfs";
  const $ = id => document.getElementById(id);
  const status = (el, message, kind) => {
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
    el.classList.remove("error", "success");
    if (kind) el.classList.add(kind);
  };
  const dateText = value => {
    try { return new Intl.DateTimeFormat("ar-PS", {year:"numeric",month:"long",day:"numeric"}).format(new Date(value)); }
    catch (_) { return ""; }
  };
  function makeCard(item, compact) {
    const card = document.createElement("article");
    card.className = "sch-card";
    const overline = document.createElement("span");
    overline.className = "sch-card-label";
    overline.textContent = "NABD · SCIENTIFIC RESEARCH";
    const title = document.createElement("h3");
    title.textContent = item.title;
    const author = document.createElement("p");
    author.className = "res-author";
    author.textContent = item.author_name ? "الباحث: " + item.author_name : "الناشر: أكاديمية نبض للعلوم الطبية";
    const abstract = document.createElement("p");
    abstract.className = "sch-card-desc";
    const full = item.abstract || "";
    abstract.textContent = compact && full.length > 270 ? full.slice(0,270) + "…" : full;
    const time = document.createElement("time");
    time.dateTime = item.published_at;
    time.textContent = "نُشر في " + dateText(item.published_at);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sch-btn sch-btn--gold res-read-btn";
    button.textContent = "قراءة البحث PDF ↗";
    button.setAttribute("aria-label", "فتح ملف PDF للبحث: " + item.title);
    button.addEventListener("click", async () => {
      button.disabled = true;
      const popup = window.open("about:blank", "_blank");
      if (popup) popup.opener = null;
      const {data, error} = await client.storage.from(bucket).createSignedUrl(item.pdf_path, 600);
      button.disabled = false;
      if (error || !data?.signedUrl) {
        if (popup) popup.close();
        status($("res-public-status") || $("res-home-status"), "تعذر فتح ملف PDF حاليًا. يرجى إعادة المحاولة.", "error");
        return;
      }
      if (popup) popup.location.replace(data.signedUrl);
      else window.location.assign(data.signedUrl);
    });
    card.append(overline, title, author, abstract, time, button);
    return card;
  }

  let papers = [];
  function showPublic() {
    if (home) {
      home.replaceChildren();
      if (!papers.length) {
        const p = document.createElement("p");
        p.className = "sch-home-empty";
        p.textContent = "لا توجد بحوث منشورة حاليًا. ستظهر هنا عند نشر أول بحث.";
        home.append(p);
      } else papers.slice(0,3).forEach(p => home.append(makeCard(p,true)));
    }
    if (listing) {
      const search = ($("res-search")?.value || "").trim().toLocaleLowerCase();
      const filtered = papers.filter(p => ((p.title || "") + " " + (p.abstract || "") + " " + (p.author_name || "")).toLocaleLowerCase().includes(search));
      listing.replaceChildren();
      if (!filtered.length) {
        const p = document.createElement("p");
        p.className = "sch-alert";
        p.textContent = search ? "لا توجد أبحاث مطابقة للبحث." : "لم تُنشر أبحاث بعد.";
        listing.append(p);
      } else filtered.forEach(p => listing.append(makeCard(p,false)));
      if ($("res-results-count")) $("res-results-count").textContent = filtered.length + " بحث";
    }
  }
  async function fetchPublic() {
    if (!client) {
      status($("res-public-status") || $("res-home-status"), "خدمة الأبحاث غير متاحة مؤقتًا.", "error");
      return;
    }
    const {data, error} = await client.from("nabd_research_papers")
      .select("id,title,abstract,author_name,pdf_path,published_at")
      .eq("status","published").order("published_at",{ascending:false}).limit(100);
    if (error) {
      status($("res-public-status") || $("res-home-status"), "تعذر تحديث أبحاث الأكاديمية. حاول مرة أخرى لاحقًا.", "error");
      return;
    }
    papers = data || [];
    showPublic();
    status($("res-public-status") || $("res-home-status"), "");
  }
  if (home || listing) {
    $("res-search")?.addEventListener("input", showPublic);
    fetchPublic();
    if (client && typeof client.channel === "function") {
      client.channel("nabd-research-news-v1").on("postgres_changes", {
        event:"*", schema:"public", table:"nabd_research_papers"
      }, () => { if (!document.hidden) fetchPublic(); }).subscribe();
    }
    setInterval(() => { if (!document.hidden) fetchPublic(); }, 60000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) fetchPublic(); });
    window.addEventListener("storage", e => {
      if (e.key === "nabd-research-news-updated" && !document.hidden) fetchPublic();
    });
  }
  if (!manager) return;
  const loginPanel = $("res-login-panel");
  const dashboard = $("res-dashboard");
  const authStatus = $("res-auth-status");
  const publishStatus = $("res-publish-status");
  const editor = $("res-publish-form");
  const ownList = $("res-managed-posts");
  let user = null;
  let own = [];
  function showLogin() {
    user = null;
    loginPanel.hidden = false;
    dashboard.hidden = true;
  }
  async function verifyResearcher() {
    if (!client) {
      showLogin();
      status(authStatus,"خدمة تسجيل الدخول غير متاحة حاليًا.","error");
      return;
    }
    const {data:{user:current}, error} = await client.auth.getUser();
    if (error || !current) { showLogin(); return; }
    const {data:role,error:permissionError} = await client.from("nabd_research_publishers")
      .select("active").eq("user_id",current.id).maybeSingle();
    if (permissionError || !role?.active) {
      showLogin();
      await client.auth.signOut();
      status(authStatus,"هذا الحساب غير مخوّل لنشر الأبحاث. راجع إدارة الأكاديمية لتفعيل صلاحية الباحث.","error");
      return;
    }
    user = current;
    loginPanel.hidden = true;
    dashboard.hidden = false;
    $("res-current-email").textContent = current.email || "";
    status(authStatus,"");
    await refreshOwn();
  }
  $("res-login-form")?.addEventListener("submit",async e => {
    e.preventDefault();
    if (!client) return status(authStatus,"خدمة الدخول غير متاحة.","error");
    const email = $("res-email").value.trim(), password = $("res-password").value;
    if (!email || !password) return;
    const btn = $("res-login-button");
    btn.disabled = true;
    status(authStatus,"جارٍ التحقق من الصلاحية…");
    const {error} = await client.auth.signInWithPassword({email,password});
    btn.disabled = false;
    $("res-password").value = "";
    if (error) return status(authStatus,"فشل الدخول. تحقق من البريد وكلمة المرور.","error");
    await verifyResearcher();
  });
  $("res-reset-password")?.addEventListener("click",async () => {
    const email = $("res-email").value.trim();
    if (!email) return status(authStatus,"أدخل البريد الإلكتروني أولًا.","error");
    const redirectTo = new URL("research-manager.html",location.href).href;
    const {error} = await client.auth.resetPasswordForEmail(email,{redirectTo});
    status(authStatus,error ? "تعذر إرسال طلب الاستعادة." : "إذا كان البريد مسجلًا، ستصله رسالة لاستعادة كلمة المرور.",error?"error":"success");
  });
  $("res-logout")?.addEventListener("click",async () => {
    await client.auth.signOut();
    showLogin();
    resetEditor();
    status(authStatus,"تم تسجيل الخروج.","success");
  });
  function resetEditor() {
    editor.reset();
    pdfAdapter?.clear();
    $("res-edit-id").value = "";
    $("res-pdf").required = false;
    $("res-submit").textContent = "نشر البحث الآن";
    $("res-cancel-edit").hidden = true;
  }
  function editPaper(item) {
    $("res-edit-id").value = item.id;
    $("res-title").value = item.title;
    $("res-abstract").value = item.abstract;
    $("res-author").value = item.author_name || "";
    pdfAdapter?.clear();
    $("res-pdf").required = false;
    $("res-submit").textContent = "حفظ تعديلات البحث";
    $("res-cancel-edit").hidden = false;
    status(publishStatus,"يمكنك تعديل بيانات البحث دون إعادة رفع ملف PDF، أو اختيار ملف بديل.");
    editor.scrollIntoView({behavior:"smooth",block:"start"});
    $("res-title").focus();
  }
  $("res-cancel-edit")?.addEventListener("click",() => {
    resetEditor(); status(publishStatus,"");
  });
  async function refreshOwn() {
    if (!user) return;
    const {data,error} = await client.from("nabd_research_papers")
      .select("id,title,abstract,author_name,pdf_path,status,published_at")
      .eq("published_by",user.id).order("published_at",{ascending:false}).limit(100);
    if (error) return status(publishStatus,"تعذر تحميل أبحاثك.","error");
    own = data || [];
    ownList.replaceChildren();
    if (!own.length) {
      const p=document.createElement("p");p.textContent="لم تنشر أبحاثًا بعد.";ownList.append(p);
      return;
    }
    own.forEach(item => {
      const row=document.createElement("div");row.className="sch-manage-item";
      const info=document.createElement("div"),name=document.createElement("strong"),meta=document.createElement("small");
      name.textContent=item.title;
      meta.textContent=(item.status==="published"?"منشور":"مؤرشف")+" · "+dateText(item.published_at);
      info.append(name,meta);
      const actions=document.createElement("div");actions.className="sch-manage-actions";
      const edit=document.createElement("button");edit.type="button";edit.textContent="تعديل";
      edit.addEventListener("click",()=>editPaper(item));
      const archive=document.createElement("button");archive.type="button";
      archive.textContent=item.status==="published"?"أرشفة":"إعادة نشر";
      archive.addEventListener("click",async () => {
        archive.disabled=true;
        const next=item.status==="published"?"archived":"published";
        const {data, error}=await client.from("nabd_research_papers")
          .update({status:next,updated_at:new Date().toISOString()})
          .eq("id",item.id).eq("published_by",user.id).select("id").maybeSingle();
        archive.disabled=false;
        if (error || !data) return status(publishStatus,"تعذر تغيير حالة البحث.","error");
        status(publishStatus,next==="published"?"أعيد نشر البحث بنجاح.":"تمت أرشفة البحث وإخفاؤه من القوائم العامة.","success");
        try { localStorage.setItem("nabd-research-news-updated",String(Date.now())); } catch (_) {}
        await refreshOwn();
      });
      actions.append(edit,archive);row.append(info,actions);ownList.append(row);
    });
  }
  // The upload adapter accepts a PDF from any browser-readable provider,
  // including cloud/WhatsApp document pickers, without relying on extension.
  const pdfAdapter = window.NABDResearchPDFUploader?.create({
    client,bucket,userId:()=>user?.id,
    showStatus:(msg,kind)=>status(publishStatus,msg,kind)
  });
  async function uploadPdf(file) {
    if (!pdfAdapter) throw Error("تعذر تحميل نظام رفع الأبحاث. حدّث الصفحة وحاول مجددًا.");
    return pdfAdapter.uploadPdf(file);
  }
  editor?.addEventListener("submit",async e => {
    e.preventDefault();
    if (!user || !client) return;
    const title=$("res-title").value.trim();
    const abstract=$("res-abstract").value.trim();
    const author=$("res-author").value.trim();
    const id=$("res-edit-id").value;
    const old=id ? own.find(x=>x.id===id) : null;
    const file=pdfAdapter?.getFile() || $("res-pdf").files?.[0];
    if (title.length<3 || title.length>240 || abstract.length<10 || abstract.length>12000 ||
        (author && (author.length<2 || author.length>160))) {
      return status(publishStatus,"راجع العنوان والملخص واسم الباحث.","error");
    }
    if (!id && !file) return status(publishStatus,"يجب رفع ملف PDF عند نشر بحث جديد.","error");
    if (id && !old) return status(publishStatus,"لم يتم العثور على البحث للتعديل. حدّث الصفحة وحاول مجددًا.","error");
    const button=$("res-submit");button.disabled=true;
    status(publishStatus,file?"جارٍ رفع البحث وحفظه…":"جارٍ حفظ التعديلات…");
    let uploaded = null;
    try {
      if (file) uploaded = await uploadPdf(file);
      const values = {
        title, abstract, author_name: author || null,
        updated_at:new Date().toISOString()
      };
      if (uploaded) values.pdf_path = uploaded;
      let response;
      if (id) response = await client.from("nabd_research_papers")
        .update(values).eq("id",id).eq("published_by",user.id).select("id").maybeSingle();
      else response = await client.from("nabd_research_papers")
        .insert({...values,published_by:user.id,status:"published"}).select("id").maybeSingle();
      if (response.error || !response.data) throw new Error("لم تُحفَظ بيانات البحث. تأكد من صلاحية الحساب والاتصال ثم حاول مجددًا.");
      if (old && uploaded && old.pdf_path !== uploaded) {
        // Remove the replaced PDF only after the database points at the new one.
        await client.storage.from(bucket).remove([old.pdf_path]);
      }
      resetEditor();
      status(publishStatus,id ? "تم حفظ تعديلات البحث بنجاح." : "نُشر البحث بنجاح وسيظهر في أخبار البحوث على الموقع.","success");
      try { localStorage.setItem("nabd-research-news-updated",String(Date.now())); } catch (_) {}
      await refreshOwn();
    } catch (err) {
      if (uploaded) await client.storage.from(bucket).remove([uploaded]);
      status(publishStatus,err?.message || "تعذر النشر. يرجى المحاولة لاحقًا.","error");
    } finally { button.disabled=false; }
  });
  if (!client) {
    showLogin();status(authStatus,"إعدادات Supabase غير متاحة.","error");return;
  }
  client.auth.onAuthStateChange((event) => {
    if (event==="SIGNED_OUT") showLogin();
    if (event==="PASSWORD_RECOVERY") {
      $("res-new-password-panel").hidden=false;
      loginPanel.hidden=true;dashboard.hidden=true;
    }
  });
  $("res-new-password-form")?.addEventListener("submit",async e => {
    e.preventDefault();
    const password=$("res-new-password-value").value;
    if (password.length<12) return status($("res-new-password-status"),"استخدم كلمة مرور من 12 حرفًا على الأقل.","error");
    const {error}=await client.auth.updateUser({password});
    status($("res-new-password-status"),error?"تعذر تحديث كلمة المرور.":"تم تحديث كلمة المرور بنجاح.",error?"error":"success");
    if (!error) {
      $("res-new-password-panel").hidden=true;
      await verifyResearcher();
    }
  });
  verifyResearcher();
})();
