const express = require("express");

const router = express.Router();

const { protect, requireRole } = require("../middleware/supabaseAuth");
const {
  placeOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

/* ── SafePay: delivery confirmation and money release ── */
const {
  markShipped,
  confirmDeliveryWithCode,
  buyerConfirmReceived,
  rotateHandoverCode,
  openDispute,
} = require("../controllers/safepayController");

// All order routes require login
router.use(protect);

/* ── Existing order routes (unchanged) ── */
router.post("/",          placeOrder);
router.get("/my-orders",  getMyOrders);
router.get("/:id",        getOrder);
router.put("/:id/status", requireRole("vendor", "admin"), updateOrderStatus);

/* ══════════════════════════════════════════════════════════════
   SAFEPAY ROUTES

   Vendor/admin side — never receives the handover code:
     PUT  /:id/ship          mark shipped, set tracking
     POST /:id/confirm-code  enter the buyer's code at handover

   Buyer side — owns the code:
     POST /:id/confirm-received  "I got it", releases the payout
     POST /:id/rotate-code       new code if locked or lost
     POST /:id/dispute           freezes the payout immediately
══════════════════════════════════════════════════════════════ */
router.put ("/:id/ship",             requireRole("vendor", "admin"), markShipped);
router.post("/:id/confirm-code",     requireRole("vendor", "admin"), confirmDeliveryWithCode);

router.post("/:id/confirm-received", buyerConfirmReceived);
router.post("/:id/rotate-code",      rotateHandoverCode);
router.post("/:id/dispute",          openDispute);

module.exports = router;
