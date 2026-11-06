/* NABD CAMPUS: existing Supabase account, read-only progress and protected RSVP. */
"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const db = () => window.nabdSupabase || null;
  let lang = "ar";
  let user = null;
  let admin = false;
  let sessions = [];
  let signups = new Set();

  const tr = (ar, en) => lang === "ar" ? ar : en;
  const fmtDate = value => {
    const date = new Date(value);
    return Number.isFinite(date.valueOf())
      ? new Intl.DateTimeFormat(lang === "ar" ? "ar-PS" : "en-GB", {
          dateStyle: "medium", timeStyle: "short"
        }).format(date)
      : tr("موعد غير صالح", "Invalid date");
  };

  function setLang(next) {
    lang = next === "en" ? "en" : "ar";
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("nabd_lang",lang); } catch (_) {}
    document.querySelectorAll("[data-ar][data-en]").forEach(el => {
      const label = el.getAttribute("data-" + lang) || "";
      if (el.matches(".hero h1")) el.innerHTML = label;
      else el.textContent = label;
    });
    $("languageButton").textContent = lang === "ar" ? "English" : "العربية";
    $("languageButton").setAttribute("aria-label",tr("Switch to English","التبديل إلى العربية"));
    if (user) updateName();
    renderSessions();
  }

  function report(message) {
    const flash = $("flash");
    flash.textContent = message;
    flash.hidden = false;
    clearTimeout(report.timer);
    report.timer = setTimeout(() => { flash.hidden = true; }, 5200);
  }

  function line(title,sub,progress) {
    const box = document.createElement("div");
    box.className = "list-card";
    const a = document.createElement("strong");
    a.textContent = title;
    box.append(a);
    if (sub) {
      const b = document.createElement("small");
      b.textContent = sub;
      box.append(b);
    }
    if (Number.isFinite(progress)) {
      const track = document.createElement("div");
      track.className = "progress-track";
      const bar = document.createElement("i");
      bar.style.width = Math.min(100, Math.max(0, progress)) + "%";
      track.append(bar);
      box.append(track);
    }
    return box;
  }

  let profileName = "";
  function updateName() {
    $("studentName").textContent = profileName
      ? tr("أهلًا، " + profileName, "Welcome, " + profileName)
      : tr("أهلًا بك في نبض", "Welcome to NABD");
  }

  function setText(id, value) { $(id).textContent = value; }

  async function loadStudent(client, id) {
    const [en, cert] = await Promise.all([
      client.from("enrollments").select("id,course_id,status,progress").eq("student_id",id).limit(150),
      client.from("certificates").select("certificate_id,course_title,status,issue_date").eq("student_id",id).order("issue_date",{ascending:false}).limit(80)
    ]);
    if (en.error || cert.error) {
      setText("accountStatus", tr("تعذّر تحميل السجل؛ جرّب بوابة الطالب.", "Could not load records; please use the student portal."));
      return;
    }
    const enrollments = en.data || [];
    const certificates = cert.data || [];
    setText("courseCount", String(enrollments.length));
    setText("certificateCount", String(certificates.length));
    const numeric = enrollments.map(e => Number(e.progress)).filter(Number.isFinite);
    setText("progressAverage",numeric.length
      ? Math.round(numeric.reduce((a,b) => a+b,0)/numeric.length)+"%"
      : "—");

    const cList = $("courseList");
    const certList = $("certificateList");
    cList.replaceChildren();
    certList.replaceChildren();

    const ids = [...new Set(enrollments.map(e => e.course_id).filter(Boolean))];
    let titles = new Map();
    if (ids.length) {
      const {data} = await client.from("courses").select("id,title_ar,title_en,code").in("id",ids).limit(150);
      if (data) titles = new Map(data.map(c => [c.id,c]));
    }
    if (!enrollments.length) cList.append(line(tr("لا توجد مقررات مرتبطة بهذا الحساب بعد.", "No courses linked to this account yet.")));
    enrollments.forEach(e => {
      const c = titles.get(e.course_id);
      const title = c ? (lang === "ar" ? (c.title_ar||c.title_en) : (c.title_en||c.title_ar)) : tr("مقرر مسجّل", "Enrolled course");
      const p = Number(e.progress);
      cList.append(line(title || tr("مقرر", "Course"), tr("الحالة: ", "Status: ") + (e.status || tr("مسجل","Enrolled")), Number.isFinite(p)?p:null));
    });
    if (!certificates.length) certList.append(line(tr("لا توجد شهادات إتمام صادرة مرتبطة بحسابك.", "No issued completion records linked to your account.")));
    certificates.forEach(c => {
      certList.append(line(c.course_title || tr("شهادة إتمام","Completion record"),
        [c.certificate_id,c.issue_date,c.status].filter(Boolean).join(" · ")));
    });
  }

  function makeSession(s) {
    const div = document.createElement("article");
    div.className = "session";
    const eyebrow = document.createElement("div");
    eyebrow.className = "meta";
    eyebrow.textContent = fmtDate(s.scheduled_at) + " · " + String(s.duration_minutes || 60) + tr(" دقيقة", " min");
    const h3 = document.createElement("h3");
    h3.textContent = lang === "ar" ? (s.title_ar || s.title_en) : (s.title_en || s.title_ar);
    const speaker = document.createElement("p");
    speaker.textContent = s.speaker_name
      ? s.speaker_name + (s.speaker_affiliation ? " · " + s.speaker_affiliation : "")
      : tr("المحاضر يُعلن بعد التأكيد", "Speaker will be announced after confirmation");
    const pill = document.createElement("span");
    pill.className = "badge";
    pill.textContent = tr("جلسة منشورة", "Published session");
    div.append(eyebrow,h3,speaker,pill);
    if (new Date(s.scheduled_at).getTime() > Date.now()) {
      const controls = document.createElement("div");
      controls.className = "row";
      controls.style.marginTop = "16px";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "button primary small";
      btn.textContent = signups.has(s.id) ? tr("إلغاء تسجيلي","Cancel registration") : tr("سجّل مجانًا","Register free");
      btn.addEventListener("click", () => rsvp(s.id,btn));
      controls.append(btn);
      div.append(controls);
    }
    return div;
  }

  function renderSessions() {
    const list = $("sessionList");
    if (!list) return;
    list.replaceChildren();
    const visible = sessions.filter(s => s.status === "published" && new Date(s.scheduled_at).getTime() > Date.now()-60*60*1000);
    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = tr("لا توجد مواعيد منشورة ومؤكدة حاليًا. سنعرض الجلسات فور الاتفاق مع المحاضرين.", "No confirmed sessions are published yet. Sessions appear here after a lecturer and date are confirmed.");
      list.append(empty);
    } else {
      visible.sort((a,b) => new Date(a.scheduled_at)-new Date(b.scheduled_at)).forEach(s => list.append(makeSession(s)));
    }
  }

  async function loadSessions(client) {
    const {data,error} = await client.from("nabd_global_sessions")
      .select("id,title_ar,title_en,speaker_name,speaker_affiliation,scheduled_at,duration_minutes,status")
      .gte("scheduled_at",new Date(Date.now()-60*60*1000).toISOString())
      .order("scheduled_at",{ascending:true}).limit(25);
    if (error) {
      sessions = [];
      renderSessions();
      setText("lectureNote",tr("تعذّر الاتصال بجدول الجلسات، جرّب مجددًا لاحقًا.", "Could not reach the schedule. Try again later."));
      return;
    }
    sessions = data || [];
    renderSessions();
  }

  async function loadSignups(client) {
    if (!user) return;
    const {data,error} = await client.from("nabd_global_session_signups")
      .select("session_id").eq("student_id",user.id).limit(150);
    if (!error) signups = new Set((data||[]).map(r=>r.session_id));
    renderSessions();
  }

  async function rsvp(sessionId, button) {
    const client = db();
    if (!client) return report(tr("الخدمة غير متصلة حاليًا.", "Service is unavailable."));
    if (!user) {
      report(tr("سجّل الدخول إلى حساب الطالب أولًا ثم عُد للتسجيل.", "Please sign in to your student account, then return to register."));
      return;
    }
    button.disabled = true;
    try {
      const exists = signups.has(sessionId);
      const response = exists
        ? await client.from("nabd_global_session_signups").delete().eq("session_id",sessionId).eq("student_id",user.id)
        : await client.from("nabd_global_session_signups").insert({session_id:sessionId,student_id:user.id,attended:false});
      if (response.error) throw response.error;
      if (exists) signups.delete(sessionId);
      else signups.add(sessionId);
      report(exists ? tr("أُلغي التسجيل.", "Registration cancelled.") : tr("تم تسجيل اهتمامك بالجلسة؛ تفاصيل الدخول تُعلنها الإدارة.", "Registration saved. The academy will announce joining instructions."));
      renderSessions();
    } catch (_) {
      report(tr("لم تكتمل العملية. ربما انتهى التسجيل أو تغير موعد الجلسة.", "Could not complete registration. The session may have changed."));
    } finally { button.disabled = false; }
  }

  async function saveAdminSession(event) {
    event.preventDefault();
    if (!admin || !user) return;
    const client = db();
    const f = event.currentTarget;
    const fd = new FormData(f);
    const title_ar = String(fd.get("title_ar") || "").trim();
    const title_en = String(fd.get("title_en") || "").trim();
    const speaker_name = String(fd.get("speaker_name") || "").trim();
    const speaker_affiliation = String(fd.get("speaker_affiliation") || "").trim();
    const status = fd.get("status") === "published" ? "published" : "draft";
    const scheduled_at = new Date(String(fd.get("scheduled_at")||""));
    const duration_minutes = Number(fd.get("duration_minutes")||60);
    if (title_ar.length < 4 || title_en.length < 4 || !Number.isFinite(scheduled_at.valueOf()) || scheduled_at.getTime() <= Date.now()) {
      setText("adminFeedback",tr("تحقق من العناوين وتاريخ مستقبلي صحيح.", "Provide both titles and a valid future date."));
      return;
    }
    if (status === "published" && !speaker_name) {
      setText("adminFeedback",tr("قبل النشر، أدخل اسم المحاضر بعد موافقته.", "Before publishing, add the speaker's confirmed name."));
      return;
    }
    const btn = $("saveSession");
    btn.disabled = true;
    const {error} = await client.from("nabd_global_sessions").insert({
      title_ar,title_en,speaker_name,speaker_affiliation,status,
      scheduled_at:scheduled_at.toISOString(),duration_minutes
    });
    btn.disabled = false;
    if (error) {
      setText("adminFeedback",tr("فشل الحفظ. راجع صلاحيات الإدارة والبيانات.", "Save failed. Check admin permissions and values."));
      return;
    }
    f.reset();
    setText("adminFeedback",tr("حُفظت الجلسة بنجاح.", "Session saved successfully."));
    await loadSessions(client);
  }

  async function init() {
    $("copyrightYear").textContent = String(new Date().getFullYear());
    const saved = (() => { try { return localStorage.getItem("nabd_lang"); } catch(_) { return null; } })();
    setLang(saved === "en" ? "en" : "ar");
    $("languageButton").addEventListener("click", () => setLang(lang==="ar"?"en":"ar"));
    $("sessionForm").addEventListener("submit",saveAdminSession);
    const client = db();
    if (!client) {
      setText("accountStatus",tr("الخدمة غير متصلة؛ تصفح الموارد العامة أو افتح بوابة الطالب.", "Backend unavailable. Explore public resources or try the student portal."));
      renderSessions();
      return;
    }
    try {
      await loadSessions(client);
      const {data,error} = await client.auth.getUser();
      user = error ? null : data?.user || null;
      if (!user) {
        setText("accountStatus",tr("سجّل الدخول بحسابك الحالي في أكاديمية نبض لعرض تقدمك.", "Sign in with your existing academy account to see your progress."));
        return;
      }
      setText("studentAction",tr("إدارة الحساب", "Manage account"));
      const p = await client.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();
      profileName = p.data?.full_name || "";
      updateName();
      admin = p.data?.role === "admin";
      $("adminPanel").hidden = !admin;
      setText("accountStatus",tr("حساب مرتبط بشكل آمن ببوابة الطالب.", "Connected securely to your student portal."));
      await Promise.all([loadStudent(client,user.id),loadSignups(client)]);
    } catch (_) {
      setText("accountStatus",tr("تعذّر تحميل بيانات حسابك؛ استخدم بوابة الطالب.", "Unable to load account. Please use the student portal."));
    }
  }
  document.addEventListener("DOMContentLoaded",init);
})();
