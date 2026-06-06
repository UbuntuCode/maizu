const express = require("express");
const router  = express.Router();

const { protect }          = require("../middleware/supabaseAuth");
const { getVendorAnalytics } = require("../controllers/analyticsController");

router.get("/vendor", protect, getVendorAnalytics);

module.exports = router;
