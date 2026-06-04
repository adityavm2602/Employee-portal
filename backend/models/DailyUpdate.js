// models/DailyUpdate.js — Schema for Daily Mandatory Updates
const mongoose = require('mongoose');

const dailyUpdateSchema = new mongoose.Schema(
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
      trim: true,
    },
    secondHalfUpdate: {
      type: String,
      trim: true,
    },
    firstHalfSubmitted: {
      type: Boolean,
      default: false,
      required: true,
    },
    secondHalfSubmitted: {
      type: Boolean,
      default: false,
      required: true,
    },
    firstHalfSubmittedAt: {
      type: Date,
      default: null,
    },
    secondHalfSubmittedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted'],
      default: 'draft',
      required: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Add unique compound index for employee & normalized date to prevent duplicates
dailyUpdateSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyUpdate', dailyUpdateSchema);
