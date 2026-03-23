const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/logger");
const logger = require("./utils/logger");
const { seedDefaultTariffs } = require("./processing/billingEngine");

dotenv.config();

// Connect DB + seed default data
connectDB().then(async () => {
  await seedDefaultTariffs();
  logger.success("Default tariff slabs ready.");
});

const app = express();

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ─── Core Middleware ───────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    // Allow any Vercel deployment subdomain
    if (origin.endsWith(".vercel.app") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger); // Custom HTTP request logger

// ─── API Routes ────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/health", require("./routes/health"));
app.use("/api/usage", require("./routes/usage"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/analysis", require("./routes/analysis"));
app.use("/api/predict", require("./routes/predict"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/appliances", require("./routes/appliances"));
app.use("/api/household", require("./routes/household"));
app.use("/api/bills", require("./routes/bills"));
app.use("/api/subscription", require("./routes/subscription"));
app.use("/api/insights", require("./routes/insights"));
app.use("/api/export", require("./routes/export"));
app.use("/api/warranty", require("./routes/warranty"));
app.use("/api/payment", require("./routes/payment"));

// ─── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler (MUST be last) ───────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  logger.success(`EnergyLens server running on port ${PORT}`);
  logger.info(`API Base: http://localhost:${PORT}/api`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});