const { query } = require("../config/db");

/* ══════════════════════════════════════════════════════════════
   SAFEPAY CONTROLLER ── Maizu delivery + money release
   Mounted under /api/orders (see routes/orderRoutes.js)

   THE ONE RULE: the handover code is the money.
   Whoever physically hands the item over collects the code, and
   entering the code is the ONLY thing that releases a payout.

   CODE EXPOSURE POLICY (do not relax):
   The 4-digit handover_code may appear in exactly TWO responses:
     1. the buyer's own order fetch  (GET /api/orders/:id)
     2. the rotate-code response     (POST /api/orders/:id/rotate-code)
   It must NEVER appear in a vendor response, a rider response,
   a notification to anyone but the buyer, or a log line.

   All state transitions call the atomic Postgres functions from
   Batch 1/2A — never raw UPDATEs — so two simultaneous requests
   can't double-release money.
══════════════════════════════════════════════════════════════ */

const ROTATE_COOLDOWN_MINUTES = 30;

/* ══════════════════════════════════════════════════════════════
   MARK SHIPPED ── PUT /api/orders/:id/ship      (vendor | admin)
   Vendor hands the parcel to a courier / Paxi / the Maizu rider.
   Sets tracking info and moves the order to 'shipped'.
   Deliberately does NOT return the handover code.
══════════════════════════════════════════════════════════════ */
const markShipped = async (req, res) => {
  const { id } = req.params;
  const { delivery_method, courier_name, tracking_number } = req.body;

  const validMethods = ["maizu_bike", "paxi", "courier", "meetup"];
  if (!delivery_method || !validMethods.includes(delivery_method)) {
    return res.status(400).json({
      success: false,
      message: "Choose a delivery method: maizu_bike, paxi, courier or meetup.",
    });
  }
  if (delivery_method === "courier" && !courier_name) {
    return res
      .status(400)
      .json({ success: false, message: "Courier name is required." });
  }
  if (
    (delivery_method === "courier" || delivery_method === "paxi") &&
    !tracking_number
  ) {
    return res.status(400).json({
      success: false,
      message: "A tracking or Paxi reference number is required.",
    });
  }

  try {
    /* Vendors may only ship orders containing their own items. */
    if (req.user.role !== "admin") {
      const owns = await query(
        `SELECT 1
         FROM order_items oi
         JOIN stores s ON s.id = oi.store_id
         WHERE oi.order_id = $1 AND s.owner_id = $2
         LIMIT 1`,
        [id, req.user.id]
      );
      if (owns.rows.length === 0) {
        return res
          .status(403)
          .json({ success: false, message: "This is not your order." });
      }
    }

    const result = await query(
      `UPDATE orders SET
         status          = 'shipped',
         delivery_method = $1,
         courier_name    = $2,
         tracking_number = $3,
         shipped_at      = NOW(),
         updated_at      = NOW()
       WHERE id = $4 AND status = 'paid'
       RETURNING id, status, delivery_method, courier_name,
                 tracking_number, shipped_at`,
      [delivery_method, courier_name || null, tracking_number || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        success: false,
        message:
          "This order can't be shipped — it may not be paid yet, or it has already been sent.",
      });
    }

    /* Tell the buyer it's on the way (never includes the code). */
    try {
      const { sendNotification } = require("./notificationController");
      const o = await query("SELECT buyer_id FROM orders WHERE id = $1", [id]);
      if (o.rows.length > 0) {
        await sendNotification(
          o.rows[0].buyer_id,
          "order_shipped",
          "Your order is on the way! 🚚",
          `Order #${id
            .slice(0, 8)
            .toUpperCase()} has been sent. Have your delivery code ready — give it to the driver only once you have your items.`,
          { order_id: id }
        );
      }
    } catch (e) {
      console.error("Ship notification failed:", e.message);
    }

    res.status(200).json({ success: true, order: result.rows[0] });
  } catch (err) {
    console.error("Mark shipped error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to update the order." });
  }
};

