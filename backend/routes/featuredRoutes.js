const express = require("express");
const router  = express.Router();

const { protect } = require("../middleware/supabaseAuth");
const {
  getBoostPlans,
  getMyBoosts,
  getActiveFeatured,
  boostStore,
  trackClick,
  cancelBoost,
} = require("../controllers/featuredController");

router.get("/plans",      getBoostPlans);
router.get("/active",     getActiveFeatured);
router.get("/my",         protect, getMyBoosts);
router.post("/boost",     protect, boostStore);
router.post("/:id/click", trackClick);
router.delete("/:id",     protect, cancelBoost);

module.exports = router;
