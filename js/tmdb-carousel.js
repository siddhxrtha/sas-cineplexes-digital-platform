document.addEventListener("DOMContentLoaded", async () => {
  const carouselNode = document.getElementById("tmdbCarousel");
  const innerNode = document.getElementById("tmdbCarouselInner");
  const indicatorsNode = document.getElementById("tmdbCarouselIndicators");
  if (!carouselNode || !innerNode || !indicatorsNode || !window.SAS) return;

  const quickBookForm = document.getElementById("quickBookForm");
  const quickBookBar = quickBookForm ? quickBookForm.closest(".quick-book-bar") : null;
  const quickBookToggle = document.getElementById("quickBookToggle");
  const quickMovie = document.getElementById("quickMovie");
  const quickCinema = document.getElementById("quickCinema");
  const quickExperience = document.getElementById("quickExperience");
  const quickDate = document.getElementById("quickDate");
  const quickShowtime = document.getElementById("quickShowtime");

  const heroPrev = document.getElementById("heroPrev");
  const heroNext = document.getElementById("heroNext");
  const heroProgressBar = document.getElementById("heroProgressBar");
  const heroCurrent = document.getElementById("heroCurrent");
  const heroTotal = document.getElementById("heroTotal");

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const getBackdropUrl = (movie) => movie.banner || movie.poster || "";

  const formatCounter = (value) => String(value).padStart(2, "0");

  const shortText = (value, maxLength = 190) => {
    const text = String(value || "").trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}...`;
  };

  const sideRailMarkup = (movies, activeIndex) =>
    [0, 1, 2]
      .map((offset) => {
        const movie = movies[(activeIndex + offset) % movies.length];
        if (!movie) return "";
        return `
          <article class="hero-poster-card ${offset === 0 ? "active" : ""}">
            <img src="${escapeHtml(movie.poster)}" alt="${escapeHtml(movie.title)} poster">
            <p>${escapeHtml(movie.title)}</p>
          </article>
        `;
      })
      .join("");

  const buildIndicators = (movies) => {
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
  };

  const renderSlides = (movies, options = {}) => {
    const { errorText = "", label = "Now Showing" } = options;
    buildIndicators(movies);

    innerNode.innerHTML = movies
      .map((movie, index) => {
        const safeTitle = escapeHtml(movie.title || "Untitled");
        const overview = escapeHtml(shortText(movie.description || "Synopsis is currently unavailable for this title."));
        const backdrop = getBackdropUrl(movie);
        const releaseYear = (movie.releaseDate || "").slice(0, 4) || "2025";
        const bookingTime = Array.isArray(movie.showtimes) && movie.showtimes.length ? movie.showtimes[0] : "7:00 PM";
        const bookingLink = `seats.html?id=${encodeURIComponent(movie.id)}&time=${encodeURIComponent(bookingTime)}`;
        const trailerQuery = encodeURIComponent(`${movie.title || "movie"} official trailer`);
        const trailerLink = `https://www.youtube.com/results?search_query=${trailerQuery}`;

        return `
          <div class="carousel-item ${index === 0 ? "active" : ""}">
            <div class="tmdb-slide" style="${backdrop ? `background-image: url('${backdrop}');` : ""}">
              <div class="tmdb-overlay"></div>
              <div class="container hero-layout">
                <div class="hero-main">
                  <p class="kicker mb-2">${escapeHtml(label)}</p>
                  <h1>${safeTitle}</h1>
                  <p class="hero-meta mb-2">${escapeHtml(releaseYear)} | ${escapeHtml(movie.rating || "New")} | ${escapeHtml(movie.duration || "TBA")}</p>
                  <p class="hero-overview mb-4">${overview}</p>
                  <div class="hero-actions d-flex flex-wrap gap-2">
                    <a href="${bookingLink}" class="btn btn-danger route-link">Book Now</a>
                    <a href="${trailerLink}" class="btn btn-outline-light" target="_blank" rel="noopener noreferrer">Watch Trailer</a>
                  </div>
                  ${
                    errorText && index === 0
                      ? `<p class="tmdb-error mt-3 mb-0"><i class="bi bi-exclamation-circle me-1"></i>${escapeHtml(errorText)}</p>`
                      : ""
                  }
                </div>
                <aside class="hero-side-rail d-none d-lg-flex">
                  ${sideRailMarkup(movies, index)}
                </aside>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  };

  const updateControls = (activeIndex, totalSlides) => {
    if (!heroCurrent || !heroTotal || !heroProgressBar) return;
    const safeTotal = Math.max(Number(totalSlides) || 1, 1);
    const safeIndex = Math.min(Math.max(Number(activeIndex) || 0, 0), safeTotal - 1);
    heroCurrent.textContent = formatCounter(safeIndex + 1);
    heroTotal.textContent = formatCounter(safeTotal);
    heroProgressBar.style.width = `${((safeIndex + 1) / safeTotal) * 100}%`;
  };

  const findMovieById = (movieId, movies) => movies.find((movie) => String(movie.id) === String(movieId));

  const setupQuickBook = (movies) => {
    if (!quickBookForm || !quickMovie || !quickShowtime || !quickDate) return;

    let quickBookOpen = false;
    const setQuickBookOpen = (open) => {
      quickBookOpen = Boolean(open);
      quickBookForm.classList.toggle("is-collapsed", !quickBookOpen);
      if (quickBookBar) quickBookBar.classList.toggle("is-open", quickBookOpen);
      if (quickBookToggle) quickBookToggle.setAttribute("aria-expanded", String(quickBookOpen));
    };

    if (quickBookToggle) {
      quickBookToggle.addEventListener("click", () => {
        setQuickBookOpen(!quickBookOpen);
      });
    }

    quickMovie.innerHTML = movies
      .slice(0, 24)
      .map((movie) => `<option value="${escapeHtml(movie.id)}">${escapeHtml(movie.title)}</option>`)
      .join("");

    const today = new Date();
    const isoToday = today.toISOString().split("T")[0];
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 4);
    const isoMaxDate = maxDate.toISOString().split("T")[0];
    quickDate.min = isoToday;
    quickDate.max = isoMaxDate;
    quickDate.value = isoToday;

    const refreshShowtimes = () => {
      const movie = findMovieById(quickMovie.value, movies) || movies[0];
      const showtimes = Array.isArray(movie && movie.showtimes) && movie.showtimes.length ? movie.showtimes : ["7:00 PM"];
      quickShowtime.innerHTML = showtimes
        .map((time) => `<option value="${escapeHtml(time)}">${escapeHtml(time)}</option>`)
        .join("");
    };

    quickMovie.addEventListener("change", refreshShowtimes);

    quickBookForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const movie = findMovieById(quickMovie.value, movies) || movies[0];
      if (!movie) return;

      const params = new URLSearchParams({
        id: String(movie.id),
        time: quickShowtime.value || (movie.showtimes && movie.showtimes[0]) || "7:00 PM",
        date: quickDate.value || isoToday,
        cinema: quickCinema && quickCinema.value ? quickCinema.value : "SAS Downtown",
        exp: quickExperience && quickExperience.value ? quickExperience.value : "2D",
      });

      window.location.href = `seats.html?${params.toString()}`;
    });

    setQuickBookOpen(false);
    refreshShowtimes();
  };

  await window.SAS.whenMoviesReady;
  const slides = window.SAS.movies.slice(0, 10);

  if (!slides.length) {
    innerNode.innerHTML = `
      <div class="carousel-item active">
        <div class="tmdb-slide fallback-slide">
          <div class="tmdb-overlay"></div>
          <div class="container hero-layout">
            <div class="hero-main">
              <p class="kicker mb-2">Carousel Unavailable</p>
              <h1>We could not load movies right now.</h1>
              <p class="hero-overview mb-4">Please refresh to try again.</p>
              <a href="movies.html" class="btn btn-danger route-link">Browse Movies</a>
            </div>
            <aside class="hero-side-rail d-none d-lg-flex"></aside>
          </div>
        </div>
      </div>
    `;
    indicatorsNode.innerHTML = `
      <button type="button" data-bs-target="#tmdbCarousel" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
    `;
    updateControls(0, 1);
    return;
  }

  renderSlides(slides, { label: "Now Showing Tamil 2025-2026" });
  setupQuickBook(slides);

  const instance = window.bootstrap && window.bootstrap.Carousel
    ? window.bootstrap.Carousel.getOrCreateInstance(carouselNode, {
        interval: 6200,
        ride: true,
        pause: "hover",
        touch: true,
      })
    : null;

  if (instance) {
    instance.cycle();
    if (heroPrev) heroPrev.addEventListener("click", () => instance.prev());
    if (heroNext) heroNext.addEventListener("click", () => instance.next());
  }

  updateControls(0, slides.length);

  carouselNode.addEventListener("slid.bs.carousel", (event) => {
    const index = typeof event.to === "number" ? event.to : 0;
    updateControls(index, slides.length);
  });
});
