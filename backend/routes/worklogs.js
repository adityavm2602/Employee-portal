// routes/worklogs.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { createWorkLog, getMyWorkLogs, getTeamWorkLogs, getEmployeeWorkLogs } = require('../controllers/worklogController');

router.use(protect);
router.post('/', authorize('employee'), createWorkLog);
router.get('/my', getMyWorkLogs);
router.get('/team', authorize('tech_lead', 'admin'), getTeamWorkLogs);
router.get('/employee/:employeeId', authorize('tech_lead', 'admin'), getEmployeeWorkLogs);
// router.get('/all', protect, adminOnly, getAllWorkLogs);

module.exports = router;
