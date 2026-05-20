// models/Leave.js — 2-step approval: Tech Lead first, then HR
const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    fromDate: { type: Date, required: [true, 'From date is required'] },
    toDate:   { type: Date, required: [true, 'To date is required'] },
    reason:   { type: String, required: [true, 'Reason is required'] },

    // ── Step 1: Tech Lead review ──────────────────────────
    techLeadStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    techLeadReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    techLeadReviewedAt: { type: Date, default: null },
    techLeadComment:    { type: String, default: '' },

    // ── Step 2: HR review (only if TL approved) ──────────
    hrStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'awaiting_tl'], // awaiting_tl = not yet TL approved
      default: 'awaiting_tl',
    },
    hrReviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    hrReviewedAt:  { type: Date, default: null },
    hrComment:     { type: String, default: '' },

    // ── Overall status (computed) ─────────────────────────
    // pending → tech lead pending
    // tl_approved → TL approved, waiting for HR
    // approved → both approved
    // rejected → either rejected
    status: {
      type: String,
      enum: ['pending', 'tl_approved', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', leaveSchema);
