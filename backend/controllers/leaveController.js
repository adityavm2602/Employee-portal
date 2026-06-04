// controllers/leaveController.js — 2-step approval (TL → HR). TL can also apply (goes direct to HR).
const Leave    = require('../models/Leave');
const Employee = require('../models/Employee');
const Project  = require('../models/Project');
const User     = require('../models/User');
const {
  sendLeaveApplicationNotification,
  sendLeaveToHRAfterTLApproval,
  sendLeaveStatusToEmployee,
} = require('../services/emailService');

const getHR = () => User.findOne({ role: 'hr' });

// Helper to populate employee first/last names for reviewers (techLead, techLeadReviewedBy, hrReviewedBy)
const formatLeavesWithNames = async (leaves) => {
  if (!leaves || leaves.length === 0) return [];

  // Gather all unique User IDs we need names for
  const userIds = new Set();
  leaves.forEach(l => {
    if (l.techLead) userIds.add(l.techLead.toString());
    if (l.techLeadReviewedBy) {
      const tlId = typeof l.techLeadReviewedBy === 'object' && l.techLeadReviewedBy !== null
        ? l.techLeadReviewedBy._id.toString()
        : l.techLeadReviewedBy.toString();
      userIds.add(tlId);
    }
    if (l.hrReviewedBy) {
      const hrId = typeof l.hrReviewedBy === 'object' && l.hrReviewedBy !== null
        ? l.hrReviewedBy._id.toString()
        : l.hrReviewedBy.toString();
      userIds.add(hrId);
    }
  });

  // Find Employee profiles for all these users
  const employees = await Employee.find({ user: { $in: Array.from(userIds) } });
  const users = await User.find({ _id: { $in: Array.from(userIds) } });

  // Map to a Map for O(1) lookup
  const nameMap = new Map();
  const emailMap = new Map();

  users.forEach(u => {
    emailMap.set(u._id.toString(), u.email);
  });

  employees.forEach(e => {
    nameMap.set(e.user.toString(), `${e.firstName} ${e.lastName}`);
  });

  // Now format leaves
  return leaves.map(l => {
    const json = l.toJSON ? l.toJSON() : l;

    const tlIdStr = l.techLead ? l.techLead.toString() : null;
    const tlRevIdStr = l.techLeadReviewedBy
      ? (typeof l.techLeadReviewedBy === 'object' ? l.techLeadReviewedBy._id.toString() : l.techLeadReviewedBy.toString())
      : null;
    const hrRevIdStr = l.hrReviewedBy
      ? (typeof l.hrReviewedBy === 'object' ? l.hrReviewedBy._id.toString() : l.hrReviewedBy.toString())
      : null;

    // Resolve Tech Lead Name (selected)
    let techLeadName = 'N/A';
    if (tlIdStr) {
      techLeadName = nameMap.get(tlIdStr) || emailMap.get(tlIdStr) || 'Unknown TL';
    }

    // Resolve Tech Lead Reviewed By Name
    let techLeadReviewedByName = '';
    if (tlRevIdStr) {
      techLeadReviewedByName = nameMap.get(tlRevIdStr) || emailMap.get(tlRevIdStr) || 'Unknown TL';
    }

    // Resolve HR Reviewed By Name
    let hrReviewedByName = '';
    if (hrRevIdStr) {
      hrReviewedByName = nameMap.get(hrRevIdStr) || emailMap.get(hrRevIdStr) || 'Unknown HR';
    }

    return {
      ...json,
      techLeadName,
      techLeadReviewedByName,
      hrReviewedByName,
    };
  });
};

