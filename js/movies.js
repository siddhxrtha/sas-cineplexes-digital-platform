document.addEventListener("DOMContentLoaded", async () => {
  if (!window.SAS) return;

  const grid = document.getElementById("moviesGrid");
  const countText = document.getElementById("moviesCount");
  const searchInput = document.getElementById("searchMovies");
  const filterWrap = document.getElementById("genreFilters");

  if (!grid || !countText || !searchInput || !filterWrap) return;

  await window.SAS.whenMoviesReady;
  const allMovies = window.SAS.movies;
  if (!allMovies.length) {
    grid.innerHTML = `
      <div class="col-12">
        <article class="glass-card p-4 text-center">
          <h3 class="h4 mb-2">No Tamil movies for 2025-2026 right now</h3>
          <p class="mb-0 text-secondary-custom">Try refreshing the page to load the latest lineup.</p>
        </article>
      </div>
    `;
    countText.textContent = "0 movies in Tamil (2025-2026)";
    filterWrap.innerHTML = "";
    return;
  }
  const genres = ["All", ...new Set(allMovies.map((movie) => movie.genre))];
  let activeGenre = "All";

  filterWrap.innerHTML = genres
    .map(
      (genre) =>
        `<button class="filter-btn ${genre === "All" ? "active" : ""}" type="button" data-genre="${genre}">${genre}</button>`
    )
    .join("");

  const render = () => {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = allMovies.filter((movie) => {
      const genreMatch = activeGenre === "All" || movie.genre === activeGenre;
      const textMatch =
        movie.title.toLowerCase().includes(term) ||
        movie.language.toLowerCase().includes(term) ||
        movie.genre.toLowerCase().includes(term);
      return genreMatch && textMatch;
    });

    grid.innerHTML = filtered
      .map(
        (movie) => `
          <div class="col-12 col-md-6 col-xl-4 col-xxl-3">
            <article class="movie-card glass-card h-100" data-reveal>
              <img src="${movie.poster}" alt="${movie.title} poster">
              <div class="card-body">
                <p class="kicker mb-2">${movie.genre} | ${movie.language} | ${(movie.releaseDate || "").slice(0, 4) || "2025"}</p>
                <h3 class="h4">${movie.title}</h3>
                <p class="movie-meta">${movie.rating} | ${movie.duration}</p>
                <div class="d-flex flex-wrap gap-2 mb-3">
                  ${movie.formats.slice(0, 3).map((format) => `<span class="chip">${format}</span>`).join("")}
                </div>
                <div class="d-flex gap-2">
                  <a class="btn btn-sm btn-danger route-link" href="movie.html?id=${movie.id}">Select Showtimes</a>
                </div>
              </div>
            </article>
          </div>
        `
      )
      .join("");

    countText.textContent = `${filtered.length} movie${filtered.length === 1 ? "" : "s"} in Tamil (2025-2026)`;
  };

  filterWrap.addEventListener("click", (event) => {
    const button = event.target.closest("[data-genre]");
    if (!button) return;
    activeGenre = button.getAttribute("data-genre") || "All";
    filterWrap.querySelectorAll("[data-genre]").forEach((node) => {
      node.classList.toggle("active", node === button);
    });
    render();
  });

  searchInput.addEventListener("input", render);
  render();
});
