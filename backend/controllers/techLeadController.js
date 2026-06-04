const User = require("../models/User");
const Project = require("../models/Project");

// =======================================
// GET TEAM MEMBERS
// =======================================

exports.getTeamMembers = async (req, res) => {
  try {
    const employees = await User.find({
      role: "employee",
      teamLead: req.user._id,
    }).select("-password");

    res.status(200).json(employees);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// GET ASSIGNED PROJECTS
// =======================================

exports.getAssignedProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      techLead: req.user._id,
    }).populate("assignedEmployees", "name email");

    res.status(200).json(projects);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// GET EMPLOYEE DAILY UPDATES
// =======================================

exports.getEmployeeUpdates = async (req, res) => {
  try {
    const employees = await User.find({
      role: "employee",
      teamLead: req.user._id,
    }).select("name email dailyUpdates");

    res.status(200).json(employees);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// SUBMIT TECH LEAD DAILY UPDATE
// =======================================

exports.submitDailyUpdate = async (req, res) => {
  try {
    const { updateText } = req.body;

    const user = await User.findById(req.user._id);

    user.dailyUpdates.push({
      updateText,
      status: "pending",
    });

    await user.save();

    res.status(201).json({
      message: "Daily update submitted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// ADD COMMENT / FEEDBACK
// =======================================

exports.addComment = async (req, res) => {
  try {
    const { employeeId, updateIndex, comment } = req.body;

    const employee = await User.findOne({
      _id: employeeId,
      teamLead: req.user._id,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    employee.dailyUpdates[updateIndex].comments = comment;

    employee.dailyUpdates[updateIndex].status = "reviewed";

    employee.dailyUpdates[updateIndex].reviewedBy = req.user._id;

    await employee.save();

    res.status(200).json({
      message: "Feedback added successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// GET LEAVE REQUESTS
// =======================================

exports.getLeaveRequests = async (req, res) => {
  try {
    const employees = await User.find({
      role: "employee",
      teamLead: req.user._id,
    }).select("name email leaveRequests");

    res.status(200).json(employees);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// APPROVE LEAVE
// =======================================

exports.approveLeave = async (req, res) => {
  try {
    const { employeeId, leaveIndex } = req.body;

    const employee = await User.findOne({
      _id: employeeId,
      teamLead: req.user._id,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    employee.leaveRequests[leaveIndex].status = "approved";

    employee.leaveRequests[leaveIndex].approvedBy = req.user._id;

    employee.leaveRequests[leaveIndex].approvedAt = new Date();

    await employee.save();

    res.status(200).json({
      message: "Leave approved successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// REJECT LEAVE
// =======================================

exports.rejectLeave = async (req, res) => {
  try {
    const { employeeId, leaveIndex } = req.body;

    const employee = await User.findOne({
      _id: employeeId,
      teamLead: req.user._id,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    employee.leaveRequests[leaveIndex].status = "rejected";

    employee.leaveRequests[leaveIndex].approvedBy = req.user._id;

    employee.leaveRequests[leaveIndex].approvedAt = new Date();

    await employee.save();

    res.status(200).json({
      message: "Leave rejected successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// UPDATE PROJECT PROGRESS
// =======================================

exports.updateProjectProgress = async (req, res) => {
  try {
    const { progress } = req.body;

    const project = await Project.findOne({
      _id: req.params.projectId,
      techLead: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    project.progress = progress;

    if (progress >= 100) {
      project.status = "completed";
    } else {
      project.status = "in_progress";
    }

    await project.save();

    res.status(200).json({
      message: "Project progress updated",
      project,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};