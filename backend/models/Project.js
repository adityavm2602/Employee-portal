const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    // ===============================
    // PROJECT BASIC INFO
    // ===============================

    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    requiredSkills: {
      type: String,
      trim: true,
      default: "",
    },

    duration: {
      type: String,
      trim: true,
      default: "",
    },

    // ===============================
    // PROJECT OWNER
    // ===============================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ===============================
    // TECH LEAD
    // ===============================

    techLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ===============================
    // ASSIGNED EMPLOYEES
    // ===============================

    assignedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ===============================
    // PROJECT STATUS
    // ===============================

    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },

    // ===============================
    // PROJECT PROGRESS
    // ===============================

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ===============================
    // DEADLINES
    // ===============================

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
    },

    // ===============================
    // ACTIVE STATUS
    // ===============================

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);