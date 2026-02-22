document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealElements = document.querySelectorAll(".reveal");
  if (revealElements.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  const navLinks = document.querySelectorAll(".navbar .nav-link[href^='#']");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });

  const sectionIds = ["home", "story", "show-times", "contact"];
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach((item) => {
            item.classList.toggle("active", item.getAttribute("href") === `#${id}`);
          });
        }
      });
    },
    { threshold: 0.45, rootMargin: "-10% 0px -35% 0px" }
  );

  sectionIds.forEach((id) => {
    const section = document.getElementById(id);
    if (section) {
      sectionObserver.observe(section);
    }
  });

  const progressFill = document.querySelector(".progress-fill");
  const parallaxElements = document.querySelectorAll("[data-parallax]");

  const updateScrollEffects = () => {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

    if (progressFill) {
      progressFill.style.transform = `scaleX(${progress.toFixed(4)})`;
    }

    if (!prefersReducedMotion) {
      parallaxElements.forEach((element) => {
        const speed = Number(element.getAttribute("data-parallax")) || 0;
        const rect = element.getBoundingClientRect();
        const offset = (window.innerHeight * 0.5 - rect.top) * speed;
        element.style.setProperty("--parallax-shift", `${offset.toFixed(2)}px`);
      });
    }
  };

  let ticking = false;
  const handleScroll = () => {
    if (ticking) return;
    window.requestAnimationFrame(() => {
      updateScrollEffects();
      ticking = false;
    });
    ticking = true;
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleScroll);
  updateScrollEffects();

  const chapters = document.querySelectorAll(".story-chapter");
  const sceneImage = document.getElementById("sceneImage");
  const sceneTag = document.getElementById("sceneTag");
  const sceneTitle = document.getElementById("sceneTitle");
  const sceneDetails = document.getElementById("sceneDetails");

  const setScene = (chapter) => {
    if (!chapter || !sceneImage || !sceneTag || !sceneTitle || !sceneDetails) return;

    chapters.forEach((item) => item.classList.remove("is-active"));
    chapter.classList.add("is-active");

    const nextImage = chapter.getAttribute("data-scene-image");
    const nextTag = chapter.getAttribute("data-scene-tag");
    const nextTitle = chapter.getAttribute("data-scene-title");
    const nextDetails = chapter.getAttribute("data-scene-details");

    if (nextImage && sceneImage.getAttribute("src") !== nextImage) {
      sceneImage.classList.add("is-swapping");
      window.setTimeout(() => {
        sceneImage.setAttribute("src", nextImage);
        sceneImage.classList.remove("is-swapping");
      }, 130);
    }

    if (nextTag) sceneTag.textContent = nextTag;
    if (nextTitle) sceneTitle.textContent = nextTitle;
    if (nextDetails) sceneDetails.textContent = nextDetails;
  };

  if (chapters.length) {
    setScene(chapters[0]);

    const chapterObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length) {
          setScene(visibleEntries[0].target);
        }
      },
      { threshold: [0.45, 0.65], rootMargin: "-20% 0px -30% 0px" }
    );

    chapters.forEach((chapter) => chapterObserver.observe(chapter));
  }

  const cursorGlow = document.querySelector(".cursor-glow");
  if (cursorGlow && !prefersReducedMotion) {
    window.addEventListener(
      "pointermove",
      (event) => {
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
      },
      { passive: true }
    );
  }
});
