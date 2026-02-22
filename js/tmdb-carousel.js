document.addEventListener("DOMContentLoaded", async () => {
  const carouselNode = document.getElementById("tmdbCarousel");
  const innerNode = document.getElementById("tmdbCarouselInner");
  const indicatorsNode = document.getElementById("tmdbCarouselIndicators");
  if (!carouselNode || !innerNode || !indicatorsNode || !window.SAS) return;

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const getBackdropUrl = (movie) => movie.banner || movie.poster || "";

  const buildTags = (movie) => {
    const tags = [];
    if (movie.language) tags.push(movie.language);
    if (movie.genre) tags.push(movie.genre);
    if (movie.releaseDate) tags.push(String(movie.releaseDate).slice(0, 4));
    return tags.slice(0, 3);
  };

  const renderSlides = (movies, options = {}) => {
    const { errorText = "", label = "Featured Movies" } = options;
    indicatorsNode.innerHTML = movies
      .map(
        (_movie, index) => `
          <button
            type="button"
            data-bs-target="#tmdbCarousel"
            data-bs-slide-to="${index}"
            class="${index === 0 ? "active" : ""}"
            ${index === 0 ? 'aria-current="true"' : ""}
            aria-label="Slide ${index + 1}">
          </button>
        `
      )
      .join("");

    innerNode.innerHTML = movies
      .map((movie, index) => {
        const safeTitle = escapeHtml(movie.title || "Untitled");
        const overview = escapeHtml(movie.description || "Synopsis is currently unavailable for this title.");
        const backdrop = getBackdropUrl(movie);
        const releaseYear = (movie.releaseDate || "").slice(0, 4) || "2026";
        const tagMarkup = buildTags(movie)
          .map((tag) => `<span class="tmdb-tag">${escapeHtml(tag)}</span>`)
          .join("");
        const bookingLink = `seats.html?id=${encodeURIComponent(movie.id)}`;
        const detailsLink = `movie.html?id=${encodeURIComponent(movie.id)}`;

        return `
          <div class="carousel-item ${index === 0 ? "active" : ""}">
            <div class="tmdb-slide" style="${backdrop ? `background-image: url('${backdrop}');` : ""}">
              <div class="tmdb-overlay"></div>
              <div class="container tmdb-caption-wrap">
                <div class="tmdb-caption glass-card">
                  <p class="kicker mb-2">${escapeHtml(label)}</p>
                  <h1>${safeTitle}</h1>
                  <p class="tmdb-meta mb-2">
                    ${escapeHtml(releaseYear)} | ${escapeHtml(movie.rating || "New")} | ${escapeHtml(movie.duration || "TBA")}
                  </p>
                  <div class="tmdb-tags">${tagMarkup}</div>
                  <p class="tmdb-overview mb-4">${overview}</p>
                  <div class="d-flex flex-wrap gap-2">
                    <a href="${bookingLink}" class="btn btn-danger route-link">Book Tickets</a>
                    <a href="${detailsLink}" class="btn btn-outline-light route-link">Movie Details</a>
                  </div>
                  ${
                    errorText && index === 0
                      ? `<p class="tmdb-error mt-3 mb-0"><i class="bi bi-exclamation-circle me-1"></i>${escapeHtml(errorText)}</p>`
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    if (window.bootstrap && window.bootstrap.Carousel) {
      const instance = window.bootstrap.Carousel.getOrCreateInstance(carouselNode, {
        interval: 5500,
        ride: true,
        pause: "hover",
        touch: true,
      });
      instance.cycle();
    }
  };

  await window.SAS.whenMoviesReady;
  const slides = window.SAS.movies.slice(0, 8);

  if (slides.length) {
    renderSlides(slides, { label: "Featured Movies 2026" });
    return;
  }

  innerNode.innerHTML = `
    <div class="carousel-item active">
      <div class="tmdb-slide fallback-slide">
        <div class="tmdb-overlay"></div>
        <div class="container tmdb-caption-wrap">
          <div class="tmdb-caption glass-card">
            <p class="kicker mb-2">Carousel Unavailable</p>
            <h1>We could not load movies right now.</h1>
            <p class="tmdb-error mb-4">Please refresh to try again.</p>
            <a href="movies.html" class="btn btn-danger route-link">Browse Movies</a>
          </div>
        </div>
      </div>
    </div>
  `;
  indicatorsNode.innerHTML = `
    <button type="button" data-bs-target="#tmdbCarousel" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
  `;
});
