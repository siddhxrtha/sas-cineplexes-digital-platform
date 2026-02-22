document.addEventListener("DOMContentLoaded", () => {
  if (!window.SAS) return;

  const booking = window.SAS.readBooking();
  if (!booking.movieId || !Array.isArray(booking.seats) || booking.seats.length === 0 || !booking.pricing) {
    window.location.href = "seats.html";
    return;
  }

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  setText("orderMovie", booking.movieTitle || "-");
  setText("orderDate", booking.showDateLabel || booking.showDate || "-");
  setText("orderTime", booking.showTime || "-");
  setText("orderSeats", booking.seats.map((seat) => seat.id).join(", "));
  setText("orderSubtotal", window.SAS.formatCurrency(booking.pricing.subtotal));
  setText("orderFee", window.SAS.formatCurrency(booking.pricing.fee));
  setText("orderTax", window.SAS.formatCurrency(booking.pricing.tax));
  setText("orderTotal", window.SAS.formatCurrency(booking.pricing.total));

  const form = document.getElementById("checkoutForm");
  if (!form) return;

  const fields = {
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    city: document.getElementById("city"),
    address: document.getElementById("address"),
    postalCode: document.getElementById("postalCode"),
    termsCheck: document.getElementById("termsCheck"),
  };

  if (booking.customer) {
    fields.fullName.value = booking.customer.fullName || "";
    fields.email.value = booking.customer.email || "";
    fields.phone.value = booking.customer.phone || "";
    fields.city.value = booking.customer.city || "";
    fields.address.value = booking.customer.address || "";
    fields.postalCode.value = booking.customer.postalCode || "";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    booking.customer = {
      fullName: fields.fullName.value.trim(),
      email: fields.email.value.trim(),
      phone: fields.phone.value.trim(),
      city: fields.city.value.trim(),
      address: fields.address.value.trim(),
      postalCode: fields.postalCode.value.trim(),
    };
    booking.updatedAt = new Date().toISOString();

    window.SAS.writeBooking(booking);
    window.location.href = "payment.html";
  });
});
