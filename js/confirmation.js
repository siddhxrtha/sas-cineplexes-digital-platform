document.addEventListener("DOMContentLoaded", () => {
  if (!window.SAS) return;

  const booking = window.SAS.readBooking();
  if (!booking.movieId || !booking.payment || !booking.pricing || !booking.bookingId) {
    window.location.href = "payment.html";
    return;
  }

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  setText("bookingId", booking.bookingId);
  setText("confirmMovie", booking.movieTitle || "-");
  setText("confirmDate", booking.showDateLabel || booking.showDate || "-");
  setText("confirmTime", booking.showTime || "-");
  setText(
    "confirmSeats",
    Array.isArray(booking.seats) ? booking.seats.map((seat) => seat.id).join(", ") : "-"
  );
  setText("confirmAmount", window.SAS.formatCurrency(booking.pricing.total));
  setText("confirmTxn", booking.payment.transactionId || "-");

  const printBtn = document.getElementById("printTicketBtn");
  const newBookingBtn = document.getElementById("newBookingBtn");

  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }

  if (newBookingBtn) {
    newBookingBtn.addEventListener("click", () => {
      window.SAS.clearBooking();
      window.location.href = "movies.html";
    });
  }
});
