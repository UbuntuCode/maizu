const multer = require("multer")

// 🔥 THIS IS THE FIX
const storage = multer.memoryStorage()

const upload = multer({
  storage: storage
})

module.exports = upload