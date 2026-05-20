// controllers/projectController.js — Project CRUD + Application management
const Project = require('../models/Project');
const Application = require('../models/Application');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { sendProjectNotification, sendApplicationStatus } = require('../services/emailService');

// ── POST /api/projects ────────────────────────────────
const createProject = async (req, res) => {
  try {
    const { title, description, required_skills, duration } = req.body;
    if (!title || !description)
      return res.status(400).json({ success: false, message: 'Title and description are required.' });

    const project = await Project.create({
      title, description,
      requiredSkills: required_skills,
      duration,
      createdBy: req.user.id,
    });

    // Notify all employees (fire-and-forget)
    (async () => {
      try {
        const employees = await Employee.find().select('officialEmail');
        const emails = employees.map(e => e.officialEmail);
        if (emails.length > 0) await sendProjectNotification(emails, project);
      } catch (err) { console.error('Project email error:', err.message); }
    })();

    return res.status(201).json({
      success: true,
      message: 'Project created. Employees notified via email.',
      project,
    });
  } catch (err) {
    console.error('createProject error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/projects ─────────────────────────────────
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, projects });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/projects/:id ─────────────────────────────
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('createdBy', 'email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    return res.status(200).json({ success: true, project });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PUT /api/projects/:id ─────────────────────────────
const updateProject = async (req, res) => {
  try {
    const { title, description, required_skills, duration, is_active } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (String(project.createdBy) !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    Object.assign(project, {
      title: title ?? project.title,
      description: description ?? project.description,
      requiredSkills: required_skills ?? project.requiredSkills,
      duration: duration ?? project.duration,
      isActive: is_active ?? project.isActive,
    });
    await project.save();

    return res.status(200).json({ success: true, message: 'Project updated.', project });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── DELETE /api/projects/:id ──────────────────────────
const deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/projects/:id/applications ────────────────
const getApplications = async (req, res) => {
  try {
    const apps = await Application.find({ project: req.params.id })
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId officialEmail status',
      })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, applications: apps });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PATCH /api/projects/:projectId/applications/:appId ─
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected', 'hold'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    const app = await Application.findById(req.params.appId)
      .populate('employee', 'officialEmail')
      .populate('project', 'title');

    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    app.status = status;
    await app.save();

    // Assign employee to project when accepted
    if (status === 'accepted') {
      await Employee.findByIdAndUpdate(app.employee._id, { currentProject: app.project._id });
    }

    // Email notification (fire-and-forget)
    sendApplicationStatus(app.employee.officialEmail, app.project.title, status).catch(console.error);

    return res.status(200).json({ success: true, message: `Application ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/projects/my-team ─────────────────────────
const getMyTeam = async (req, res) => {
  try {
    // Find all projects created by this tech lead
    const myProjects = await Project.find({ createdBy: req.user.id }).select('_id title');
    const projectIds = myProjects.map(p => p._id);

    // Find employees assigned to those projects
    const team = await Employee.find({ currentProject: { $in: projectIds } })
      .populate('currentProject', 'title');

    return res.status(200).json({ success: true, team });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  createProject, getAllProjects, getProjectById, updateProject, deleteProject,
  getApplications, updateApplicationStatus, getMyTeam,
};
