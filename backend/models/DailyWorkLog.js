// models/DailyWorkLog.js — Schema for Smart Daily Time Tracking & Work Update
const mongoose = require('mongoose');

const dailyWorkLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true, // Normalized date at 00:00:00.000 for uniqueness check
    },
    firstHalfUpdate: {
      type: String,
      default: '',
      trim: true,
    },
    secondHalfUpdate: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Submitted'],
      default: 'Pending',
      required: true,
    },
    loginTime: {
      type: Date,
      default: null,
    },
    firstDraftTime: {
      type: Date,
      default: null,
    },
    lastEditedTime: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    totalWorkDuration: {
      type: String,
      default: '0h 0m',
    },
    sessionDuration: {
      type: String,
      default: '0h 0m',
    },
    isFinalSubmitted: {
      type: Boolean,
      default: false,
      required: true,
    },
    isLateSubmission: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

// Add unique compound index for employee & normalized date to prevent duplicates
dailyWorkLogSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyWorkLog', dailyWorkLogSchema);
