/* NABD Global Research Network: presentation only. No secrets, PII or backend mutation here. */
(() => {
  "use strict";
  const langButton = document.getElementById("language");
  const translatable = Array.from(document.querySelectorAll("[data-ar][data-en]"));
  const filters = Array.from(document.querySelectorAll("[data-filter]"));
  const opportunities = Array.from(document.querySelectorAll(".opp[data-category]"));
  let language = "ar";
  let currentFilter = "all";

  const readPreference = () => {
    try {
      const value = localStorage.getItem("nabd-lang") || localStorage.getItem("nabd_lang");
      return value === "en" ? "en" : "ar";
    } catch (_) {
      return "ar";
    }
  };

  const updateFilter = (category) => {
    currentFilter = category;
    let shown = 0;
    opportunities.forEach((item) => {
      const matches = category === "all" || (item.dataset.category || "").split(" ").includes(category);
      item.hidden = !matches;
      if (matches) shown += 1;
    });
    filters.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === category)));
    const status = document.getElementById("filterStatus");
    if (status) {
      status.textContent = language === "ar"
        ? \`المسارات المعروضة: \${shown} — لا يوجد تسجيل مفتوح حاليًا.\`
        : \`Showing \${shown} pathway(s) — applications are not currently open.\`;
    }
  };

  const updateLanguage = (selected) => {
    language = selected === "en" ? "en" : "ar";
    const arabic = language === "ar";
    document.documentElement.lang = language;
    document.documentElement.dir = arabic ? "rtl" : "ltr";
    translatable.forEach((node) => {
      const html = node.getAttribute(arabic ? "data-ar" : "data-en");
      // Only first-party, static translations in the document are rendered as markup.
      if (html !== null) node.innerHTML = html;
    });
    if (langButton) langButton.textContent = arabic ? "English" : "العربية";
    try { localStorage.setItem("nabd-lang", language); } catch (_) {}
    updateFilter(currentFilter);
  };

  filters.forEach((button) => button.addEventListener("click", () => updateFilter(button.dataset.filter)));
  if (langButton) langButton.addEventListener("click", () => updateLanguage(language === "ar" ? "en" : "ar"));
  updateLanguage(readPreference());
})();