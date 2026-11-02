
/* ==========================================
   NABD GLOBAL MEDICAL ECOSYSTEM
   Frontend Interaction Engine
   Version 1.0
   ========================================== */

(() => {
  "use strict";

  const NABD = {
    version: "1.0.0",

    init() {
      this.setCurrentYear();
      this.initMobileMenu();
      this.initRevealAnimations();
      this.initCounters();
      this.initSearch();
      this.initSmoothScroll();
      this.initLanguageControls();

      console.info(
        `NABD Ecosystem initialized — v${this.version}`
      );
    },

    // Automatically update copyright year
    setCurrentYear() {
      document.querySelectorAll("[data-nabd-year]")
        .forEach(element => {
          element.textContent = new Date().getFullYear();
        });
    },

    // Responsive navigation
    initMobileMenu() {
      const toggle = document.querySelector(
        "[data-nabd-menu-toggle]"
      );

      const menu = document.querySelector(
        "[data-nabd-menu]"
      );

      if (!toggle || !menu) return;

      toggle.addEventListener("click", () => {
        const isOpen =
          toggle.getAttribute("aria-expanded") === "true";

        toggle.setAttribute(
          "aria-expanded",
          String(!isOpen)
        );

        menu.classList.toggle("is-open", !isOpen);
      });

      menu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
          menu.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    },

    // Reveal elements when scrolling
    initRevealAnimations() {
      const elements = document.querySelectorAll(
        "[data-nabd-reveal]"
      );

      if (!elements.length) return;

      if (!("IntersectionObserver" in window)) {
        elements.forEach(el => {
          el.classList.add("is-visible");
        });
        return;
      }

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );

      elements.forEach(el => observer.observe(el));
    },

    // Animated statistics
    initCounters() {
      const counters = document.querySelectorAll(
        "[data-nabd-counter]"
      );

      if (!counters.length) return;

      const animate = element => {
        const target = Number(
          element.getAttribute("data-nabd-counter")
        );

        if (!Number.isFinite(target)) return;

        const duration = 1400;
        const start = performance.now();

        const update = now => {
          const progress = Math.min(
            (now - start) / duration,
            1
          );

          const eased = 1 - Math.pow(1 - progress, 3);

          element.textContent = Math.round(
            target * eased
          ).toLocaleString();

          if (progress < 1) {
            requestAnimationFrame(update);
          }
        };

        requestAnimationFrame(update);
      };

      if (!("IntersectionObserver" in window)) {
        counters.forEach(animate);
        return;
      }

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              animate(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );

      counters.forEach(counter => observer.observe(counter));
    },

    // Frontend search and filtering
    initSearch() {
      const inputs = document.querySelectorAll(
        "[data-nabd-search]"
      );

      inputs.forEach(input => {
        const targetSelector =
          input.getAttribute("data-nabd-search");

        const container = document.querySelector(
          targetSelector
        );

        if (!container) return;

        input.addEventListener("input", () => {
          const query = input.value
            .trim()
            .toLocaleLowerCase();

          container.querySelectorAll(
            "[data-nabd-search-item]"
          ).forEach(item => {
            const content =
              item.textContent.toLocaleLowerCase();

            item.hidden = !content.includes(query);
          });
        });
      });
    },

    // Smooth internal navigation
    initSmoothScroll() {
      document.querySelectorAll(
        'a[href^="#"]'
      ).forEach(link => {
        link.addEventListener("click", event => {
          const id = link.getAttribute("href");

          if (!id || id === "#") return;

          const target = document.querySelector(id);

          if (!target) return;

          event.preventDefault();

          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        });
      });
    },

    // Arabic / English interface direction
    initLanguageControls() {
      document.querySelectorAll(
        "[data-nabd-language]"
      ).forEach(button => {
        button.addEventListener("click", () => {
          const language =
            button.getAttribute("data-nabd-language");

          if (!["ar", "en"].includes(language)) return;

          document.documentElement.lang = language;
          document.documentElement.dir =
            language === "ar" ? "rtl" : "ltr";

          document.dispatchEvent(
            new CustomEvent("nabd:languagechange", {
              detail: { language }
            })
          );
        });
      });
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    NABD.init();
  });

  window.NABD = NABD;

})();
