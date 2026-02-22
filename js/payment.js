document.addEventListener("DOMContentLoaded", () => {
  if (!window.SAS) return;

  const booking = window.SAS.readBooking();
  if (!booking.movieId || !booking.customer || !booking.pricing || !Array.isArray(booking.seats) || booking.seats.length === 0) {
    window.location.href = "checkout.html";
    return;
  }

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  setText("payMovie", booking.movieTitle || "-");
  setText("payDate", booking.showDateLabel || booking.showDate || "-");
  setText("payTime", booking.showTime || "-");
  setText("paySeats", booking.seats.map((seat) => seat.id).join(", "));
  setText("payTotal", window.SAS.formatCurrency(booking.pricing.total));
  setText("payAmount", window.SAS.formatCurrency(booking.pricing.total));

  const paymentForm = document.getElementById("paymentForm");
  const payButton = document.getElementById("payNowBtn");
  const errorNode = document.getElementById("paymentError");
  const processingNote = document.getElementById("processingNote");

  const cardFields = document.getElementById("cardFields");
  const walletFields = document.getElementById("walletFields");
  const netFields = document.getElementById("netFields");

  const cardName = document.getElementById("cardName");
  const cardNumber = document.getElementById("cardNumber");
  const cardExpiry = document.getElementById("cardExpiry");
  const cardCvv = document.getElementById("cardCvv");
  const walletId = document.getElementById("walletId");
  const bankName = document.getElementById("bankName");

  if (!paymentForm || !payButton || !errorNode || !processingNote || !cardFields || !walletFields || !netFields) return;

  const methodInputs = Array.from(document.querySelectorAll("input[name='paymentMethod']"));
  const getMethod = () => {
    const selected = methodInputs.find((input) => input.checked);
    return selected ? selected.value : "card";
  };

  const setMethodPanels = () => {
    const method = getMethod();
    cardFields.classList.toggle("d-none", method !== "card");
    walletFields.classList.toggle("d-none", method !== "wallet");
    netFields.classList.toggle("d-none", method !== "netbanking");
  };

  methodInputs.forEach((input) => input.addEventListener("change", setMethodPanels));

  cardNumber.addEventListener("input", () => {
    const digits = cardNumber.value.replace(/\D/g, "").slice(0, 16);
    const chunks = digits.match(/.{1,4}/g) || [];
    cardNumber.value = chunks.join(" ");
  });

  cardExpiry.addEventListener("input", () => {
    const digits = cardExpiry.value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      cardExpiry.value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      cardExpiry.value = digits;
    }
  });

  const validatePayment = (method) => {
    if (method === "card") {
      const number = cardNumber.value.replace(/\s/g, "");
      const expiryOk = /^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.value);
      const cvvOk = /^\d{3,4}$/.test(cardCvv.value);
      if (!cardName.value.trim()) return "Enter the cardholder name.";
      if (number.length !== 16) return "Card number must contain 16 digits.";
      if (!expiryOk) return "Expiry must be in MM/YY format.";
      if (!cvvOk) return "CVV must be 3 or 4 digits.";
      return "";
    }
    if (method === "wallet") {
      if (!walletId.value.trim()) return "Enter your wallet email or phone.";
      return "";
    }
    if (method === "netbanking") {
      if (!bankName.value) return "Please select your bank.";
      return "";
    }
    return "Invalid payment method selected.";
  };

  paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    errorNode.textContent = "";
    processingNote.textContent = "";

    const method = getMethod();
    const validationError = validatePayment(method);
    if (validationError) {
      errorNode.textContent = validationError;
      return;
    }

    payButton.disabled = true;
    processingNote.textContent = "Processing payment securely. Please wait...";
    payButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Processing';

    window.setTimeout(() => {
      const last4 = cardNumber.value.replace(/\s/g, "").slice(-4);
      const methodLabel =
        method === "card"
          ? `Card ending ${last4 || "0000"}`
          : method === "wallet"
          ? "Wallet"
          : "Netbanking";

      booking.payment = {
        method: methodLabel,
        transactionId: `TXN-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`,
        paidAt: new Date().toISOString(),
      };

      if (!booking.bookingId) {
        booking.bookingId = window.SAS.generateBookingId();
      }
      booking.updatedAt = new Date().toISOString();
      window.SAS.writeBooking(booking);
      window.location.href = "confirmation.html";
    }, 1800);
  });

  setMethodPanels();
});
