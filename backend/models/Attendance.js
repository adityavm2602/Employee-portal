// models/Attendance.js — Daily attendance model
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    attDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: true,
    },
  },
  { timestamps: true }
);

// One record per employee per day
attendanceSchema.index({ employee: 1, attDate: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
