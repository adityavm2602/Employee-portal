// config/db.js — Mongoose connection to MongoDB
const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {});
    console.log(
      `MongoDB connected: ${conn.connection.host} / ${conn.connection.name}`,
    );
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};
// Graceful disconnect on app termination
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed (SIGINT)");
  process.exit(0);
});

module.exports = connectDB;
