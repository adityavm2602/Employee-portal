// controllers/dailyWorkLogController.js — Logic for Smart Daily Time Tracking & Work Update
const DailyWorkLog = require('../models/DailyWorkLog');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { getStartOfDay, recordEmployeeContact } = require('../utils/worklogHelper');

// Helper to parse duration string 'Xh Ym' back to minutes
const parseDurationToMinutes = (durationStr) => {
  if (!durationStr) return 0;
  const match = durationStr.match(/(\d+)h\s+(\d+)m/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    return hours * 60 + mins;
  }
  return 0;
};

// Helper to format minutes to 'Xh Ym'
const formatMinutesToDuration = (totalMins) => {
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}h ${mins}m`;
};

// ── POST /api/worklog/create ────────────────────────────
const createDailyWorkLog = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const today = getStartOfDay();
    let log = await DailyWorkLog.findOne({ employee: employee._id, date: today });

    if (log) {
      if (log.isFinalSubmitted) {
        return res.status(400).json({ success: false, message: "You have already submitted today's update" });
      }
      return res.status(200).json({ success: true, message: 'Today\'s work log already exists.', worklog: log });
    }

    log = await DailyWorkLog.create({
      employee: employee._id,
      employeeId: employee.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      date: today,
      loginTime: new Date(),
      status: 'Pending',
      isFinalSubmitted: false,
    });

    return res.status(201).json({ success: true, message: 'Daily work log initialized.', worklog: log });
  } catch (err) {
    console.error('createDailyWorkLog error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/worklog/today ──────────────────────────────
const getTodayDailyWorkLog = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const today = getStartOfDay();
    let log = await DailyWorkLog.findOne({ employee: employee._id, date: today });

    if (!log) {
      // Robust fallback: if they hit this, they are active, so initialize work log
      log = await DailyWorkLog.create({
        employee: employee._id,
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        date: today,
        loginTime: new Date(),
        status: 'Pending',
        isFinalSubmitted: false,
      });
    }

    return res.status(200).json({ success: true, worklog: log });
  } catch (err) {
    console.error('getTodayDailyWorkLog error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/worklog/history ────────────────────────────
const getDailyWorkLogHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // Filters for Date, Employee, Status
    if (req.query.date) {
      filter.date = getStartOfDay(req.query.date);
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.user.role === 'admin') {
      if (req.query.employeeId) {
        filter.employeeId = req.query.employeeId.trim().toUpperCase();
      }
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search.trim(), 'i');
        filter.$or = [
          { employeeName: searchRegex },
          { employeeId: searchRegex }
        ];
      }
    } else {
      const employee = await Employee.findOne({ user: req.user.id });
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee profile not found.' });
      }
      filter.employee = employee._id;
    }

    const total = await DailyWorkLog.countDocuments(filter);
    const logs = await DailyWorkLog.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    console.error('getDailyWorkLogHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PUT /api/worklog/update/:id ──────────────────────────
const updateDailyWorkLog = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const log = await DailyWorkLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Daily work log not found.' });
    }

    // Access control: only owner can edit
    if (String(log.employee) !== String(employee._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Time validation: cannot edit after calendar EOD (check same calendar day)
    const today = getStartOfDay();
    const logDate = getStartOfDay(log.date);
    if (today.getTime() !== logDate.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Editing disabled after EOD',
      });
    }

    // Submission status validation: block edits after final submission
    if (log.isFinalSubmitted) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted today's update",
      });
    }

    const { firstHalfUpdate, secondHalfUpdate, isFinalSubmitted } = req.body;

    // Set first draft time on first modification of content
    if (!log.firstDraftTime && ((firstHalfUpdate && firstHalfUpdate.trim()) || (secondHalfUpdate && secondHalfUpdate.trim()))) {
      log.firstDraftTime = new Date();
    }

    // Update texts if provided
    if (firstHalfUpdate !== undefined) log.firstHalfUpdate = firstHalfUpdate;
    if (secondHalfUpdate !== undefined) log.secondHalfUpdate = secondHalfUpdate;

    log.lastEditedTime = new Date();

    const start = log.loginTime || log.createdAt || new Date();
    let end = log.lastEditedTime;

    if (isFinalSubmitted === true) {
      // Validation rules for submission
      if (!log.firstHalfUpdate || !log.firstHalfUpdate.trim()) {
        return res.status(400).json({ success: false, message: 'First Half Update required' });
      }
      if (!log.secondHalfUpdate || !log.secondHalfUpdate.trim()) {
        return res.status(400).json({ success: false, message: 'Second Half Update required' });
      }

      log.isFinalSubmitted = true;
      log.status = 'Submitted';
      log.submittedAt = new Date();
      end = log.submittedAt;

      // Late Submission Check (after 5:30 PM)
      const now = log.submittedAt;
      const cutoff = new Date(now);
      cutoff.setHours(17, 30, 0, 0);
      if (now > cutoff) {
        log.isLateSubmission = true;
      }
    } else {
      // Update intermediate status
      if (log.firstHalfUpdate.trim() || log.secondHalfUpdate.trim()) {
        log.status = 'In Progress';
      } else {
        log.status = 'Pending';
      }
    }

    // Calculate durations
    const diffMs = Math.max(0, end - start);
    const diffMins = Math.floor(diffMs / (1000 * 60));

    // Session duration (raw hours & mins)
    const sessionHours = Math.floor(diffMins / 60);
    const sessionMins = diffMins % 60;
    log.sessionDuration = `${sessionHours}h ${sessionMins}m`;

    // Active working duration (deduct 40 mins if session exceeds 5 hours)
    let activeMins = diffMins;
    if (diffMins > 300) {
      activeMins = Math.max(0, diffMins - 40);
    }
    const activeHours = Math.floor(activeMins / 60);
    const activeMinsLeft = activeMins % 60;
    log.totalWorkDuration = `${activeHours}h ${activeMinsLeft}m`;

    const savedLog = await log.save();

    return res.status(200).json({
      success: true,
      message: isFinalSubmitted ? 'Daily update submitted successfully' : 'Draft saved successfully',
      worklog: savedLog,
    });
  } catch (err) {
    console.error('updateDailyWorkLog error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/worklog/report ─────────────────────────────
const getEmployeeReport = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const logs = await DailyWorkLog.find({ employee: employee._id }).sort({ date: -1 });

    let totalActiveMins = 0;
    let submittedCount = 0;
    let lateCount = 0;

    logs.forEach(log => {
      if (log.isFinalSubmitted) {
        submittedCount++;
        totalActiveMins += parseDurationToMinutes(log.totalWorkDuration);
        if (log.isLateSubmission) {
          lateCount++;
        }
      }
    });

    const avgMins = submittedCount > 0 ? Math.round(totalActiveMins / submittedCount) : 0;

    return res.status(200).json({
      success: true,
      summary: {
        totalLogs: logs.length,
        submittedCount,
        pendingCount: logs.length - submittedCount,
        lateSubmissions: lateCount,
        avgWorkDuration: formatMinutesToDuration(avgMins),
      },
      logs,
    });
  } catch (err) {
    console.error('getEmployeeReport error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/admin/worklog/analytics ────────────────────
const getAdminWorklogAnalytics = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const today = getStartOfDay();

    // Stats for Today
    const todayLogs = await DailyWorkLog.find({ date: today });
    const submittedTodayCount = todayLogs.filter(l => l.isFinalSubmitted).length;
    const pendingTodayCount = todayLogs.filter(l => !l.isFinalSubmitted).length;
    const missingTodayCount = Math.max(0, totalEmployees - todayLogs.length);

    // Average Work Duration (of all submitted logs in history)
    const allSubmitted = await DailyWorkLog.find({ isFinalSubmitted: true });
    let totalMins = 0;
    let lateSubmissionsCount = 0;

    allSubmitted.forEach(log => {
      totalMins += parseDurationToMinutes(log.totalWorkDuration);
      if (log.isLateSubmission) {
        lateSubmissionsCount++;
      }
    });

    const avgMins = allSubmitted.length > 0 ? Math.round(totalMins / allSubmitted.length) : 0;
    const avgWorkDuration = formatMinutesToDuration(avgMins);

    // Employee Productivity Overview (List of employees with submission counts & avg hours)
    const employees = await Employee.find();
    const employeeOverview = [];

    for (const emp of employees) {
      const empLogs = await DailyWorkLog.find({ employee: emp._id, isFinalSubmitted: true });
      let empMins = 0;
      let empLate = 0;

      empLogs.forEach(log => {
        empMins += parseDurationToMinutes(log.totalWorkDuration);
        if (log.isLateSubmission) empLate++;
      });

      const empAvgMins = empLogs.length > 0 ? Math.round(empMins / empLogs.length) : 0;

      employeeOverview.push({
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        totalSubmitted: empLogs.length,
        avgDuration: formatMinutesToDuration(empAvgMins),
        lateSubmissions: empLate,
      });
    }

    // Weekly Submission Trends (Last 7 Days)
    const weeklyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = getStartOfDay(d);
      
      const dayLogs = await DailyWorkLog.find({ date: dayStart });
      const daySubmitted = dayLogs.filter(l => l.isFinalSubmitted).length;
      const dayPending = dayLogs.filter(l => !l.isFinalSubmitted).length;
      const dayMissing = Math.max(0, totalEmployees - dayLogs.length);

      weeklyTrends.push({
        date: dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        submitted: daySubmitted,
        pending: dayPending,
        missing: dayMissing,
      });
    }

    // Monthly Analytics (Daily Submissions for the current calendar month)
    const monthlyAnalytics = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      const dayStart = getStartOfDay(d);
      const dayLogs = await DailyWorkLog.find({ date: dayStart });
      const daySubmitted = dayLogs.filter(l => l.isFinalSubmitted).length;

      monthlyAnalytics.push({
        day: dayStart.getDate(),
        dateStr: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        submitted: daySubmitted,
      });
    }

    // Missing Update Reports (Employees who haven't submitted today)
    const submittedEmpIds = todayLogs.filter(l => l.isFinalSubmitted).map(l => String(l.employee));
    const missingEmployees = employees
      .filter(emp => !submittedEmpIds.includes(String(emp._id)))
      .map(emp => ({
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        officialEmail: emp.officialEmail,
      }));

    return res.status(200).json({
      success: true,
      analytics: {
        totalEmployees,
        submittedToday: submittedTodayCount,
        pendingUpdates: pendingTodayCount,
        missingUpdates: missingTodayCount,
        avgWorkDuration,
        lateSubmissions: lateSubmissionsCount,
        employeeOverview,
        weeklyTrends,
        monthlyAnalytics,
        missingEmployees,
      },
    });
  } catch (err) {
    console.error('getAdminWorklogAnalytics error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  createDailyWorkLog,
  getTodayDailyWorkLog,
  getDailyWorkLogHistory,
  updateDailyWorkLog,
  getEmployeeReport,
  getAdminWorklogAnalytics,
};
