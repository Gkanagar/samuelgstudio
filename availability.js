// ============================================================
//  SAMUEL G CREATIVE STUDIO: SHOP AVAILABILITY
//  This is the only file you need to edit to pause orders or
//  block dates. Dates are written "YYYY-MM-DD" (year-month-day).
// ============================================================

const SHOP = {
  // true = taking orders.  false = orders paused (the order button is switched off).
  ordersOpen: true,

  // Shown across the site while orders are paused (ordersOpen: false).
  pausedTitle: "Orders paused",
  pausedMessage: "We're taking a short break. Orders will reopen soon!",

  // Days when we can't draw or post cards (holidays, busy days).
  // Orders stay open, but customers can't pick a "needed by" date we can't meet,
  // and a notice tells them when cards will be posted.
  // For a single day, use the same date for "from" and "to".
  // Optional "notice": your own wording for the notice bar (otherwise one is written for you).
  away: [
    {
      from: "2026-12-17", to: "2027-01-03",
      reason: "Christmas: last orders 14 Dec, posted by 16 Dec (Royal Mail 2nd Class last posting 18 Dec)",
      notice: "🎄 Order by Monday 14 December for delivery before Christmas. Orders after that are posted from Monday 4 January.",
    },
    // { from: "2027-02-14", to: "2027-02-14", reason: "Busy day" },
  ],
};
