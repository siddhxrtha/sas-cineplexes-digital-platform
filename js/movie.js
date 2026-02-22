document.addEventListener("DOMContentLoaded", async () => {
  if (!window.SAS) return;

  await window.SAS.whenMoviesReady;
  const movieId = window.SAS.getQueryParam("id");
  const movie = window.SAS.getMovieById(movieId) || window.SAS.movies[0];
  if (!movie) {
    window.location.href = "movies.html";
    return;
  }

  const titleNode = document.getElementById("movieTitle");
  const genreNode = document.getElementById("movieGenre");
  const metaNode = document.getElementById("movieMeta");
  const descriptionNode = document.getElementById("movieDescription");
  const formatsNode = document.getElementById("movieFormats");
  const posterNode = document.getElementById("moviePoster");
  const bgNode = document.getElementById("movieHeroBg");
  const timesNode = document.getElementById("showtimeButtons");
  const bookBtn = document.getElementById("bookNowBtn");

  if (!titleNode || !genreNode || !metaNode || !descriptionNode || !formatsNode || !posterNode || !bgNode || !timesNode || !bookBtn) return;

  document.title = `SAS Cineplexes | ${movie.title}`;
  titleNode.textContent = movie.title;
  genreNode.textContent = `${movie.genre} | ${movie.language}`;
  const releaseYear = movie.releaseDate ? String(movie.releaseDate).slice(0, 4) : "Upcoming";
  metaNode.textContent = `${movie.rating} | ${movie.duration} | ${releaseYear}`;
  descriptionNode.textContent = movie.description;
  posterNode.src = movie.poster;
  posterNode.alt = `${movie.title} poster`;
  bgNode.style.backgroundImage = `linear-gradient(rgba(8,12,24,0.65), rgba(8,12,24,0.72)), url('${movie.banner}')`;

  formatsNode.innerHTML = movie.formats.map((format) => `<span class="chip">${format}</span>`).join("");

  timesNode.innerHTML = movie.showtimes
    .map(
      (time) =>
        `<a class="option-btn route-link text-decoration-none" href="seats.html?id=${movie.id}&time=${encodeURIComponent(time)}">${time}</a>`
    )
    .join("");

  bookBtn.href = `seats.html?id=${movie.id}&time=${encodeURIComponent(movie.showtimes[0])}`;
});
