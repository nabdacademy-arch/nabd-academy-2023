/* NABD private research office. Browser contains ONLY publishable config.
 * Access must be enforced in Supabase database RLS; a client-only check is never security.
 */
(() => {
  "use strict";
  const db = window.nabdSupabase;
  const byId = (id) => document.getElementById(id);
  const loginArea = byId("loginArea");
  const workspace = byId("workspace");
  const editor = byId("editor");
  const recordForm = byId("recordForm");
  const recordList = byId("records");
  const statusLabels = {
    draft: "مسودة", sent: "تم الإرسال", acknowledged: "تأكيد استلام آلي",
    in_review: "قيد المراجعة", replied: "رد بشري",
    exploring: "مباحثات تعاون", closed: "مغلق"
  };
  let userId = null;
  let editingId = null;
  let rows = [];

  function message(value, error = false) {
    const box = byId("message");
    box.textContent = value;
    box.className = error ? "info notice-error" : value ? "info" : "";
  }
  function showAuth() {
    userId = null;
    rows = [];
    editingId = null;
    recordList.replaceChildren();
    editor.hidden = true;
    workspace.hidden = true;
    loginArea.hidden = false;
  }
  function setEditor(record = null) {
    editingId = record?.id || null;
    byId("formTitle").textContent = record ? "تعديل سجل المتابعة" : "سجل متابعة جديد";
    const fields = {
      institution: record?.institution || "", country: record?.country || "",
      purpose: record?.purpose || "", status: record?.status || "draft",
      reference: record?.reference_code || "", contactEmail: record?.contact_email || "",
      lastContact: record?.last_contact_on || "", followUp: record?.follow_up_on || "",
      evidence: record?.evidence_url || "", notes: record?.internal_notes || ""
    };
    Object.entries(fields).forEach(([field, value]) => { byId(field).value = value; });
    editor.hidden = false;
    editor.scrollIntoView({behavior: "smooth", block: "start"});
  }
  function createText(tag, value, className = "") {
    const element = document.createElement(tag);
    element.textContent = String(value ?? "");
    if (className) element.className = className;
    return element;
  }
  function render() {
    const query = (byId("search").value || "").trim().toLocaleLowerCase();
    const filtered = rows.filter((item) =>
      [item.institution, item.country, item.purpose, statusLabels[item.status]]
        .some((text) => String(text || "").toLocaleLowerCase().includes(query))
    );
    recordList.replaceChildren();
    byId("empty").hidden = filtered.length > 0;
    filtered.forEach((item) => {
      const article = createText("article", "", "record");
      article.append(createText("span", statusLabels[item.status] || item.status, "status"));
      article.append(createText("h3", item.institution));
      article.append(createText("div", [item.country, item.purpose].filter(Boolean).join(" — "), "meta"));
      if (item.reference_code) article.append(createText("p", "رقم الملف: " + item.reference_code));
      if (item.last_contact_on) article.append(createText("p", "آخر تواصل: " + item.last_contact_on));
      if (item.follow_up_on) article.append(createText("p", "المتابعة: " + item.follow_up_on));
      if (item.internal_notes) article.append(createText("p", item.internal_notes));
      const button = createText("button", "تعديل السجل", "btn btn-min");
      button.type = "button";
      button.addEventListener("click", () => setEditor(item));
      article.append(button);
      recordList.append(article);
    });
  }
  async function loadRows() {
    if (!db || !userId) return;
    message("");
    const {data, error} = await db.from("nabd_research_outreach")
      .select("id,institution,country,purpose,status,reference_code,contact_email,last_contact_on,follow_up_on,evidence_url,internal_notes,created_at")
      .order("created_at", {ascending: false}).limit(200);
    if (error) {
      rows = [];
      render();
      message("تعذّر جلب السجلات. يلزم تفعيل جدول الإدارة وسياسات RLS ومراجعتها أولًا؛ لا تضع الملفات في الصفحة العامة.", true);
      return;
    }
    rows = data || [];
    render();
  }
  async function authorize() {
    if (!db) {
      showAuth();
      message("خدمة المصادقة غير متصلة. لا يمكن عرض أي سجلات.", true);
      return;
    }
    const {data: {user}, error: userError} = await db.auth.getUser();
    if (userError || !user) { showAuth(); return; }
    const {data: profile, error: profileError} = await db.from("profiles")
      .select("role").eq("id", user.id).maybeSingle();
    if (profileError || !profile || profile.role !== "admin") {
      showAuth();
      message("الحساب لا يمتلك صلاحية إدارة المكتب البحثي.", true);
      return;
    }
    userId = user.id;
    loginArea.hidden = true;
    workspace.hidden = false;
    byId("identity").textContent = user.email || "حساب إداري موثّق";
    await loadRows();
  }
  byId("authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!db) return message("خدمة المصادقة غير متصلة.", true);
    message("يجري التحقق من الحساب...");
    const submit = event.submitter;
    if (submit) submit.disabled = true;
    try {
      const {error} = await db.auth.signInWithPassword({
        email: byId("email").value.trim(),
        password: byId("password").value
      });
      byId("password").value = "";
      if (error) return message("تعذّر تسجيل الدخول. تحقق من بيانات الحساب.", true);
      await authorize();
    } catch (_) { message("تعذّر الاتصال بخدمة المصادقة.", true); }
    finally { if (submit) submit.disabled = false; }
  });
  byId("recordForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!userId || !db) return;
    const submit = byId("save");
    submit.disabled = true;
    const payload = {
      institution: byId("institution").value.trim(),
      country: byId("country").value.trim(),
      purpose: byId("purpose").value.trim(),
      status: byId("status").value,
      reference_code: byId("reference").value.trim(),
      contact_email: byId("contactEmail").value.trim(),
      last_contact_on: byId("lastContact").value || null,
      follow_up_on: byId("followUp").value || null,
      evidence_url: byId("evidence").value.trim(),
      internal_notes: byId("notes").value.trim(),
      updated_at: new Date().toISOString()
    };
    if (!payload.institution) {
      submit.disabled = false;
      return message("اسم الجهة مطلوب.", true);
    }
    try {
      const query = editingId
        ? db.from("nabd_research_outreach").update(payload).eq("id", editingId).select("id")
        : db.from("nabd_research_outreach").insert({...payload, created_by: userId}).select("id");
      const {data, error} = await query;
      if (error || !data?.length) return message("لم يُحفظ السجل. تحقّق من الصلاحيات والحقول ثم أعد المحاولة.", true);
      editor.hidden = true;
      editingId = null;
      recordForm.reset();
      message("تم حفظ سجل المتابعة داخل قاعدة البيانات الخاصة.");
      await loadRows();
    } catch (_) { message("حدث خطأ اتصال أثناء الحفظ.", true); }
    finally { submit.disabled = false; }
  });
  byId("newRecord").addEventListener("click", () => setEditor());
  byId("refresh").addEventListener("click", () => loadRows());
  byId("cancel").addEventListener("click", () => { editor.hidden = true; editingId = null; });
  byId("search").addEventListener("input", render);
  byId("logout").addEventListener("click", async () => {
    if (db) await db.auth.signOut();
    showAuth();
    message("تم تسجيل الخروج.");
  });
  authorize().catch(() => {
    showAuth();
    message("تعذّر التحقق من صلاحية الحساب.", true);
  });
})();