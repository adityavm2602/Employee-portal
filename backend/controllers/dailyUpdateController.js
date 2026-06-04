// controllers/dailyUpdateController.js — Controller logic for Daily Mandatory Updates
const DailyUpdate = require('../models/DailyUpdate');
const Employee = require('../models/Employee');

// Helper to normalize date to start of day (local server time)
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── POST /api/daily-updates ─────────────────────────────
const createDailyUpdate = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const {
      firstHalfUpdate,
      secondHalfUpdate,
      firstHalfSubmitted = false,
      secondHalfSubmitted = false,
    } = req.body;

    const today = getStartOfDay();

    // Check if an update already exists for today
    const existing = await DailyUpdate.findOne({ employee: employee._id, date: today });
    if (existing) {
      return res.status(409).json({ success: false, message: "You have already submitted/saved today's update." });
    }

    // Validation rules for submission
    if (firstHalfSubmitted) {
      if (!firstHalfUpdate || !firstHalfUpdate.trim()) {
        return res.status(400).json({ success: false, message: 'First Half update is required to submit' });
      }
    }
    if (secondHalfSubmitted) {
      if (!secondHalfUpdate || !secondHalfUpdate.trim()) {
        return res.status(400).json({ success: false, message: 'Second Half update is required to submit' });
      }
    }

    const isBothSubmitted = firstHalfSubmitted && secondHalfSubmitted;

    const newUpdate = await DailyUpdate.create({
      employee: employee._id,
      employeeId: employee.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      date: today,
      firstHalfUpdate: firstHalfUpdate ? firstHalfUpdate.trim() : '',
      secondHalfUpdate: secondHalfUpdate ? secondHalfUpdate.trim() : '',
      firstHalfSubmitted,
      firstHalfSubmittedAt: firstHalfSubmitted ? new Date() : null,
      secondHalfSubmitted,
      secondHalfSubmittedAt: secondHalfSubmitted ? new Date() : null,
      status: isBothSubmitted ? 'submitted' : 'draft',
      submittedAt: isBothSubmitted ? new Date() : null,
    });

    let successMsg = 'Draft saved successfully';
    if (isBothSubmitted) {
      successMsg = 'Daily updates submitted successfully';
    } else if (firstHalfSubmitted) {
      successMsg = 'First Half update submitted successfully';
    } else if (secondHalfSubmitted) {
      successMsg = 'Second Half update submitted successfully';
    }

    return res.status(201).json({
      success: true,
      message: successMsg,
      dailyUpdate: newUpdate,
    });
  } catch (err) {
    console.error('createDailyUpdate error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/daily-updates/today ────────────────────────
const getTodayDailyUpdate = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const today = getStartOfDay();
    const dailyUpdate = await DailyUpdate.findOne({ employee: employee._id, date: today });

    return res.status(200).json({ success: true, dailyUpdate });
  } catch (err) {
    console.error('getTodayDailyUpdate error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/daily-updates/history ──────────────────────
const getDailyUpdateHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // Date filtering (checks exact date match)
    if (req.query.date) {
      filter.date = getStartOfDay(req.query.date);
    }

    // Role-based scoping
    if (req.user.role === 'admin') {
      // Admin can search by employeeId if provided
      if (req.query.employeeId) {
        filter.employeeId = req.query.employeeId.trim().toUpperCase();
      }
    } else {
      // Employees can only fetch their own updates
      const employee = await Employee.findOne({ user: req.user.id });
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee profile not found.' });
      }
      filter.employee = employee._id;
    }

    const total = await DailyUpdate.countDocuments(filter);
    const updates = await DailyUpdate.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      updates,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    console.error('getDailyUpdateHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PUT /api/daily-updates/:id ──────────────────────────
const updateDailyUpdate = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const update = await DailyUpdate.findById(req.params.id);
    if (!update) {
      return res.status(404).json({ success: false, message: 'Daily update not found.' });
    }

    // Access control: only owner can edit
    if (String(update.employee) !== String(employee._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Time validation: cannot edit after EOD (check same calendar day)
    const today = getStartOfDay();
    const updateDate = getStartOfDay(update.date);
    if (today.getTime() !== updateDate.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Employee can edit only until EOD',
      });
    }

    const {
      firstHalfUpdate,
      secondHalfUpdate,
      firstHalfSubmitted,
      secondHalfSubmitted,
    } = req.body;

    // ── First Half Lock & Update ───────────────────────────
    if (update.firstHalfSubmitted) {
      // If already submitted, reject edits to the text
      if (firstHalfUpdate !== undefined && firstHalfUpdate.trim() !== update.firstHalfUpdate) {
        return res.status(400).json({ success: false, message: 'First Half update is locked and cannot be edited.' });
      }
    } else {
      // Update text if provided
      if (firstHalfUpdate !== undefined) {
        update.firstHalfUpdate = firstHalfUpdate.trim();
      }
      // Process submission
      if (firstHalfSubmitted === true) {
        if (!update.firstHalfUpdate || !update.firstHalfUpdate.trim()) {
          return res.status(400).json({ success: false, message: 'First Half update is required to submit' });
        }
        update.firstHalfSubmitted = true;
        update.firstHalfSubmittedAt = new Date();
      }
    }

    // ── Second Half Lock & Update ──────────────────────────
    if (update.secondHalfSubmitted) {
      // If already submitted, reject edits to the text
      if (secondHalfUpdate !== undefined && secondHalfUpdate.trim() !== update.secondHalfUpdate) {
        return res.status(400).json({ success: false, message: 'Second Half update is locked and cannot be edited.' });
      }
    } else {
      // Update text if provided
      if (secondHalfUpdate !== undefined) {
        update.secondHalfUpdate = secondHalfUpdate.trim();
      }
      // Process submission
      if (secondHalfSubmitted === true) {
        if (!update.secondHalfUpdate || !update.secondHalfUpdate.trim()) {
          return res.status(400).json({ success: false, message: 'Second Half update is required to submit' });
        }
        update.secondHalfSubmitted = true;
        update.secondHalfSubmittedAt = new Date();
      }
    }

    // ── Overall Status Calculation ──────────────────────────
    const wasBothSubmitted = update.status === 'submitted';
    const isBothSubmitted = update.firstHalfSubmitted && update.secondHalfSubmitted;

    if (isBothSubmitted) {
      update.status = 'submitted';
      if (!update.submittedAt) {
        update.submittedAt = new Date();
      }
    } else {
      update.status = 'draft';
    }

    const savedUpdate = await update.save();

    let successMsg = 'Draft saved successfully';
    if (isBothSubmitted && !wasBothSubmitted) {
      successMsg = 'Daily updates fully submitted successfully';
    } else if (firstHalfSubmitted === true && update.firstHalfSubmitted) {
      successMsg = 'First Half update submitted successfully';
    } else if (secondHalfSubmitted === true && update.secondHalfSubmitted) {
      successMsg = 'Second Half update submitted successfully';
    }

    return res.status(200).json({
      success: true,
      message: successMsg,
      dailyUpdate: savedUpdate,
    });
  } catch (err) {
    console.error('updateDailyUpdate error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  createDailyUpdate,
  getTodayDailyUpdate,
  getDailyUpdateHistory,
  updateDailyUpdate,
};
