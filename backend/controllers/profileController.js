// controllers/profileController.js
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const Employee = require('../models/Employee');
const EmployeeProfile = require('../models/EmployeeProfile');

// ── GET /api/profile ──────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let profile = await EmployeeProfile.findOne({ user: userId });

    if (!profile) {
      // Fetch details from Employee record
      const employee = await Employee.findOne({ user: userId });
      if (employee) {
        profile = await EmployeeProfile.create({
          user: userId,
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.officialEmail,
          phone: employee.contactNumber,
          department: employee.department || 'Engineering',
          designation: employee.designation || 'Software Engineer',
          joiningDate: employee.joiningDate || employee.createdAt || new Date(),
          address: '',
          skills: [],
          bio: '',
          emergencyContact: '',
          profileImage: '',
          workMode: 'Remote',
          bloodGroup: '',
          linkedin: '',
          github: '',
          qualification: '',
          certifications: [],
        });
      } else {
        // Fallback for Admin or users without an employee record
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        profile = await EmployeeProfile.create({
          user: userId,
          employeeId: user.role === 'admin' ? 'ADMIN' : 'USER',
          name: user.email.split('@')[0],
          email: user.email,
          phone: '0000000000',
          department: 'Management',
          designation: user.role.toUpperCase(),
          joiningDate: user.createdAt || new Date(),
          address: '',
          skills: [],
          bio: '',
          emergencyContact: '',
          profileImage: '',
          workMode: 'Remote',
          bloodGroup: '',
          linkedin: '',
          github: '',
          qualification: '',
          certifications: [],
        });
      }
    }

    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PUT /api/profile/update ───────────────────────────
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      phone,
      address,
      skills,
      bio,
      emergencyContact,
      workMode,
      bloodGroup,
      linkedin,
      github,
      qualification,
      certifications
    } = req.body;

    // Validate phone number format
    const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
    if (phone && !phoneRegex.test(phone.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    // Validate URLs (LinkedIn / GitHub) if provided
    const urlRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    if (linkedin && linkedin.trim() && !urlRegex.test(linkedin.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid LinkedIn URL format' });
    }
    if (github && github.trim() && !urlRegex.test(github.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid GitHub URL format' });
    }

    // Validate Work Mode enum
    if (workMode && !['Remote', 'Hybrid', 'On-site'].includes(workMode)) {
      return res.status(400).json({ success: false, message: 'Invalid Work Mode option' });
    }

    // Validate Blood Group enum
    if (bloodGroup && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bloodGroup)) {
      return res.status(400).json({ success: false, message: 'Invalid Blood Group option' });
    }

    const updatedProfile = await EmployeeProfile.findOneAndUpdate(
      { user: userId },
      {
        phone: phone ? phone.trim() : undefined,
        address: address !== undefined ? address.trim() : undefined,
        skills: Array.isArray(skills) ? skills : undefined,
        bio: bio !== undefined ? bio.trim() : undefined,
        emergencyContact: emergencyContact !== undefined ? emergencyContact.trim() : undefined,
        workMode: workMode !== undefined ? workMode : undefined,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
        linkedin: linkedin !== undefined ? linkedin.trim() : undefined,
        github: github !== undefined ? github.trim() : undefined,
        qualification: qualification !== undefined ? qualification.trim() : undefined,
        certifications: Array.isArray(certifications) ? certifications : undefined,
      },
      { new: true, runValidators: true, upsert: true }
    );

    // Sync phone number back to Employee record if it exists
    await Employee.findOneAndUpdate({ user: userId }, { contactNumber: phone });

    return res.status(200).json({ success: true, message: 'Profile updated successfully', profile: updatedProfile });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Multer Storage Configuration ──────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_profile_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ── POST /api/profile/upload-image ────────────────────
const uploadImage = async (req, res) => {
  const uploadSingle = upload.single('profileImage');

  uploadSingle(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Profile image size exceeds limit' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      const updatedProfile = await EmployeeProfile.findOneAndUpdate(
        { user: req.user.id },
        { profileImage: imageUrl },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully',
        profileImage: imageUrl,
        profile: updatedProfile,
      });
    } catch (err) {
      console.error('uploadImage error:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  });
};

// ── PUT /api/profile/change-password ──────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords required.' });
    }

    // Password validation rules:
    // Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const minLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!minLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return res.status(400).json({ success: false, message: 'Password does not meet requirements' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save(); // pre-save hook hashes the password

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadImage,
  changePassword,
};
