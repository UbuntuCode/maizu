const express = require("express");
const router  = express.Router();
const { protect }   = require("../middleware/supabaseAuth");
const adminOnly      = require("../middleware/adminOnly");
const {
  submitVerification,
  getVerification,
  getPendingVerifications,
  reviewVerification,
} = require("../controllers/verificationController");

/* Vendor */
router.post("/submit",             protect, submitVerification);
router.get("/store/:storeId",      protect, getVerification);

/* Admin */
router.get("/admin/pending",       protect, adminOnly, getPendingVerifications);
router.put("/admin/:id/review",    protect, adminOnly, reviewVerification);

module.exports = router;
