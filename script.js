// Samuel G Creative Studio: site behaviour

// ---- Availability (edit availability.js, not this file) ----
const SHOP_CFG = typeof SHOP !== "undefined" ? SHOP : { ordersOpen: true, away: [] };
const ORDERS_OPEN = SHOP_CFG.ordersOpen !== false;
document.body.classList.toggle("orders-soon", !ORDERS_OPEN);
if (!ORDERS_OPEN && SHOP_CFG.pausedMessage) {
  document.querySelectorAll(".soon-bar").forEach((el) => (el.textContent = SHOP_CFG.pausedMessage));
  document.querySelectorAll(".soon-notice").forEach((el) => {
    const t = el.querySelector(".soon-title"), p = el.querySelector("p:not(.soon-title)");
    if (t && SHOP_CFG.pausedTitle) t.textContent = SHOP_CFG.pausedTitle;
    if (p) p.textContent = SHOP_CFG.pausedMessage;
  });
}

// ---- Away dates: days we can't draw or post ----
const DRAW_DAYS = 2;   // days needed to draw a card after ordering
const POST_DAYS = 3;   // Royal Mail 2nd Class
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseDay = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const AWAY = (SHOP_CFG.away || []).filter((r) => r && r.from && r.to);
const isAway = (d) => { const k = dayKey(d); return AWAY.some((r) => k >= r.from && k <= r.to); };
const today0 = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
// Can a card needed on `neededBy` be drawn and posted on a day we're not away?
const canFulfil = (neededBy) => {
  for (let w = addDays(today0(), DRAW_DAYS); w <= addDays(neededBy, -POST_DAYS); w = addDays(w, 1)) if (!isAway(w)) return true;
  return false;
};
const earliestNeededBy = () => {
  let d = addDays(today0(), DRAW_DAYS + POST_DAYS);
  for (let i = 0; i < 400 && !canFulfil(d); i++) d = addDays(d, 1);
  return d;
};
const niceDay = (d) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" });

// Holiday notice under the header, shown from 6 weeks before an away period until it ends
if (ORDERS_OPEN) {
  const soon = AWAY.filter((r) => parseDay(r.to) >= today0() && parseDay(r.from) <= addDays(today0(), 42))
                   .sort((a, b) => a.from.localeCompare(b.from))[0];
  const header = document.getElementById("nav");
  if (soon && header) {
    const from = parseDay(soon.from), to = parseDay(soon.to);
    const range = soon.from === soon.to ? niceDay(from) : `${niceDay(from)} to ${niceDay(to)}`;
    const bar = document.createElement("div");
    bar.className = "away-bar";
    bar.textContent = soon.notice || `We're away ${range}. You can still order: cards will be posted from ${niceDay(addDays(to, 1))}.`;
    header.insertAdjacentElement("afterend", bar);
  }
}

// ---- Pricing (change these to update the whole site) ----
const PRICE_PER_CARD = 4.5;   // £ per card, standard UK delivery included (must match the Stripe product)

// ---- Ordering ----
// Stripe Payment Link: quantity, delivery option, address and payment happen here.
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/3cI5kwbJFbjw1OKfe6gnK00";
// Web3Forms access key: emails each card brief to hello@samuelgstudio.co.uk (safe to be public).
const WEB3FORMS_KEY = "03e20b35-80df-4057-b6e1-cac23750d079";

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
// 1. Customer fills in the card brief here.
// 2. The brief is emailed to us (Web3Forms) with an order reference.
// 3. Customer goes to Stripe checkout; the same reference is attached to the payment.
const form = document.getElementById("order-form");
if (form) {
  const dateInput = document.getElementById("date");
  const payBtn = document.getElementById("pay-btn");
  const statusEl = document.getElementById("order-status");

  // Earliest "needed by" date
  const earliest = earliestNeededBy();
  dateInput.min = dayKey(earliest);
  const dateHint = dateInput.parentElement.querySelector("small");
  const defaultHint = dateHint ? dateHint.textContent : "";
  const checkDate = () => {
    if (!dateInput.value) { if (dateHint) dateHint.textContent = defaultHint; return true; }
    const ok = dateInput.value >= dateInput.min && canFulfil(parseDay(dateInput.value));
    if (dateHint) dateHint.textContent = ok ? defaultHint
      : `Sorry, we can't get a card to you by then. The earliest date we can do is ${niceDay(earliest)}, or choose a date after our time away.`;
    dateHint && dateHint.classList.toggle("date-warn", !ok);
    return ok;
  };
  dateInput.addEventListener("change", checkDate);

  if (!ORDERS_OPEN) {
    payBtn.disabled = true;
    payBtn.textContent = SHOP_CFG.pausedTitle || "Orders paused";
  }

  // Short, readable reference, e.g. SG-261111-K7QF (letters chosen to avoid 0/O and 1/I mix-ups)
  const makeRef = () => {
    const d = new Date(), pad = (n) => String(n).padStart(2, "0");
    const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) code += abc[Math.floor(Math.random() * abc.length)];
    return `SG-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${code}`;
  };
  const prettyDate = (iso) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

  form.addEventListener("input", (e) => e.target.classList.remove("invalid"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!ORDERS_OPEN) return;

    // Friendly validation
    let firstBad = null;
    form.querySelectorAll("[required]").forEach((el) => {
      let ok = el.checkValidity() && el.value.trim() !== "";
      if (el === dateInput && el.value && !checkDate()) ok = false;
      el.classList.toggle("invalid", !ok);
      if (!ok && !firstBad) firstBad = el;
    });
    if (firstBad) {
      firstBad.focus({ preventScroll: true });
      firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const d = new FormData(form);
    const ref = makeRef();
    const brief = {
      access_key: WEB3FORMS_KEY,
      subject: `New card order ${ref}: ${d.get("occasion")} for ${d.get("recipient")}`,
      from_name: "Samuel G website",
      replyto: d.get("email"),
      botcheck: d.get("botcheck") ? "on" : "",
      "Order reference": ref,
      "Occasion": d.get("occasion"),
      "Name on card": d.get("recipient"),
      "Their age": d.get("age") || "-",
      "They love": d.getAll("likes").join(", ") || "-",
      "Details & message": d.get("message") || "-",
      "Needed by": prettyDate(d.get("date")),
      "Customer name": d.get("name"),
      "Customer email": d.get("email"),
      "Customer phone": d.get("phone") || "-",
      "Next": "Match this reference to the payment in Stripe (Payments > Client reference ID). Quantity, delivery option and address are in Stripe.",
    };

    payBtn.disabled = true;
    payBtn.textContent = "Saving your card details…";
    statusEl.textContent = "";

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(brief),
      });
      const out = await res.json();
      if (!res.ok || !out.success) throw new Error(out.message || "Could not send");

      // Remember for the thank-you page, then go to Stripe
      try { sessionStorage.setItem("sg-order", JSON.stringify({ ref, recipient: d.get("recipient"), date: prettyDate(d.get("date")) })); } catch (_) {}
      payBtn.textContent = "Opening secure checkout…";
      const url = new URL(STRIPE_PAYMENT_LINK);
      url.searchParams.set("client_reference_id", ref);
      url.searchParams.set("prefilled_email", d.get("email"));
      window.location.href = url.toString();
    } catch (err) {
      payBtn.disabled = false;
      payBtn.textContent = "Continue to secure checkout";
      statusEl.innerHTML = 'Sorry, something went wrong saving your card details. Please try again, or email <a href="mailto:hello@samuelgstudio.co.uk">hello@samuelgstudio.co.uk</a>.';
    }
  });
}
