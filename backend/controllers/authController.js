const jwt = require("jsonwebtoken")
const pool = require("../config/db")
const bcrypt = require("bcrypt")

// ================= REGISTER =================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required ❌"
      })
    }

    // Check if user exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "User already exists ❌"
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    )

    res.status(201).json({
      message: "User registered successfully ✅",
      user: newUser.rows[0]
    })

  } catch (error) {
    console.error("REGISTER ERROR:", error)
    res.status(500).json({ message: "Server error ❌" })
  }
}

// ================= LOGIN =================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    console.log("📥 LOGIN ATTEMPT:", email)

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required ❌"
      })
    }

    // Check user
    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    )

    if (user.rows.length === 0) {
      console.log("❌ User not found")
      return res.status(400).json({
        message: "Invalid credentials ❌"
      })
    }

    // Check password
    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    )

    if (!validPassword) {
      console.log("❌ Wrong password")
      return res.status(400).json({
        message: "Invalid credentials ❌"
      })
    }

    // 🔥 CREATE TOKEN
    const token = jwt.sign(
      {
        id: user.rows[0].id,
        email: user.rows[0].email
      },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    )

    console.log("✅ LOGIN SUCCESS, TOKEN CREATED")

    // 🔥 SEND RESPONSE (THIS WAS YOUR ISSUE BEFORE)
    res.json({
      message: "Login successful ✅",
      token: token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email
      }
    })

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error)

    res.status(500).json({
      message: "Server error ❌"
    })
  }
}