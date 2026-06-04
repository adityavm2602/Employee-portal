// routes/dailyUpdates.js — API endpoints for Daily Mandatory Updates
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createDailyUpdate,
  getTodayDailyUpdate,
  getDailyUpdateHistory,
  updateDailyUpdate,
} = require('../controllers/dailyUpdateController');

// All daily update routes require authentication
router.use(protect);

router.post('/', createDailyUpdate);
router.get('/today', getTodayDailyUpdate);
router.get('/history', getDailyUpdateHistory);
router.put('/:id', updateDailyUpdate);

module.exports = router;
