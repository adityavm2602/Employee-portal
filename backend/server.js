require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

// =======================================
// ROUTES
// =======================================

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const projectRoutes = require("./routes/projects");
const employeeRoutes = require("./routes/employee");
const worklogRoutes = require("./routes/worklogs");
const attendanceRoutes = require("./routes/attendance");
const leaveRoutes = require("./routes/leaves");

// NEW TECH LEAD ROUTES
const techLeadRoutes = require("./routes/techLeadRoutes");

// =======================================
// CRON
// =======================================

const { startBirthdayCron } = require("./cron/birthdayCron");

// =======================================
// CONNECT DATABASE
// =======================================

connectDB();

const app = express();

// =======================================
// MIDDLEWARE
// =======================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:3000",

    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// Static uploads
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// =======================================
// API ROUTES
// =======================================

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/employee", employeeRoutes);

app.use("/api/worklogs", worklogRoutes);

app.use("/api/attendance", attendanceRoutes);

app.use("/api/leaves", leaveRoutes);

// =======================================
// TECH LEAD ROUTES
// =======================================

app.use("/api/techlead", techLeadRoutes);

// =======================================
// HEALTH CHECK
// =======================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    db: "mongodb",
    timestamp: new Date().toISOString(),
  });
});

// =======================================
// 404 HANDLER
// =======================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// =======================================
// GLOBAL ERROR HANDLER
// =======================================

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  res.status(err.status || 500).json({
    success: false,
    message:
      err.message || "Internal server error.",
  });
});

// =======================================
// START SERVER
// =======================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );

  startBirthdayCron();
});

module.exports = app;