// Samuel G Creative Studio: site behaviour

// ---- Launch switch ----
// false = "Orders opening soon": visitors can browse and try the form, but can't submit an order.
// Change to true once Stripe payments are connected.
const ORDERS_OPEN = false;
document.body.classList.toggle("orders-soon", !ORDERS_OPEN);

// ---- Pricing (change these to update the whole site) ----
const PRICE_PER_CARD = 4.5;   // £ per card, standard UK delivery included
const MIN_LEAD_DAYS = 5;      // drawing time + Royal Mail 2nd Class
const MAX_CARDS = 20;

const gbp = (n) => `£${n.toFixed(2)}`;

// Show the price wherever it appears
document.querySelectorAll("#hero-price, .price-each").forEach((el) => (el.textContent = gbp(PRICE_PER_CARD)));
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- Navigation ----
const navEl = document.getElementById("nav");
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);
const onScroll = () => navEl.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---- Scroll reveal ----
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("in"));
}

// ---- Order form (home page only) ----
if (document.getElementById("order-form")) {
  const form = document.getElementById("order-form");
  const done = document.getElementById("order-done");
  const preview = document.getElementById("order-preview");
  const dateInput = document.getElementById("date");
  const qtyInput = document.getElementById("qty");

  // Earliest "needed by" date
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + MIN_LEAD_DAYS);
  dateInput.min = minDate.toISOString().split("T")[0];

  const deliveryFee = () => Number(form.querySelector('input[name="delivery"]:checked').dataset.fee);

  const clampQty = () => {
    const n = Math.min(MAX_CARDS, Math.max(1, parseInt(qtyInput.value, 10) || 1));
    qtyInput.value = n;
    return n;
  };

  const updateTotals = () => {
    const qty = clampQty();
    const sub = qty * PRICE_PER_CARD;
    const fee = deliveryFee();
    document.getElementById("sub-label").textContent = `${qty} card${qty > 1 ? "s" : ""} × ${gbp(PRICE_PER_CARD)}`;
    document.getElementById("subtotal").textContent = gbp(sub);
    document.getElementById("delivery-fee").textContent = fee ? gbp(fee) : "Free";
    document.getElementById("total").textContent = gbp(sub + fee);
    return { qty, sub, fee, total: sub + fee };
  };

  document.querySelectorAll(".step-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      qtyInput.value = (parseInt(qtyInput.value, 10) || 1) + Number(btn.dataset.step);
      updateTotals();
    })
  );
  qtyInput.addEventListener("change", updateTotals);
  form.querySelectorAll('input[name="delivery"]').forEach((r) => r.addEventListener("change", updateTotals));
  updateTotals();

  form.addEventListener("input", (e) => e.target.classList.remove("invalid"));

  const payBtn = document.getElementById("pay-btn");
  if (!ORDERS_OPEN) {
    payBtn.disabled = true;
    payBtn.textContent = "Orders opening soon";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!ORDERS_OPEN) return;

    let firstBad = null;
    form.querySelectorAll("[required]").forEach((el) => {
      let ok = el.checkValidity() && el.value.trim() !== "";
      if (el === dateInput && el.value && el.value < el.min) ok = false;
      el.classList.toggle("invalid", !ok);
      if (!ok && !firstBad) firstBad = el;
    });
    if (firstBad) {
      firstBad.focus({ preventScroll: true });
      firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const d = new FormData(form);
    const t = updateTotals();
    const address = [d.get("addr1"), d.get("addr2"), d.get("town"), d.get("postcode").toUpperCase()].filter(Boolean).join(", ");

    // TODO (next step): send this order to Stripe Checkout instead of showing a preview.
    preview.textContent =
      `Occasion:    ${d.get("occasion")}\n` +
      `For:         ${d.get("recipient")}${d.get("age") ? ` (age ${d.get("age")})` : ""}\n` +
      `Loves:       ${d.getAll("likes").join(", ") || "-"}\n` +
      `Details:     ${d.get("message") || "-"}\n` +
      `Needed by:   ${d.get("date")}\n` +
      `Cards:       ${t.qty} × ${gbp(PRICE_PER_CARD)} = ${gbp(t.sub)}\n` +
      `Delivery:    ${d.get("delivery")} (${t.fee ? gbp(t.fee) : "free"})\n` +
      `Send to:     ${address}${d.get("toRecipient") ? " (directly to recipient)" : ""}\n` +
      `Your details: ${d.get("name")}, ${d.get("email")}${d.get("phone") ? ", " + d.get("phone") : ""}\n` +
      `Total:       ${gbp(t.total)}`;

    form.hidden = true;
    done.hidden = false;
    done.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("order-again").addEventListener("click", () => {
    form.reset();
    form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
    updateTotals();
    done.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

}
