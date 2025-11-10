import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// build allowed origins from env
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim().replace(/\/$/, ""))
  : true;

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow tools/curl
    const match =
      allowedOrigins === true ||
      allowedOrigins.includes(origin.replace(/\/$/, ""));
    return match
      ? cb(null, true)
      : cb(new Error(`CORS blocked for ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // <— explicit preflight handler
app.use(express.json());

// routes *after* CORS
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin", emailRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
