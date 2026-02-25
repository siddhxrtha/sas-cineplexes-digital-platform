document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("featuredMovies");
  if (!container || !window.SAS) return;

  await window.SAS.whenMoviesReady;
  const featured = window.SAS.movies.slice(0, 12);
  if (!featured.length) {
    container.innerHTML = `
      <div class="col-12">
        <article class="glass-card p-4 text-center">
          <h3 class="h4 mb-2">Tamil lineup (2025-2026) is loading</h3>
          <p class="mb-0 text-secondary-custom">Please refresh in a moment to view the latest titles.</p>
        </article>
      </div>
    `;
    return;
  }

  container.innerHTML = featured
    .map(
      (movie) => `
        <div class="col-12 col-md-6 col-xl-4 col-xxl-3">
          <article class="movie-card glass-card h-100" data-reveal>
            <img src="${movie.poster}" alt="${movie.title} poster">
            <div class="card-body">
              <p class="kicker mb-2">${movie.genre} | ${movie.language} | ${(movie.releaseDate || "").slice(0, 4) || "2025"}</p>
              <h3 class="h4">${movie.title}</h3>
              <p class="movie-meta">${movie.rating} | ${movie.duration}</p>
              <div class="d-flex gap-2">
                <a class="btn btn-sm btn-outline-light route-link" href="movie.html?id=${movie.id}">Details</a>
                <a class="btn btn-sm btn-danger route-link" href="seats.html?id=${movie.id}">Book Now</a>
              </div>
            </div>
          </article>
        </div>
      `
    )
    .join("");
});
