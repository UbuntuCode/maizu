const express = require("express")
const router = express.Router()

const { createProduct, getProducts } = require("../controllers/productController")
const upload = require("../middleware/upload")
const authMiddleware = require("../middleware/authMiddleware")

// ✅ CREATE PRODUCT
router.post("/", authMiddleware, upload.single("image"), createProduct)

// ✅ GET PRODUCTS
router.get("/", getProducts)

module.exports = router