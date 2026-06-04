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
const dailyUpdateRoutes = require("./routes/dailyUpdates");
const worklogSingularRoutes = require("./routes/worklog");
const profileRoutes = require("./routes/profile");
const notificationRoutes = require("./routes/notifications");

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
 Employee-dashboard
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.CLIENT_URL
].filter(Boolean);

// Create HTTP server for socket.io integration
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Set socketio instance on express app so controllers can access it
app.set("socketio", io);

// Handle socket.io connections
io.on("connection", (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  socket.on("join", (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`Socket client ${socket.id} joined user room: ${userId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// ── Middleware ────────────────────────────────────────
app.use(
  cors({
    origin: allowedOrigins,

// =======================================
// MIDDLEWARE
// =======================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:3000",

 main
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
app.use("/api/daily-updates", dailyUpdateRoutes);
app.use("/api/worklog", worklogSingularRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);

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
 Employee-dashboard
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startBirthdayCron();
});

module.exports = server;


app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );

  startBirthdayCron();
});

module.exports = app;
 main
