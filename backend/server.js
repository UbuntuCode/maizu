const express = require("express")

const app = express()

app.use(express.json())

app.get("/", (req, res) => {
res.send("MAIZU backend is running 🚀")
})

const PORT = 5000

app.listen(PORT, () => {
console.log("Server running on port 5000")
})
app.get("/api/test", (req, res) => {
res.json({ message: "Backend is connected successfully 🚀" })
})
