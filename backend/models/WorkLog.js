// models/WorkLog.js — Daily work log model
const mongoose = require('mongoose');

const workLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    hours: {
      type: Number,
      required: [true, 'Hours is required'],
      min: [0.5, 'Minimum 0.5 hours'],
      max: [24, 'Maximum 24 hours'],
    },
    logDate: {
      type: Date,
      required: [true, 'Log date is required'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkLog', workLogSchema);
