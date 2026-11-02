(() => {
  "use strict";

  const translations = {
    ar: {
      about: "عن المنظومة",
      learning: "التعلّم",
      clinical: "المختبر السريري",
      intelligence: "الذكاء الطبي",
      eyebrow: "FROM GAZA TO THE WORLD",
      title: "نحو مستقبل جديد<br><em>للتعليم الطبي.</em>",
      intro: "منظومة تعليمية طبية رقمية تجمع المعرفة العلمية والتفكير السريري والتقنيات الحديثة في تجربة تعليمية واحدة.",
      explore: "اكتشف المنظومة ←",
      learningEyebrow: "LEARNING ECOSYSTEM",
      learningTitle: "مسارات تصنع الفارق.",
      clinicalTitle: "فكّر كطبيب، لا تحفظ الإجابة فقط.",
      intelligenceTitle: "ذكاء يخدم المعرفة الطبية.",
      footer: "المعرفة بلا حدود. التعليم من أجل الإنسانية."
    },
    en: {
      about: "About",
      learning: "Learning",
      clinical: "Clinical Lab",
      intelligence: "Medical Intelligence",
      eyebrow: "FROM GAZA TO THE WORLD",
      title: "A new future<br><em>for medical education.</em>",
      intro: "A digital medical education ecosystem connecting scientific knowledge, clinical reasoning and modern technology.",
      explore: "Explore the ecosystem →",
      learningEyebrow: "LEARNING ECOSYSTEM",
      learningTitle: "Learning pathways that make a difference.",
      clinicalTitle: "Think like a clinician. Do not just memorize.",
      intelligenceTitle: "Intelligence serving medical knowledge.",
      footer: "Knowledge without borders. Education for humanity."
    }
  };

  const languageButton = document.getElementById("language");
  let currentLanguage = "ar";

  function setLanguage(language) {
    currentLanguage = language;
    const t = translations[language];

    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

    const navLinks = document.querySelectorAll(".topbar nav a");
    const navKeys = ["about", "learning", "clinical", "intelligence"];

    navLinks.forEach((link, index) => {
      link.textContent = t[navKeys[index]];
    });

    document.querySelector(".hero .eyebrow").textContent = t.eyebrow;
    document.querySelector(".hero h1").innerHTML = t.title;
    document.querySelector(".hero > p").textContent = t.intro;
    document.querySelector(".hero .primary").textContent = t.explore;

    const sections = document.querySelectorAll(".section");
    sections[0].querySelector(".eyebrow").textContent = t.learningEyebrow;
    sections[0].querySelector("h2").textContent = t.learningTitle;
    sections[1].querySelector("h2").textContent = t.clinicalTitle;
    sections[2].querySelector("h2").textContent = t.intelligenceTitle;

    document.querySelector("footer p").textContent = t.footer;

    languageButton.textContent = language === "ar" ? "EN" : "AR";
  }

  languageButton?.addEventListener("click", () => {
    setLanguage(currentLanguage === "ar" ? "en" : "ar");
  });

  const checkButton = document.getElementById("check");
  const answer = document.getElementById("answer");
  const feedback = document.getElementById("feedback");

  checkButton?.addEventListener("click", () => {
    if (!answer.value) {
      feedback.textContent = "يرجى اختيار إجابة أولاً.";
      feedback.style.color = "#ffc66d";
      return;
    }

    if (answer.value === "correct") {
      feedback.textContent = "إجابة تعليمية صحيحة: استكمال التاريخ المرضي والفحص خطوة مناسبة قبل تحديد التشخيص.";
      feedback.style.color = "#53e0d0";
    } else {
      feedback.textContent = "ليست الإجابة المناسبة. راجع المعطيات وفكر في التقييم السريري أولاً.";
      feedback.style.color = "#ff9b9b";
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  console.info("NABD Global Medical Ecosystem — Interface initialized.");
})();
