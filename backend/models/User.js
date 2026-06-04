const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ===============================
    // BASIC INFO
    // ===============================

    name: {
      type: String,
      default: "Employee",
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "tech_lead", "employee", "hr"],
      default: "employee",
    },

    department: {
      type: String,
      default: "IT",
    },

    designation: {
      type: String,
      default: "Software Developer",
    },

    // ===============================
    // TECH LEAD ACCESS CONTROL
    // ===============================

    // Which Tech Lead manages this employee
    teamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ===============================
    // PROJECTS
    // ===============================

    assignedProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],

    // ===============================
    // DAILY WORK UPDATES
    // ===============================

    dailyUpdates: [
      {
        updateText: {
          type: String,
          trim: true,
          required: true,
        },

        date: {
          type: Date,
          default: Date.now,
        },

        status: {
          type: String,
          enum: ["pending", "reviewed"],
          default: "pending",
        },

        comments: {
          type: String,
          default: "",
        },

        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
      },
    ],

    // ===============================
    // LEAVE REQUESTS
    // ===============================

    leaveRequests: [
      {
        fromDate: {
          type: Date,
          required: true,
        },

        toDate: {
          type: Date,
          required: true,
        },

        reason: {
          type: String,
          required: true,
        },

        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },

        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        comments: {
          type: String,
          default: "",
        },

        approvedAt: {
          type: Date,
        },
      },
    ],

    // ===============================
    // PROJECT PROGRESS
    // ===============================

    projectProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ===============================
    // EMPLOYEE STATUS
    // ===============================

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ===============================
// HASH PASSWORD BEFORE SAVE
// ===============================

userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    next(error);
  }
});

// ===============================
// COMPARE PASSWORD
// ===============================

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);