const { Pool } = require("pg")

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "maizu_db", // ✅ MUST match DataGrip
  password: "maizu123",
  port: 5432,
})

// ✅ Confirm connection
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL database"))
  .catch(err => console.error("❌ Database connection error:", err))

module.exports = pool