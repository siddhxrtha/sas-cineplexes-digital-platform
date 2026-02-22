document.addEventListener("DOMContentLoaded", async () => {
  if (!window.SAS) return;
  await window.SAS.whenMoviesReady;

  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const seatsPerRow = 12;

  const movieParam = window.SAS.getQueryParam("id");
  const timeParam = window.SAS.getQueryParam("time");
  const movie = window.SAS.getMovieById(movieParam) || window.SAS.movies[0];
  if (!movie) return;

  const dates = window.SAS.getUpcomingDates(5);
  let selectedDate = dates[0];
  let selectedTime = movie.showtimes.includes(timeParam) ? timeParam : movie.showtimes[0];
  let bookedSeats = new Set();
  const selectedSeats = new Map();

  const titleNode = document.getElementById("seatsMovieTitle");
  const dateOptions = document.getElementById("dateOptions");
  const timeOptions = document.getElementById("timeOptions");
  const seatGrid = document.getElementById("seatGrid");
  const summaryMovie = document.getElementById("summaryMovie");
  const summaryDate = document.getElementById("summaryDate");
  const summaryTime = document.getElementById("summaryTime");
  const summarySeats = document.getElementById("summarySeats");
  const subtotalAmount = document.getElementById("subtotalAmount");
  const feeAmount = document.getElementById("feeAmount");
  const taxAmount = document.getElementById("taxAmount");
  const totalAmount = document.getElementById("totalAmount");
  const continueButton = document.getElementById("continueCheckout");

  if (
    !titleNode ||
    !dateOptions ||
    !timeOptions ||
    !seatGrid ||
    !summaryMovie ||
    !summaryDate ||
    !summaryTime ||
    !summarySeats ||
    !subtotalAmount ||
    !feeAmount ||
    !taxAmount ||
    !totalAmount ||
    !continueButton
  ) {
    return;
  }

  titleNode.textContent = `${movie.title} (${movie.language})`;
  summaryMovie.textContent = movie.title;

  const tierForRow = (index) => {
    if (index <= 1) return "recliner";
    if (index <= 5) return "premium";
    return "standard";
  };

  const priceForTier = (tier) => window.SAS.pricing[tier];

  const getSeededBookedSeats = (seedValue) => {
    const allSeatIds = [];
    rows.forEach((row) => {
      for (let col = 1; col <= seatsPerRow; col += 1) {
        allSeatIds.push(`${row}${col}`);
      }
    });

    let seed = 0;
    for (let i = 0; i < seedValue.length; i += 1) {
      seed = (seed * 31 + seedValue.charCodeAt(i)) % 2147483647;
    }

    const picked = new Set();
    while (picked.size < 20) {
      seed = (seed * 48271) % 2147483647;
      const index = seed % allSeatIds.length;
      picked.add(allSeatIds[index]);
    }
    return picked;
  };

  const getTotals = () => {
    const seats = Array.from(selectedSeats.values());
    const subtotal = seats.reduce((sum, seat) => sum + seat.price, 0);
    const bookingFee = seats.length ? window.SAS.fees.booking : 0;
    const tax = (subtotal + bookingFee) * window.SAS.fees.taxRate;
    const total = subtotal + bookingFee + tax;
    return { subtotal, bookingFee, tax, total };
  };

  const updateSummary = () => {
    summaryDate.textContent = selectedDate.label;
    summaryTime.textContent = selectedTime;

    const sortedSeatIds = Array.from(selectedSeats.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    summarySeats.textContent = sortedSeatIds.length ? sortedSeatIds.join(", ") : "None";

    const totals = getTotals();
    subtotalAmount.textContent = window.SAS.formatCurrency(totals.subtotal);
    feeAmount.textContent = window.SAS.formatCurrency(totals.bookingFee);
    taxAmount.textContent = window.SAS.formatCurrency(totals.tax);
    totalAmount.textContent = window.SAS.formatCurrency(totals.total);

    continueButton.disabled = sortedSeatIds.length === 0;
  };

  const renderDateOptions = () => {
    dateOptions.innerHTML = dates
      .map(
        (date) => `
          <button class="option-btn ${date.iso === selectedDate.iso ? "active" : ""}" type="button" data-date="${date.iso}">
            ${date.label}
          </button>
        `
      )
      .join("");
  };

  const renderTimeOptions = () => {
    timeOptions.innerHTML = movie.showtimes
      .map(
        (time) => `
          <button class="option-btn ${time === selectedTime ? "active" : ""}" type="button" data-time="${time}">
            ${time}
          </button>
        `
      )
      .join("");
  };

  const renderSeats = () => {
    seatGrid.innerHTML = "";
    selectedSeats.clear();
    bookedSeats = getSeededBookedSeats(`${movie.id}-${selectedDate.iso}-${selectedTime}`);

    rows.forEach((row, rowIndex) => {
      for (let col = 1; col <= seatsPerRow; col += 1) {
        const seatId = `${row}${col}`;
        const tier = tierForRow(rowIndex);
        const price = priceForTier(tier);
        const button = document.createElement("button");
        button.type = "button";
        button.className = `seat-btn ${tier}`;
        button.textContent = col;
        button.setAttribute("aria-label", `Seat ${seatId}`);
        button.dataset.seatId = seatId;
        button.dataset.tier = tier;
        button.dataset.price = String(price);

        if (bookedSeats.has(seatId)) {
          button.classList.add("booked");
          button.disabled = true;
        }

        seatGrid.appendChild(button);
      }
    });

    updateSummary();
  };

  dateOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-date]");
    if (!button) return;
    const iso = button.getAttribute("data-date");
    const matched = dates.find((date) => date.iso === iso);
    if (!matched) return;
    selectedDate = matched;
    renderDateOptions();
    renderSeats();
  });

  timeOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-time]");
    if (!button) return;
    const time = button.getAttribute("data-time");
    if (!time) return;
    selectedTime = time;
    renderTimeOptions();
    renderSeats();
  });

  seatGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".seat-btn");
    if (!button || button.classList.contains("booked")) return;

    const seatId = button.dataset.seatId;
    const tier = button.dataset.tier;
    const price = Number(button.dataset.price || 0);
    if (!seatId || !tier) return;

    if (selectedSeats.has(seatId)) {
      selectedSeats.delete(seatId);
      button.classList.remove("selected");
    } else {
      selectedSeats.set(seatId, { id: seatId, tier, price });
      button.classList.add("selected");
    }
    updateSummary();
  });

  continueButton.addEventListener("click", () => {
    if (selectedSeats.size === 0) return;

    const totals = getTotals();
    const seats = Array.from(selectedSeats.values()).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    const booking = window.SAS.readBooking();
    booking.movieId = movie.id;
    booking.movieTitle = movie.title;
    booking.moviePoster = movie.poster;
    booking.showDate = selectedDate.iso;
    booking.showDateLabel = selectedDate.label;
    booking.showTime = selectedTime;
    booking.seats = seats;
    booking.pricing = {
      subtotal: totals.subtotal,
      fee: totals.bookingFee,
      tax: totals.tax,
      total: totals.total,
    };
    booking.updatedAt = new Date().toISOString();
    delete booking.customer;
    delete booking.payment;
    delete booking.bookingId;
    window.SAS.writeBooking(booking);
    window.location.href = "checkout.html";
  });

  renderDateOptions();
  renderTimeOptions();
  renderSeats();
});
