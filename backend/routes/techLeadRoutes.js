const express = require("express");

const router = express.Router();

const {
  getTeamMembers,
  getAssignedProjects,
  getEmployeeUpdates,
  submitDailyUpdate,
  addComment,
  getLeaveRequests,
  approveLeave,
  rejectLeave,
  updateProjectProgress,
} = require("../controllers/techLeadController");

const { protect } = require("../middleware/auth");

// =======================================
// TECH LEAD ROLE CHECK
// =======================================

const techLeadOnly = (req, res, next) => {
  if (req.user.role !== "tech_lead") {
    return res.status(403).json({
      message: "Access denied. Tech Lead only.",
    });
  }

  next();
};

// =======================================
// TEAM MEMBERS
// =======================================

router.get(
  "/team",
  protect,
  techLeadOnly,
  getTeamMembers
);

// =======================================
// PROJECTS
// =======================================

router.get(
  "/projects",
  protect,
  techLeadOnly,
  getAssignedProjects
);

// =======================================
// DAILY UPDATES
// =======================================

router.get(
  "/updates",
  protect,
  techLeadOnly,
  getEmployeeUpdates
);

router.post(
  "/daily-update",
  protect,
  techLeadOnly,
  submitDailyUpdate
);

// =======================================
// FEEDBACK / COMMENTS
// =======================================

router.post(
  "/comment",
  protect,
  techLeadOnly,
  addComment
);

// =======================================
// LEAVE REQUESTS
// =======================================

router.get(
  "/leaves",
  protect,
  techLeadOnly,
  getLeaveRequests
);

router.put(
  "/leave/approve",
  protect,
  techLeadOnly,
  approveLeave
);

router.put(
  "/leave/reject",
  protect,
  techLeadOnly,
  rejectLeave
);

// =======================================
// PROJECT PROGRESS
// =======================================

router.put(
  "/project/progress/:projectId",
  protect,
  techLeadOnly,
  updateProjectProgress
);

module.exports = router;