const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")

const authRouter = require("./routers/authRouter")
const adminRouter = require("./routers/adminRouter")
const emailRouter = require("./routers/emailRouter")

dotenv.config()
const app = express()

// Allow all origins temporarily (for testing)
app.use(cors())
app.use(express.json())

// Log every request
app.use((req, res, next) => {
  console.log("--- Incoming Request ---")
  console.log("Method:", req.method)
  console.log("URL:", req.originalUrl)
  console.log("Origin:", req.headers.origin)
  console.log("-------------------------")
  next()
})

// Routes
app.use("/api/auth", authRouter)
app.use("/api/admin", adminRouter)
app.use("/api/admin", emailRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on ${PORT}`))
