const express = require("express");
const router  = express.Router();

const { protect } = require("../middleware/supabaseAuth");
const {
  getPlans,
  getMySubscription,
  upgradePlan,
  cancelPlan,
  checkLimits,
} = require("../controllers/subscriptionController");

router.get("/plans",          getPlans);
router.get("/me",             protect, getMySubscription);
router.post("/upgrade",       protect, upgradePlan);
router.post("/cancel",        protect, cancelPlan);
router.get("/check/:resource", protect, checkLimits);

module.exports = router;
