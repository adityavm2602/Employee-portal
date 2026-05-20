// routes/auth.js
const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, resetToEmployeeId } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/reset-to-employeeid', resetToEmployeeId); // Public: forgot password

module.exports = router;
