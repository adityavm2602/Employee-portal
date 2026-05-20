// server.js — Express + Mongoose entry point
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const projectRoutes = require("./routes/projects");
const employeeRoutes = require("./routes/employee");
const worklogRoutes = require("./routes/worklogs");
const attendanceRoutes = require("./routes/attendance");
const leaveRoutes = require("./routes/leaves");

// Cron
const { startBirthdayCron } = require("./cron/birthdayCron");

// Connect to MongoDB
connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/worklogs", worklogRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);

// Health check
app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    db: "mongodb",
    timestamp: new Date().toISOString(),
  }),
);

// 404
app.use((req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found.` }),
);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Internal server error." });
});

// ── Start ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startBirthdayCron();
});

module.exports = app;
