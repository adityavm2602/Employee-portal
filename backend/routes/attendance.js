// routes/attendance.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { markAttendance, getMyAttendance, getTeamAttendance, getAllAttendance } = require('../controllers/attendanceController');

router.use(protect);
router.post('/mark', authorize('employee'), markAttendance);
router.get('/my', getMyAttendance);
router.get('/team', authorize('tech_lead', 'admin'), getTeamAttendance);
router.get('/all', authorize('admin'), getAllAttendance);

module.exports = router;
