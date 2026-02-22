(() => {
  const TMDB_API_KEY = "fb9193505c46cec231c1857187e17d9a";
  const TMDB_API_BASE = "https://api.themoviedb.org/3";
  const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/";
  const CATALOG_YEAR = 2026;
  const movies = [];
  const defaultShowtimes = ["10:30 AM", "1:20 PM", "4:10 PM", "7:00 PM", "9:50 PM"];

  const languageMap = {
    ta: "Tamil",
    te: "Telugu",
    hi: "Hindi",
    ml: "Malayalam",
    kn: "Kannada",
    en: "English",
  };

  const formatPresets = [
    ["4K Laser", "Dolby Atmos", "2D"],
    ["IMAX", "Dolby Atmos", "2D"],
    ["Recliner Hall", "Dolby Audio", "2D"],
  ];

  const getImageUrl = (path, size = "w780") => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${TMDB_IMAGE_BASE}${size}${path}`;
  };

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42);

  const getMovieId = (movie) => {
    if (movie && movie.id !== undefined && movie.id !== null) return String(movie.id);
    return slugify(movie && movie.title ? movie.title : "movie");
  };

  const getLanguageLabel = (languageCode) => {
    const code = String(languageCode || "").toLowerCase();
    if (languageMap[code]) return languageMap[code];
    return code ? code.toUpperCase() : "Unknown";
  };

  const getRatingLabel = (voteAverage) =>
    typeof voteAverage === "number" && voteAverage > 0 ? `${voteAverage.toFixed(1)}/10` : "New";

  const getDurationLabel = (runtime) => {
    const minutes = Number(runtime);
    if (!Number.isFinite(minutes) || minutes <= 0) return "TBA";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`;
  };

  const buildShowtimes = (index) => {
    const offset = index % defaultShowtimes.length;
    return defaultShowtimes.map((_, slotIndex) => {
      const mappedIndex = (slotIndex + offset) % defaultShowtimes.length;
      return defaultShowtimes[mappedIndex];
    });
  };

  const fetchJson = async (endpoint, params = {}) => {
    const query = new URLSearchParams({
      api_key: TMDB_API_KEY,
      language: "en-US",
      ...params,
    });
    const response = await fetch(`${TMDB_API_BASE}${endpoint}?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`TMDB request failed (${response.status})`);
    }
    return response.json();
  };

  const fetchGenreMap = async () => {
    const data = await fetchJson("/genre/movie/list");
    const map = {};
    (data.genres || []).forEach((genre) => {
      map[String(genre.id)] = genre.name;
    });
    return map;
  };

  const fetchCatalogMovies = async () => {
    const discoverRequests = [1, 2, 3, 4].map((page) =>
      fetchJson("/discover/movie", {
        include_adult: "false",
        include_video: "false",
        sort_by: "popularity.desc",
        region: "IN",
        with_origin_country: "IN",
        primary_release_year: String(CATALOG_YEAR),
        page: String(page),
      })
    );

    const responses = await Promise.all(discoverRequests);
    const allResults = responses.flatMap((data) => (Array.isArray(data.results) ? data.results : []));
    const deduped = [];
    const seen = new Set();

    allResults.forEach((movie) => {
      if (!movie || seen.has(movie.id)) return;
      if (!movie.poster_path && !movie.backdrop_path) return;
      if (!movie.release_date || !movie.release_date.startsWith(String(CATALOG_YEAR))) return;
      seen.add(movie.id);
      deduped.push(movie);
    });

    deduped.sort((a, b) => {
      const scoreA = Number(a.popularity || 0) + Number(a.vote_count || 0) * 0.05;
      const scoreB = Number(b.popularity || 0) + Number(b.vote_count || 0) * 0.05;
      return scoreB - scoreA;
    });

    return deduped.slice(0, 64);
  };

  const fetchRuntimeMap = async (movieIds) => {
    const runtimeMap = {};
    const requestIds = movieIds.slice(0, 24);
    const responses = await Promise.all(
      requestIds.map((movieId) =>
        fetchJson(`/movie/${movieId}`).catch(() => null)
      )
    );

    responses.forEach((detail) => {
      if (!detail || detail.id === undefined || detail.id === null) return;
      runtimeMap[String(detail.id)] = Number(detail.runtime || 0);
    });
    return runtimeMap;
  };

  const toMovieCard = (movie, index, genreMap, runtimeMap) => {
    const primaryGenre =
      Array.isArray(movie.genre_ids) && movie.genre_ids.length > 0
        ? genreMap[String(movie.genre_ids[0])] || "Cinema"
        : "Cinema";
    const movieId = getMovieId(movie);
    const runtime = runtimeMap[movieId] || 0;
    const title = movie.title || movie.name || "Untitled";

    return {
      id: movieId,
      tmdbId: Number(movie.id) || null,
      title,
      genre: primaryGenre,
      language: getLanguageLabel(movie.original_language),
      rating: getRatingLabel(movie.vote_average),
      duration: getDurationLabel(runtime),
      formats: formatPresets[index % formatPresets.length],
      poster: getImageUrl(movie.poster_path, "w780") || getImageUrl(movie.backdrop_path, "w780"),
      banner: getImageUrl(movie.backdrop_path, "w1280") || getImageUrl(movie.poster_path, "w780"),
      description: movie.overview || "Synopsis is currently unavailable for this title.",
      showtimes: buildShowtimes(index),
      releaseDate: movie.release_date || "",
      voteAverage: Number(movie.vote_average || 0),
      voteCount: Number(movie.vote_count || 0),
    };
  };

  const loadMovies = async () => {
    try {
      const [genreMap, catalog] = await Promise.all([fetchGenreMap(), fetchCatalogMovies()]);
      const runtimeMap = await fetchRuntimeMap(catalog.map((movie) => movie.id));
      const normalized = catalog
        .map((movie, index) => toMovieCard(movie, index, genreMap, runtimeMap))
        .filter((movie) => movie.poster && movie.banner);

      movies.splice(0, movies.length, ...normalized);
      return movies;
    } catch (_error) {
      movies.splice(0, movies.length);
      return movies;
    }
  };

  const whenMoviesReady = loadMovies();

  const pricing = {
    standard: 12,
    premium: 18,
    recliner: 24,
  };

  const fees = {
    booking: 2.5,
    taxRate: 0.07,
  };

  const storageKeys = {
    booking: "sas_booking_session_v1",
  };

  const getMovieById = (id) => movies.find((movie) => String(movie.id) === String(id));

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(Number(value) || 0);

  const getUpcomingDates = (count = 5) => {
    const now = new Date();
    const list = [];
    for (let i = 0; i < count; i += 1) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const iso = date.toISOString().split("T")[0];
      const day = new Intl.DateTimeFormat("en-SG", { weekday: "short" }).format(date);
      const shortDate = new Intl.DateTimeFormat("en-SG", { day: "2-digit", month: "short" }).format(date);
      list.push({
        iso,
        label: `${day}, ${shortDate}`,
      });
    }
    return list;
  };

  const readBooking = () => {
    try {
      const raw = localStorage.getItem(storageKeys.booking);
      return raw ? JSON.parse(raw) : {};
    } catch (_error) {
      return {};
    }
  };

  const writeBooking = (payload) => {
    localStorage.setItem(storageKeys.booking, JSON.stringify(payload));
  };

  const clearBooking = () => {
    localStorage.removeItem(storageKeys.booking);
  };

  const generateBookingId = () => {
    const time = Date.now().toString().slice(-6);
    const rand = Math.floor(Math.random() * 900 + 100);
    return `SAS-${time}-${rand}`;
  };

  const getQueryParam = (name) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  };

  window.SAS = {
    movies,
    whenMoviesReady,
    loadMovies,
    pricing,
    fees,
    getMovieById,
    formatCurrency,
    getUpcomingDates,
    readBooking,
    writeBooking,
    clearBooking,
    generateBookingId,
    getQueryParam,
    catalogYear: CATALOG_YEAR,
  };
})();
