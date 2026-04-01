// config/db.js
const { Pool } = require("pg")

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "maizu_db",
  password: "maizu123",
  port: 5432,
})

module.exports = pool