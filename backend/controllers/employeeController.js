// controllers/employeeController.js — Employee: profile, apply, applications
const Employee = require('../models/Employee');
const Application = require('../models/Application');
const Project = require('../models/Project');

// ── GET /api/employee/profile ─────────────────────────
const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id })
      .populate('currentProject', 'title description');
    if (!employee) return res.status(404).json({ success: false, message: 'Profile not found.' });
    return res.status(200).json({ success: true, employee });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── POST /api/employee/apply/:projectId ───────────────
const applyForProject = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const project = await Project.findById(req.params.projectId);
    if (!project || !project.isActive)
      return res.status(404).json({ success: false, message: 'Project not found or inactive.' });

    const existing = await Application.findOne({ project: project._id, employee: employee._id });
    if (existing) return res.status(409).json({ success: false, message: 'Already applied to this project.' });

    await Application.create({ project: project._id, employee: employee._id });

    return res.status(201).json({ success: true, message: 'Application submitted.' });
  } catch (err) {
    console.error('applyForProject error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/employee/applications ───────────────────
const getMyApplications = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const apps = await Application.find({ employee: employee._id })
      .populate('project', 'title description requiredSkills duration')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, applications: apps });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getProfile, applyForProject, getMyApplications };
