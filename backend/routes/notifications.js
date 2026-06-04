// routes/notifications.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const {
  sendNotification,
  getNotifications,
  markAsRead,
  deleteNotification,
  getUnreadCount,
} = require('../controllers/notificationController');

// All endpoints require authentication
router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read/:id', markAsRead);
router.delete('/:id', deleteNotification);

// Only Admin, HR, and Tech Lead can send notifications
router.post('/send', authorize('admin', 'tech_lead', 'hr'), sendNotification);

module.exports = router;
