// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const connectDB = require("./config/db");

// ✅ Load environment variables
dotenv.config();

const app = express();

// ✅ Allowed Origins
const allowedOrigins = [
  process.env.FRONTEND_URL,       // Vercel Frontend (Production)
  process.env.PRODUCTION_URL,     // Optional second domain
  "http://localhost:5173"         // Local Development
].filter(Boolean);

// ✅ CORS Configuration (Allow Cookies, Tokens, Sessions)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation: Origin not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Optional: Add custom CORS headers for extra safety
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// ✅ Morgan Logger
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// ✅ Express Middleware
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Ensure folders exist
["uploads", "pdfs"].forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
});

// ✅ Routes
app.use("/api/quotations", require("./routes/quotationRoutes"));
app.use("/api/user", require("./routes/userRoutes"));

// ✅ Error Handler
app.use(require("./middleware/errorHandler"));

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🚀 NodeGAN Backend is running on Render successfully!");
});

// ✅ Start server after DB connection
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () =>
      console.log(`🚀 Server live at: http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

startServer();
