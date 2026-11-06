/* NABD Campus: one entry on home, two optimized modes. No backend changes. */
(function () {
  "use strict";
  var KEY = "nabd_campus_mode";
  var path = (window.location.pathname || "").split("/").pop().toLowerCase();
  var onAdvanced = path === "nabd-campus.html";
  var onLite = path === "campus.html";
  var current = "advanced";
  try {
    current = localStorage.getItem(KEY) === "lite" ? "lite" : "advanced";
    if (onAdvanced || onLite) {
      current = onLite ? "lite" : "advanced";
      localStorage.setItem(KEY, current);
    }
  } catch (_) {
    if (onLite) current = "lite";
  }
  var labels = {
    advanced: { ar: "الوضع الحالي: تجربة متقدمة تتضمن بيانات حسابك حسب صلاحياتك", en: "Selected: advanced campus with your authorized account features" },
    lite: { ar: "الوضع الحالي: نسخة خفيفة للاتصال الضعيف", en: "Selected: lightweight campus for slow connections" }
  };
  function updateHome() {
    var primary = document.querySelector("[data-campus-primary]");
    var status = document.querySelector("[data-campus-preference]");
    var advanced = document.querySelector('[data-campus-switch="advanced"]');
    var lite = document.querySelector('[data-campus-switch="lite"]');
    if (primary) primary.href = current === "lite" ? "campus.html" : "nabd-campus.html";
    if (status) {
      status.setAttribute("data-ar", labels[current].ar);
      status.setAttribute("data-en", labels[current].en);
      var lang = (document.documentElement.getAttribute("lang") || "ar").toLowerCase();
      status.textContent = lang.startsWith("ar") ? labels[current].ar : labels[current].en;
    }
    [advanced,lite].forEach(function (link) {
      if (!link) return;
      link.setAttribute("data-selected", link.getAttribute("data-campus-switch") === current ? "true" : "false");
    });
  }
  document.querySelectorAll("[data-campus-switch]").forEach(function (link) {
    link.addEventListener("click", function () {
      var next = link.getAttribute("data-campus-switch");
      if (next !== "advanced" && next !== "lite") return;
      current = next;
      try { localStorage.setItem(KEY, current); } catch (_) {}
      updateHome();
    });
  });
  updateHome();
  // Keep the selection status localized when the main site's existing language toggle runs.
  if (document.querySelector("[data-campus-preference]")) {
    var observer = new MutationObserver(updateHome);
    observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  }
})();
