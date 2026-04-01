const express = require("express")
const cors = require("cors")
require("dotenv").config()

const app = express()

// ✅ IMPORTANT
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ROUTES
const authRoutes = require("./routes/authRoutes")
const productRoutes = require("./routes/productRoutes")

app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)

// START SERVER
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000")
})