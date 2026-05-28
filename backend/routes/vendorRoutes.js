const express = require("express");
const multer  = require("multer");

const router = express.Router();

// ⚠️ Use supabaseAuth — NOT the old authMiddleware
const { protect, requireRole } = require("../middleware/supabaseAuth");
const {
  getAllStores,
  getStore,
  getMyStores,
  createStore,
  updateStore,
  deleteStore,
  followStore,
} = require("../controllers/vendorController");

const upload      = multer({ storage: multer.memoryStorage() });
const storeUpload = upload.fields([
  { name: "logo",   maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

// Public
router.get("/",            getAllStores);
router.get("/my/stores",   protect, requireRole("vendor", "admin"), getMyStores);
router.get("/:id",         getStore);

// Protected
router.post("/",           protect, requireRole("vendor", "admin"), storeUpload, createStore);
router.put("/:id",         protect, storeUpload, updateStore);
router.delete("/:id",      protect, deleteStore);
router.post("/:id/follow", protect, followStore);

module.exports = router;
