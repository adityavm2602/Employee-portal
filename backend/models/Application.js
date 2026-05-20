// models/Application.js — Project application model
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'hold'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Prevent an employee from applying twice to the same project
applicationSchema.index({ project: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
