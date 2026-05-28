const express = require("express");
const multer  = require("multer");

const router = express.Router();

const { protect, requireRole } = require("../middleware/supabaseAuth");
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  likeProduct,
} = require("../controllers/productController");

const upload = multer({ storage: multer.memoryStorage() }).array("images", 5);

// Public
router.get("/",          getAllProducts);
router.get("/:id",       getProduct);

// Protected
router.post("/",         protect, requireRole("vendor", "admin"), upload, createProduct);
router.put("/:id",       protect, updateProduct);
router.delete("/:id",    protect, deleteProduct);
router.post("/:id/like", protect, likeProduct);

module.exports = router;
