const express = require("express");

const router = express.Router();

const { protect, requireRole } = require("../middleware/supabaseAuth");
const {
  placeOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

// All order routes require login
router.use(protect);

router.post("/",           placeOrder);
router.get("/my-orders",   getMyOrders);
router.get("/:id",         getOrder);
router.put("/:id/status",  requireRole("vendor", "admin"), updateOrderStatus);

module.exports = router;
