// controllers/attendanceController.js — Mark and view attendance
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Project = require('../models/Project');

// ── POST /api/attendance/mark ─────────────────────────
const markAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const { status } = req.body;
    if (!['present', 'absent'].includes(status))
      return res.status(400).json({ success: false, message: 'Status must be present or absent.' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert: update if exists, otherwise insert
    await Attendance.findOneAndUpdate(
      { employee: employee._id, attDate: today },
      { status },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: `Attendance marked as ${status}.` });
  } catch (err) {
    console.error('markAttendance error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/attendance/my ────────────────────────────
const getMyAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const records = await Attendance.find({ employee: employee._id }).sort({ attDate: -1 });
    return res.status(200).json({ success: true, attendance: records });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/attendance/team ──────────────────────────
const getTeamAttendance = async (req, res) => {
  try {
    const myProjects = await Project.find({ createdBy: req.user.id }).select('_id');
    const projectIds = myProjects.map(p => p._id);

    const teamEmployees = await Employee.find({ currentProject: { $in: projectIds } }).select('_id');
    const empIds = teamEmployees.map(e => e._id);

    const records = await Attendance.find({ employee: { $in: empIds } })
      .populate('employee', 'firstName lastName employeeId')
      .sort({ attDate: -1 });

    return res.status(200).json({ success: true, attendance: records });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/attendance/all ───────────────────────────
const getAllAttendance = async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) {
      const d = new Date(req.query.date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      filter.attDate = { $gte: d, $lt: next };
    }

    const records = await Attendance.find(filter)
      .populate('employee', 'firstName lastName employeeId')
      .sort({ attDate: -1 });

    return res.status(200).json({ success: true, attendance: records });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { markAttendance, getMyAttendance, getTeamAttendance, getAllAttendance };