// GET /api/leaves/tech-leads
const getTechLeads = async (req, res) => {
  try {
    const techLeadUsers = await User.find({ role: 'tech_lead' }).select('email');
    const userIds = techLeadUsers.map(u => u._id);
    const employees = await Employee.find({ user: { $in: userIds } });

    const results = techLeadUsers.map(u => {
      const emp = employees.find(e => e.user.toString() === u._id.toString());
      return {
        _id: u._id,
        name: emp ? `${emp.firstName} ${emp.lastName}` : u.email,
        email: u.email,
      };
    });

    return res.status(200).json({ success: true, techLeads: results });
  } catch (err) {
    console.error('getTechLeads error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/leaves — Employee OR TechLead applies
// ─────────────────────────────────────────────────────────────────────────────
const applyLeave = async (req, res) => {
  try {
    const { from_date, to_date, reason, techLead } = req.body;
    if (!from_date || !to_date || !reason)
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    if (new Date(from_date) > new Date(to_date))
      return res.status(400).json({ success: false, message: 'from_date cannot be after to_date.' });

    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });

    const isTechLead = req.user.role === 'tech_lead';

    if (!isTechLead) {
      if (!techLead) {
        return res.status(400).json({ success: false, message: 'Please select a Tech Lead.' });
      }
      const leadUser = await User.findOne({ _id: techLead, role: 'tech_lead' });
      if (!leadUser) {
        return res.status(400).json({ success: false, message: 'Invalid Tech Lead selected.' });
      }
    }

    // Tech Lead leaves skip TL review — go straight to HR (they ARE the TL)
    const leave = await Leave.create({
      employee:      employee._id,
      fromDate:      new Date(from_date),
      toDate:        new Date(to_date),
      reason,
      techLead:      isTechLead ? null : techLead,
      // TL applying: auto-approve TL step, push to HR
      techLeadStatus:    isTechLead ? 'approved' : 'pending',
      techLeadReviewedBy: isTechLead ? req.user.id : null,
      techLeadReviewedAt: isTechLead ? new Date() : null,
      techLeadComment:   isTechLead ? 'Self-applied (Tech Lead)' : '',
      hrStatus:      isTechLead ? 'pending' : 'awaiting_tl',
      status:        isTechLead ? 'tl_approved' : 'pending',
    });

    // ── Notifications ───────────────────────────────────────────────────────
    (async () => {
      try {
        const hr = await getHR();

        if (isTechLead) {
          // TL applied → notify only HR directly for final decision
          if (hr) {
            const tlEmpName = `${employee.firstName} ${employee.lastName}`;
            await sendLeaveToHRAfterTLApproval({
              hrEmail:     hr.email,
              employee,
              leave,
              techLeadName: `${tlEmpName} (Self-Applied)`,
            });
          }
        } else {
          // Regular employee → notify their selected TL + HR
          let techLeadEmails = [];
          const selectedTL = await User.findById(techLead);
          if (selectedTL?.email) {
            techLeadEmails = [selectedTL.email];
          }
          await sendLeaveApplicationNotification({
            techLeadEmails,
            hrEmail: hr?.email || null,
            employee,
            leave,
          });
        }
      } catch (err) { console.error('Leave notification error:', err.message); }
    })();

    return res.status(201).json({
      success: true,
      message: isTechLead
        ? 'Leave submitted. HR has been notified for approval.'
        : 'Leave submitted. Your Tech Lead and HR have been notified.',
      leave,
    });
  } catch (err) {
    console.error('applyLeave error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leaves/my  (employee OR tech lead — own leaves)
// ─────────────────────────────────────────────────────────────────────────────
const getMyLeaves = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const leaves = await Leave.find({ employee: employee._id })
      .populate('techLeadReviewedBy', 'email')
      .populate('hrReviewedBy', 'email')
      .sort({ createdAt: -1 });
    const formattedLeaves = await formatLeavesWithNames(leaves);
    return res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getTeamLeaves = async (req, res) => {
  try {
    const myProjects    = await Project.find({ createdBy: req.user.id }).select('_id');
    const projectIds    = myProjects.map(p => p._id);
    const teamEmployees = await Employee.find({ currentProject: { $in: projectIds } }).select('_id');
    const empIds        = teamEmployees.map(e => e._id);

    const leaves = await Leave.find({
      $or: [
        { employee: { $in: empIds } },
        { techLead: req.user.id }
      ]
    })
      .populate('employee', 'firstName lastName employeeId officialEmail')
      .populate('techLeadReviewedBy', 'email')
      .populate('hrReviewedBy', 'email')
      .sort({ createdAt: -1 });
    const formattedLeaves = await formatLeavesWithNames(leaves);
    return res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getHRLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('employee', 'firstName lastName employeeId officialEmail')
      .populate('techLeadReviewedBy', 'email')
      .populate('hrReviewedBy', 'email')
      .sort({ createdAt: -1 });
    const formattedLeaves = await formatLeavesWithNames(leaves);
    return res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('employee', 'firstName lastName employeeId officialEmail')
      .populate('techLeadReviewedBy', 'email')
      .populate('hrReviewedBy', 'email')
      .sort({ createdAt: -1 });
    const formattedLeaves = await formatLeavesWithNames(leaves);
    return res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/leaves/:id/tl-review  — Tech Lead reviews employee's leave (Step 1)
// ─────────────────────────────────────────────────────────────────────────────
const techLeadReview = async (req, res) => {
  try {
    const { status, comment = '' } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });

    const leave = await Leave.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId officialEmail currentProject');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });

    if (leave.techLead && req.user.role !== 'admin' && leave.techLead.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to review this leave.' });
    }

    if (leave.techLeadStatus !== 'pending')
      return res.status(400).json({ success: false, message: 'Tech Lead has already reviewed this leave.' });

    leave.techLeadStatus    = status;
    leave.techLeadReviewedBy = req.user.id;
    leave.techLeadReviewedAt = new Date();
    leave.techLeadComment   = comment;

    if (status === 'rejected') {
      leave.status   = 'rejected';
      leave.hrStatus = 'awaiting_tl';
      await leave.save();

      const reviewer = await User.findById(req.user.id).select('email');
      sendLeaveStatusToEmployee({
        employeeEmail: leave.employee.officialEmail,
        employeeName:  `${leave.employee.firstName} ${leave.employee.lastName}`,
        status: 'rejected',
        approvedBy: `Tech Lead (${reviewer.email})`,
        comment,
        leave,
      }).catch(console.error);
    } else {
      // Approved by TL → pass to HR
      leave.hrStatus = 'pending';
      leave.status   = 'tl_approved';
      await leave.save();

      // Notify HR
      (async () => {
        try {
          const hr  = await getHR();
          if (!hr) return;
          const reviewer    = await User.findById(req.user.id).select('email');
          const reviewerEmp = await Employee.findOne({ user: req.user.id }).select('firstName lastName');
          const tlName = reviewerEmp
            ? `${reviewerEmp.firstName} ${reviewerEmp.lastName}`
            : reviewer.email;
          await sendLeaveToHRAfterTLApproval({ hrEmail: hr.email, employee: leave.employee, leave, techLeadName: tlName });
        } catch (err) { console.error('HR notification error:', err.message); }
      })();
    }

    return res.status(200).json({ success: true, message: `Leave ${status} by Tech Lead.` });
  } catch (err) {
    console.error('techLeadReview error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/leaves/:id/hr-review  — HR final decision (Step 2)
// ─────────────────────────────────────────────────────────────────────────────
const hrReview = async (req, res) => {
  try {
    const { status, comment = '' } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });

    const leave = await Leave.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId officialEmail');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });

    if (leave.techLeadStatus !== 'approved')
      return res.status(400).json({ success: false, message: 'Tech Lead must approve first.' });
    if (leave.hrStatus !== 'pending')
      return res.status(400).json({ success: false, message: 'HR has already reviewed this leave.' });

    leave.hrStatus     = status;
    leave.hrReviewedBy = req.user.id;
    leave.hrReviewedAt = new Date();
    leave.hrComment    = comment;
    leave.status       = status;
    await leave.save();

    const hrUser = await User.findById(req.user.id).select('email');
    sendLeaveStatusToEmployee({
      employeeEmail: leave.employee.officialEmail,
      employeeName:  `${leave.employee.firstName} ${leave.employee.lastName}`,
      status,
      approvedBy: `HR (${hrUser.email})`,
      comment,
      leave,
    }).catch(console.error);

    return res.status(200).json({ success: true, message: `Leave ${status} by HR.` });
  } catch (err) {
    console.error('hrReview error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { applyLeave, getMyLeaves, getTeamLeaves, getHRLeaves, getAllLeaves, techLeadReview, hrReview, getTechLeads };
