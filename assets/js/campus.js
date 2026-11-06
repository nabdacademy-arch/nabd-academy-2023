"use strict";
(function () {
  const button = document.getElementById("lang");
  const root = document.documentElement;
  if (!button) return;
  let saved = "ar";
  try { saved = localStorage.getItem("nabd_lang") || "ar"; } catch (_) {}
  function apply(lang) {
    const ar = lang !== "en";
    root.lang = ar ? "ar" : "en";
    root.dir = ar ? "rtl" : "ltr";
    document.querySelectorAll("[data-ar][data-en]").forEach((element) => {
      const translated = element.getAttribute(ar ? "data-ar" : "data-en") || "";
      if (element.tagName === "H1") {
        // Translations are hardcoded strings from this project's own static HTML.
        element.innerHTML = translated;
      } else {
        element.textContent = translated;
      }
    });
    button.textContent = ar ? "EN" : "عربي";
    button.setAttribute("aria-label", ar ? "Switch to English" : "التحويل إلى العربية");
    document.title = ar ? "NABD Campus | الحرم الرقمي لأكاديمية نبض" : "NABD Campus | NABD Academy";
  }
  apply(saved === "en" ? "en" : "ar");
  button.addEventListener("click", () => {
    const next = root.lang === "ar" ? "en" : "ar";
    try { localStorage.setItem("nabd_lang", next); } catch (_) {}
    apply(next);
  });
})();
