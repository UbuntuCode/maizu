const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/supabaseAuth");
const {
  addWaybill,
  getTracking,
  getOrderTracking,
  getQuote,
  bookShipment,
  handleWebhook,
} = require("../controllers/deliveryController");

/* Public */
router.get("/track/:waybill",     getTracking);       /* Public tracking page */
router.post("/webhook",           handleWebhook);      /* TCG webhook callback */

/* Protected */
router.get("/orders/:id",         protect, getOrderTracking);
router.put("/orders/:id/waybill", protect, addWaybill);
router.post("/quote",             protect, getQuote);
router.post("/book",              protect, bookShipment);

module.exports = router;
