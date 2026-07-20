const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const smartRoutes = require("./routes/smartRoutes");
const testRoutes = require("./routes/testRoutes");
const proctoringRoutes = require("./routes/proctoringRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const plannerRoutes = require("./routes/plannerRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const environmentRoutes = require("./routes/environmentRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// CORS - Allow Vercel + Localhost
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SmartPrep API v5 running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/smart", smartRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/proctoring", proctoringRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/environment", environmentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;