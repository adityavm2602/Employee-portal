const mongoose = require("mongoose");

const dailyUpdateSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  updateText: String,

  comments: String,

  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DailyUpdate", dailyUpdateSchema);