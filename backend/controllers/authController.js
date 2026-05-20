// controllers/authController.js — Login, getMe, change password
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ── POST /api/auth/login ──────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    // Must explicitly select password (select: false in schema)
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    // Fetch employee profile for non-admin roles
    let profile = null;
    if (user.role !== 'admin') {
      profile = await Employee.findOne({ user: user._id })
        .select('firstName lastName employeeId officialEmail status currentProject')
        .populate('currentProject', 'title');
    }

    const token = generateToken({ id: user._id, email: user.email, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user._id, email: user.email, role: user.role, profile },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/auth/me ──────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    let profile = null;
    if (user.role !== 'admin') {
      profile = await Employee.findOne({ user: user._id })
        .populate('currentProject', 'title');
    }

    return res.status(200).json({ success: true, user: { ...user.toJSON(), profile } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PUT /api/auth/change-password ─────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords required.' });

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save(); // pre-save hook will hash

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { login, getMe, changePassword };
