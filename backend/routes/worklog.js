// routes/worklog.js — Router for Smart Daily Time Tracking & Work Update
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createDailyWorkLog,
  getTodayDailyWorkLog,
  getDailyWorkLogHistory,
  updateDailyWorkLog,
  getEmployeeReport,
} = require('../controllers/dailyWorkLogController');

router.use(protect);

router.post('/create', createDailyWorkLog);
router.get('/today', getTodayDailyWorkLog);
router.get('/history', getDailyWorkLogHistory);
router.put('/update/:id', updateDailyWorkLog);
router.get('/report', getEmployeeReport);

module.exports = router;
