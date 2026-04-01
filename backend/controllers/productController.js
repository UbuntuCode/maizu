const pool = require("../config/db")
const cloudinary = require("../config/cloudinary")

// ================= CREATE PRODUCT =================
exports.createProduct = async (req, res) => {
  try {
    console.log("🔥 CREATE PRODUCT HIT")

    const { title, description, price } = req.body
    const userId = req.user?.id

    console.log("BODY:", req.body)
    console.log("FILE:", req.file)

    // ✅ VALIDATION
    if (!title || !price) {
      return res.status(400).json({
        message: "Title and price are required ❌"
      })
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Image is required ❌"
      })
    }

    // ✅ CHECK BUFFER EXISTS (VERY IMPORTANT)
    if (!req.file.buffer) {
      return res.status(400).json({
        message: "File buffer missing ❌ (Multer issue)"
      })
    }

    // ================= CLOUDINARY UPLOAD =================
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "maizu_products" },
        (error, result) => {
          if (error) {
            console.error("❌ CLOUDINARY ERROR:", error)
            reject(error)
          } else {
            resolve(result)
          }
        }
      )

      stream.end(req.file.buffer)
    })

    const imageUrl = uploadResult.secure_url

    console.log("✅ Uploaded to Cloudinary:", imageUrl)

    // ================= SAVE TO DATABASE =================
    const result = await pool.query(
      `INSERT INTO products (title, description, price, image, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description || "", price, imageUrl, userId]
    )

    res.json({
      message: "Product created successfully ✅",
      product: result.rows[0]
    })

  } catch (error) {
    console.error("❌ CREATE PRODUCT ERROR:", error)

    res.status(500).json({
      message: error.message || "Server error ❌"
    })
  }
}

// ================= GET PRODUCTS =================
exports.getProducts = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    )

    res.json({
      products: result.rows
    })

  } catch (error) {
    console.error("❌ GET PRODUCTS ERROR:", error)

    res.status(500).json({
      message: "Error fetching products ❌"
    })
  }
}