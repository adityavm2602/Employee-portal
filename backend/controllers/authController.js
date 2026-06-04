 Employee-dashboard
// controllers/authController.js — Login, getMe, change password, forgot password

 main
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
      
      if (profile) {
        const { recordEmployeeContact } = require('../utils/worklogHelper');
        await recordEmployeeContact(profile);
      }
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
      
      if (profile) {
        const { recordEmployeeContact } = require('../utils/worklogHelper');
        await recordEmployeeContact(profile);
      }
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

Employee-dashboard
// ── POST /api/auth/reset-to-employeeid ───────────────────
// Forgot password: resets password back to Employee ID (no current password needed)
const resetToEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId)
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });

    // Find the employee record by Employee ID
    const employee = await Employee.findOne({ employeeId: employeeId.trim().toUpperCase() });
    if (!employee)
      return res.status(404).json({ success: false, message: 'No employee found with that Employee ID.' });

    // Get the associated user
    const user = await User.findById(employee.user).select('+password');
    if (!user)
      return res.status(404).json({ success: false, message: 'User account not found.' });

    // Reset password to their Employee ID (the system default)
    user.password = employeeId.trim().toUpperCase();
    await user.save(); // pre-save hook hashes it

    return res.status(200).json({
      success: true,
      message: `Password has been reset to your Employee ID: ${employeeId.trim().toUpperCase()}. Please log in and change it immediately.`,
    });
  } catch (err) {
    console.error('resetToEmployeeId error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { login, getMe, changePassword, resetToEmployeeId };

module.exports = {
  login,
  getMe,
  changePassword,
};
 main
