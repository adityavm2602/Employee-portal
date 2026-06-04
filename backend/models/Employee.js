// models/Employee.js — Employee profile model
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    officialEmail: {
      type: String,
      required: [true, 'Official email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['probation', 'permanent'],
      default: 'probation',
    },
    currentProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    department: {
      type: String,
      default: 'Engineering',
      trim: true,
    },
    designation: {
      type: String,
      default: 'Software Engineer',
      trim: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Virtual: full name
employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Enable virtuals in JSON output
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Employee', employeeSchema);
