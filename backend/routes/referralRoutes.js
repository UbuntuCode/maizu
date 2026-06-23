const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/supabaseAuth");
const adminOnly    = require("../middleware/adminOnly");
const {
  getMyReferralInfo,
  registerReferral,
  getCredits,
  getLeaderboard,
} = require("../controllers/referralController");

router.get("/my-code",          protect, getMyReferralInfo);
router.post("/register",        protect, registerReferral);
router.get("/credits",          protect, getCredits);

router.get("/admin/leaderboard", protect, adminOnly, getLeaderboard);

module.exports = router;
