// controllers/notificationController.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Project = require('../models/Project');

// ── POST /api/notifications/send ──────────────────────
const sendNotification = async (req, res) => {
  try {
    const { recipientType, recipientId, title, message, priority = 'medium', type = 'general' } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    // Get sender name
    let senderName = req.user.email;
    if (req.user.role !== 'admin') {
      const senderEmp = await Employee.findOne({ user: req.user.id });
      if (senderEmp) {
        senderName = `${senderEmp.firstName} ${senderEmp.lastName}`;
      }
    } else {
      senderName = 'Admin';
    }

    let recipients = [];

    if (recipientType === 'single') {
      if (!recipientId) return res.status(400).json({ success: false, message: 'Recipient User ID is required.' });
      recipients.push(recipientId);
    } else if (recipientType === 'all') {
      // Send to all users except the sender
      const allUsers = await User.find({ _id: { $ne: req.user.id } }).select('_id');
      recipients = allUsers.map(u => u._id.toString());
    } else if (recipientType === 'department') {
      if (!recipientId) return res.status(400).json({ success: false, message: 'Department name is required.' });
      // Find employees in department
      const deptEmployees = await Employee.find({ department: recipientId }).select('user');
      recipients = deptEmployees.map(e => e.user.toString());
    } else if (recipientType === 'team') {
      // Find projects created by this user
      const projects = await Project.find({ createdBy: req.user.id }).select('_id');
      const projectIds = projects.map(p => p._id);
      
      // Find employees on those projects
      const teamEmployees = await Employee.find({ currentProject: { $in: projectIds } }).select('user');
      recipients = teamEmployees.map(e => e.user.toString());
    } else {
      return res.status(400).json({ success: false, message: 'Invalid recipient type.' });
    }

    if (recipients.length === 0) {
      return res.status(200).json({ success: true, message: 'No recipients matched the criteria. Notification not sent.' });
    }

    const io = req.app.get('socketio');
    const createdNotifications = [];

    // Create notifications for each recipient
    for (const recId of recipients) {
      const notif = await Notification.create({
        senderId: req.user.id,
        senderName,
        senderRole: req.user.role,
        receiverId: recId,
        title,
        message,
        priority,
        type,
        isRead: false,
      });
      createdNotifications.push(notif);

      // Real-time socket broadcast
      if (io) {
        io.to(recId).emit('notification', notif);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Notification sent successfully to ${recipients.length} user(s).`,
      count: recipients.length,
    });
  } catch (err) {
    console.error('sendNotification error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/notifications ────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sent } = req.query;

    if (sent === 'true') {
      // Retrieve notifications sent by this user (Admin / Tech Lead / HR)
      const sentNotifications = await Notification.find({ senderId: userId }).sort({ createdAt: -1 });
      
      const grouped = [];
      for (const notif of sentNotifications) {
        const notifObj = notif.toObject();
        // Check if we already have a notification with matching content sent within 5 seconds of this one
        const isDuplicate = grouped.some(g => 
          g.title === notifObj.title &&
          g.message === notifObj.message &&
          g.priority === notifObj.priority &&
          g.type === notifObj.type &&
          Math.abs(new Date(g.createdAt) - new Date(notifObj.createdAt)) < 5000
        );
        if (!isDuplicate) {
          grouped.push(notifObj);
        }
      }
      return res.status(200).json({ success: true, notifications: grouped });
    }

    // Default: Retrieve notifications received by this user
    const notifications = await Notification.find({ receiverId: userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, notifications });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PUT /api/notifications/read/:id ───────────────────
const markAsRead = async (req, res) => {
  try {
    const notifId = req.params.id;
    const notif = await Notification.findOneAndUpdate(
      { _id: notifId, receiverId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({ success: true, message: 'Notification marked as read.', notification: notif });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── DELETE /api/notifications/:id ─────────────────────
const deleteNotification = async (req, res) => {
  try {
    const notifId = req.params.id;
    const notif = await Notification.findOneAndDelete({ _id: notifId, receiverId: req.user.id });

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    console.error('deleteNotification error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/notifications/unread-count ───────────────
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({ receiverId: userId, isRead: false });
    return res.status(200).json({ success: true, count });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  sendNotification,
  getNotifications,
  markAsRead,
  deleteNotification,
  getUnreadCount,
};
