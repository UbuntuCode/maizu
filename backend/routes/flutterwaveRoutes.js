const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/supabaseAuth");
const {
  createPayment,
  verifyPayment,
  handleWebhook,
  getSupportedCountries,
} = require("../controllers/flutterwaveController");

/* Public */
router.get("/countries",  getSupportedCountries);
router.post("/webhook",   handleWebhook);          /* No auth — Flutterwave calls this */

/* Protected */
router.post("/create",    protect, createPayment);
router.get("/verify",     protect, verifyPayment);

module.exports = router;
