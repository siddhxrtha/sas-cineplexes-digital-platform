document.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => {
    document.body.classList.add("page-ready");
  });

  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  const navProxy = {
    "payment.html": "checkout.html",
    "confirmation.html": "checkout.html",
    "movie.html": "movies.html",
  };
  const activeFile = navProxy[currentFile] || currentFile;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const navFile = link.getAttribute("data-nav");
    link.classList.toggle("active", navFile === activeFile);
  });

  const canObserve = "IntersectionObserver" in window;
  const revealObserver = canObserve
    ? new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.16 }
      )
    : null;

  const registerReveals = (scope = document) => {
    scope.querySelectorAll("[data-reveal]").forEach((node) => {
      if (node.dataset.revealBound === "1") return;
      node.dataset.revealBound = "1";
      if (revealObserver) {
        revealObserver.observe(node);
      } else {
        node.classList.add("is-visible");
      }
    });
  };
  registerReveals();

  const dynamicObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((added) => {
        if (!(added instanceof Element)) return;
        if (added.matches("[data-reveal]")) {
          registerReveals(added.parentElement || document);
        } else {
          registerReveals(added);
        }
      });
    });
  });
  dynamicObserver.observe(document.body, { childList: true, subtree: true });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    let url;
    try {
      url = new URL(href, window.location.href);
    } catch (_error) {
      return;
    }

    if (url.origin !== window.location.origin) return;
    if (!url.pathname.endsWith(".html")) return;

    const sameLocation =
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      url.hash === window.location.hash;
    if (sameLocation) return;

    event.preventDefault();
    document.body.classList.add("page-exit");
    window.setTimeout(() => {
      window.location.href = url.href;
    }, 180);
  });
});
