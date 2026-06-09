const express  = require("express");
const router   = express.Router();
const { protect }   = require("../middleware/supabaseAuth");
const adminOnly     = require("../middleware/adminOnly");
const {
  getDashboardStats,
  getUsers, updateUserRole, deleteUser,
  getStores, toggleStoreActive, toggleStoreTrending, adminDeleteStore,
  getAllOrders, adminUpdateOrderStatus,
} = require("../controllers/adminController");

const guard = [protect, adminOnly];

/* Dashboard */
router.get("/stats",                    ...guard, getDashboardStats);

/* Users */
router.get("/users",                    ...guard, getUsers);
router.put("/users/:id/role",           ...guard, updateUserRole);
router.delete("/users/:id",             ...guard, deleteUser);

/* Stores */
router.get("/stores",                   ...guard, getStores);
router.put("/stores/:id/toggle-active", ...guard, toggleStoreActive);
router.put("/stores/:id/toggle-trending",...guard, toggleStoreTrending);
router.delete("/stores/:id",            ...guard, adminDeleteStore);

/* Orders */
router.get("/orders",                   ...guard, getAllOrders);
router.put("/orders/:id/status",        ...guard, adminUpdateOrderStatus);

module.exports = router;
