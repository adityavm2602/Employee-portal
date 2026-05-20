const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

const generateToken = (payload) =>
  jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );

// ── LOGIN ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    let profile = null;

    if (user.role !== 'admin') {
      profile = await Employee.findOne({ user: user._id })
        .select(
          'firstName lastName employeeId officialEmail status currentProject'
        )
        .populate('currentProject', 'title');
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

// ── GET CURRENT USER ──────────────────────────────────
const getMe = async (req, res) => {
  try {
    console.log('GETME USER:', req.user);

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    let profile = null;

    if (user.role !== 'admin') {
      profile = await Employee.findOne({ user: user._id })
        .populate('currentProject', 'title');
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user.toJSON(),
        profile,
      },
    });
  } catch (err) {
    console.error('GETME ERROR:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

// ── CHANGE PASSWORD ───────────────────────────────────
const changePassword = async (req, res) => {
  try {
    console.log('CHANGE PASSWORD USER:', req.user);

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both passwords are required.',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    console.error('CHANGE PASSWORD ERROR:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

module.exports = {
  login,
  getMe,
  changePassword,
};