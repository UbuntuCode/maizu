const express = require("express");
const multer  = require("multer");

const router = express.Router();

// ⚠️ Use supabaseAuth — NOT the old authMiddleware
const { protect, requireRole } = require("../middleware/supabaseAuth");
const {
  getAllStores,
  getStore,
  getMyStores,
  becomeVendor,
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
router.get("/my/stores",   protect, getMyStores);

// ⚠️ MUST come before router.put("/:id", ...) below —
// otherwise Express treats "become-vendor" as an :id param
// and this route never gets hit.
router.put("/become-vendor", protect, becomeVendor);

router.get("/:id",         getStore);

// Protected
router.post("/", protect, storeUpload, createStore);
router.put("/:id",         protect, storeUpload, updateStore);
router.delete("/:id",      protect, deleteStore);
router.post("/:id/follow", protect, followStore);

module.exports = router;
