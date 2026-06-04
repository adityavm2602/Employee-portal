// routes/profile.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  uploadImage,
  changePassword,
} = require('../controllers/profileController');

router.get('/', protect, getProfile);
router.put('/update', protect, updateProfile);
router.post('/upload-image', protect, uploadImage);
router.put('/change-password', protect, changePassword);

module.exports = router;