/* ══════════════════════════════════════════════════════════════
   CONFIRM DELIVERY WITH CODE ── POST /api/orders/:id/confirm-code
                                              (vendor | admin)
   The rider or vendor enters the buyer's 4-digit code at handover.
   Correct code => order 'delivered', payout 'releasable'.
   5 wrong attempts => code locks; the buyer must rotate it.
══════════════════════════════════════════════════════════════ */
const confirmDeliveryWithCode = async (req, res) => {
  const { id } = req.params;
  const { code } = req.body;

  if (!code || !/^\d{4}$/.test(String(code).trim())) {
    return res
      .status(400)
      .json({ success: false, message: "Enter the buyer's 4-digit code." });
  }

  try {
    if (req.user.role !== "admin") {
      const owns = await query(
        `SELECT 1
         FROM order_items oi
         JOIN stores s ON s.id = oi.store_id
         WHERE oi.order_id = $1 AND s.owner_id = $2
         LIMIT 1`,
        [id, req.user.id]
      );
      if (owns.rows.length === 0) {
        return res
          .status(403)
          .json({ success: false, message: "This is not your order." });
      }
    }

    const r = await query(
      "SELECT public.confirm_delivery_with_code($1, $2) AS result",
      [id, String(code).trim()]
    );
    const outcome = r.rows[0].result;

    if (!outcome.ok) {
      const messages = {
        order_not_found: "Order not found.",
        wrong_status:
          "This order isn't out for delivery, so it can't be completed.",
        code_locked:
          "Too many wrong attempts. Ask the buyer to refresh their code from their order page.",
        wrong_code: `That code is incorrect. ${
          outcome.attempts_left ?? 0
        } attempt(s) left.`,
      };
      return res.status(400).json({
        success: false,
        reason: outcome.reason,
        attempts_left: outcome.attempts_left,
        message: messages[outcome.reason] || "Could not confirm delivery.",
      });
    }

    /* Buyer gets the receipt-confirmation prompt. */
    try {
      const { sendNotification } = require("./notificationController");
      const o = await query("SELECT buyer_id FROM orders WHERE id = $1", [id]);
      if (o.rows.length > 0) {
        await sendNotification(
          o.rows[0].buyer_id,
          "order_delivered",
          "Order delivered! 🎉",
          `Order #${id
            .slice(0, 8)
            .toUpperCase()} is marked delivered. If anything is wrong, open a dispute within 7 days.`,
          { order_id: id }
        );
      }
    } catch (e) {
      console.error("Delivery notification failed:", e.message);
    }

    res.status(200).json({
      success: true,
      message: "Delivery confirmed. The payout is now pending release.",
      delivered_at: outcome.delivered_at,
    });
  } catch (err) {
    console.error("Confirm code error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to confirm delivery." });
  }
};

/* ══════════════════════════════════════════════════════════════
   BUYER CONFIRMS RECEIPT ── POST /api/orders/:id/confirm-received
                                                   (buyer)
   The "I got it" button. Completes the order immediately rather
   than waiting out the 7-day auto-confirm window.
══════════════════════════════════════════════════════════════ */
const buyerConfirmReceived = async (req, res) => {
  const { id } = req.params;

  try {
    const r = await query(
      "SELECT public.buyer_confirm_received($1, $2) AS result",
      [id, req.user.id]
    );
    const outcome = r.rows[0].result;

    if (!outcome.ok) {
      const messages = {
        not_found_or_not_owner: "Order not found.",
        wrong_status: "This order isn't ready to be confirmed yet.",
      };
      return res.status(400).json({
        success: false,
        reason: outcome.reason,
        message: messages[outcome.reason] || "Could not confirm receipt.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Thanks! The seller's payout has been released for processing.",
    });
  } catch (err) {
    console.error("Buyer confirm error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to confirm receipt." });
  }
};

