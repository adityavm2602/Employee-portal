// ── GET /api/worklogs/all (admin) ──────────────────
const getAllWorkLogs = async (req, res) => {
  try {
    const logs = await WorkLog.find()
      .populate('employee', 'firstName lastName employeeId')
      .populate('project', 'title')
      .sort({ logDate: -1 });
    return res.status(200).json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
// controllers/worklogController.js — Work log CRUD
const WorkLog = require('../models/WorkLog');
const Employee = require('../models/Employee');
const Project = require('../models/Project');

// ── POST /api/worklogs ────────────────────────────────
const createWorkLog = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const { project_id, description, hours, log_date } = req.body;
    if (!project_id || !description || !hours || !log_date)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    const log = await WorkLog.create({
      employee: employee._id,
      project: project_id,
      description,
      hours,
      logDate: new Date(log_date),
    });

    return res.status(201).json({ success: true, message: 'Work log submitted.', log });
  } catch (err) {
    console.error('createWorkLog error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/worklogs/my ──────────────────────────────
const getMyWorkLogs = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const logs = await WorkLog.find({ employee: employee._id })
      .populate('project', 'title')
      .sort({ logDate: -1 });

    return res.status(200).json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/worklogs/team ────────────────────────────
const getTeamWorkLogs = async (req, res) => {
  try {
    const myProjects = await Project.find({ createdBy: req.user.id }).select('_id');
    const projectIds = myProjects.map(p => p._id);

    const logs = await WorkLog.find({ project: { $in: projectIds } })
      .populate('employee', 'firstName lastName employeeId')
      .populate('project', 'title')
      .sort({ logDate: -1 });

    return res.status(200).json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/worklogs/employee/:employeeId ────────────
const getEmployeeWorkLogs = async (req, res) => {
  try {
    const logs = await WorkLog.find({ employee: req.params.employeeId })
      .populate('project', 'title')
      .sort({ logDate: -1 });
    return res.status(200).json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { createWorkLog, getMyWorkLogs, getTeamWorkLogs, getEmployeeWorkLogs, getAllWorkLogs };