/* ══════════════════════════════════════════════════════════════
   ROTATE HANDOVER CODE ── POST /api/orders/:id/rotate-code (buyer)
   For a locked or lost code. Rate limited to one rotation per
   ROTATE_COOLDOWN_MINUTES so a hijacked session can't spin codes
   while someone else guesses.

   This is ONE OF ONLY TWO endpoints that may return the code.
══════════════════════════════════════════════════════════════ */
const rotateHandoverCode = async (req, res) => {
  const { id } = req.params;

  try {
    const guard = await query(
      `SELECT updated_at, buyer_id, status
       FROM orders
       WHERE id = $1 AND buyer_id = $2`,
      [id, req.user.id]
    );

    if (guard.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const secondsSince =
      (Date.now() - new Date(guard.rows[0].updated_at).getTime()) / 1000;
    if (secondsSince < ROTATE_COOLDOWN_MINUTES * 60) {
      const waitMins = Math.ceil(
        (ROTATE_COOLDOWN_MINUTES * 60 - secondsSince) / 60
      );
      return res.status(429).json({
        success: false,
        message: `Please wait about ${waitMins} minute(s) before requesting a new code.`,
      });
    }

    const r = await query(
      "SELECT public.rotate_handover_code($1, $2) AS result",
      [id, req.user.id]
    );
    const outcome = r.rows[0].result;

    if (!outcome.ok) {
      const messages = {
        not_found_or_not_owner: "Order not found.",
        wrong_status: "A code can only be refreshed before delivery is completed.",
      };
      return res.status(400).json({
        success: false,
        reason: outcome.reason,
        message: messages[outcome.reason] || "Could not refresh the code.",
      });
    }

    res.status(200).json({
      success: true,
      handover_code: outcome.new_code,
      message: "New code generated. Give it to the driver at handover.",
    });
  } catch (err) {
    console.error("Rotate code error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to refresh the code." });
  }
};

/* ══════════════════════════════════════════════════════════════
   OPEN A DISPUTE ── POST /api/orders/:id/dispute        (buyer)
   Inserting the row fires trg_freeze_payout_on_dispute, which
   freezes every payout on the order. The freeze is enforced by
   the database, not by this handler.
══════════════════════════════════════════════════════════════ */
const openDispute = async (req, res) => {
  const { id } = req.params;
  const { reason, description } = req.body;

  const validReasons = [
    "not_received",
    "not_as_described",
    "damaged",
    "other",
  ];
  if (!reason || !validReasons.includes(reason)) {
    return res.status(400).json({
      success: false,
      message:
        "Choose a reason: not_received, not_as_described, damaged or other.",
    });
  }

  try {
    const orderResult = await query(
      "SELECT id, buyer_id, status FROM orders WHERE id = $1 AND buyer_id = $2",
      [id, req.user.id]
    );
    if (orderResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const order = orderResult.rows[0];
    const disputable = ["paid", "shipped", "out_for_delivery", "delivered"];
    if (!disputable.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message:
          "This order can no longer be disputed. Please contact support.",
      });
    }

    const existing = await query(
      "SELECT id FROM disputes WHERE order_id = $1 AND status = 'open'",
      [id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "There's already an open dispute on this order.",
      });
    }

    const storeRow = await query(
      `SELECT store_id FROM order_items
       WHERE order_id = $1 AND store_id IS NOT NULL LIMIT 1`,
      [id]
    );

    const inserted = await query(
      `INSERT INTO disputes (order_id, buyer_id, store_id, reason, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, reason, status, created_at`,
      [
        id,
        req.user.id,
        storeRow.rows[0]?.store_id || null,
        reason,
        description || null,
      ]
    );

    res.status(201).json({
      success: true,
      dispute: inserted.rows[0],
      message:
        "Dispute opened. The seller's payout is frozen while we review it.",
    });
  } catch (err) {
    console.error("Open dispute error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to open the dispute." });
  }
};

module.exports = {
  markShipped,
  confirmDeliveryWithCode,
  buyerConfirmReceived,
  rotateHandoverCode,
  openDispute,
};
