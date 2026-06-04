// controllers/adminController.js
const User     = require('../models/User');
const Employee = require('../models/Employee');
const Project  = require('../models/Project');
const Attendance = require('../models/Attendance');
const { parseEmployeeExcel }   = require('../utils/excelParser');
const { generateRandomPassword } = require('../utils/passwordGenerator');
const { sendWelcomeEmail }     = require('../services/emailService');

// ── Dashboard ─────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
    const month = today.getMonth()+1, day = today.getDate();

    const [totalEmployees, activeProjects, presentToday, absentToday, todayBirthdays] = await Promise.all([
      Employee.countDocuments(),
      Project.countDocuments({ isActive: true }),
      Attendance.countDocuments({ attDate:{$gte:today,$lt:tomorrow}, status:'present' }),
      Attendance.countDocuments({ attDate:{$gte:today,$lt:tomorrow}, status:'absent' }),
      Employee.find({ $expr: { $and: [{ $eq:[{$month:'$dob'},month] }, { $eq:[{$dayOfMonth:'$dob'},day] }] } })
        .select('firstName lastName employeeId'),
    ]);

    return res.status(200).json({ success:true, dashboard:{ totalEmployees, activeProjects, attendance:{present:presentToday,absent:absentToday}, todayBirthdays } });
  } catch(err) {
    console.error('getDashboard error:',err);
    return res.status(500).json({ success:false, message:'Server error.' });
  }
};

// ── Helper: create one account ────────────────────────
const createAccount = async ({ officialEmail, firstName, lastName, dob, employeeId, contactNumber, status, role, department, designation, joiningDate }) => {
  const plainPassword = generateRandomPassword();
  const user = await User.create({ email: officialEmail, password: plainPassword, role });
  
  await Employee.create({
    user: user._id,
    firstName,
    lastName,
    dob,
    employeeId,
    officialEmail,
    contactNumber,
    status,
    department,
    designation,
    joiningDate: joiningDate ? new Date(joiningDate) : undefined
  });

  const EmployeeProfile = require('../models/EmployeeProfile');
  await EmployeeProfile.create({
    user: user._id,
    employeeId,
    name: `${firstName} ${lastName}`,
    email: officialEmail,
    phone: contactNumber,
    department: department || 'Engineering',
    designation: designation || 'Software Engineer',
    joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
    address: '',
    skills: [],
    bio: '',
    emergencyContact: '',
    profileImage: ''
  });

  // Send welcome email with plain password
  sendWelcomeEmail({ email: officialEmail, firstName, lastName, employeeId, role, plainPassword })
    .catch(err => console.error(`Welcome email failed for ${officialEmail}:`, err.message));

  return user;
};

// ── POST /api/admin/employees (manual add) ────────────
const addEmployee = async (req, res) => {
  try {
    const { first_name, last_name, dob, employee_id, official_email, contact_number, status='probation', role='employee', department, designation, joining_date } = req.body;

    if (!first_name||!last_name||!dob||!employee_id||!official_email||!contact_number)
      return res.status(400).json({ success:false, message:'All fields are required.' });

    if (role === 'hr') {
      const existingHR = await User.findOne({ role:'hr' });
      if (existingHR) return res.status(409).json({ success:false, message:'An HR account already exists. Only one HR is allowed.' });
    }

    const emailExists = await User.findOne({ email: official_email });
    if (emailExists) return res.status(409).json({ success:false, message:'Email already exists.' });

    const empIdExists = await Employee.findOne({ employeeId: employee_id.toUpperCase() });
    if (empIdExists) return res.status(409).json({ success:false, message:'Employee ID already exists.' });

    await createAccount({
      officialEmail: official_email.toLowerCase(),
      firstName: first_name,
      lastName: last_name,
      dob: new Date(dob),
      employeeId: employee_id.toUpperCase(),
      contactNumber: contact_number,
      status,
      role,
      department,
      designation,
      joiningDate: joining_date
    });

    return res.status(201).json({ success:true, message:`Account created. Welcome email with login credentials sent to ${official_email}.` });
  } catch(err) {
    console.error('addEmployee error:',err);
    if (err.code===11000) return res.status(409).json({ success:false, message:'Duplicate email or employee ID.' });
    return res.status(500).json({ success:false, message:'Server error.' });
  }
};

// ── POST /api/admin/employees/bulk-upload ─────────────
const bulkUploadEmployees = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success:false, message:'No file uploaded.' });

    const { valid, invalid } = parseEmployeeExcel(req.file.buffer);
    const successRows = [], failedRows = [...invalid];

    for (const emp of valid) {
      try {
        // HR uniqueness check
        if (emp.role === 'hr') {
          const existingHR = await User.findOne({ role:'hr' });
          if (existingHR) { failedRows.push({ data:emp, errors:['HR account already exists. Only one HR allowed.'] }); continue; }
        }

        const emailExists = await User.findOne({ email: emp.officialEmail });
        if (emailExists) { failedRows.push({ data:emp, errors:['Duplicate email'] }); continue; }

        const empIdExists = await Employee.findOne({ employeeId: emp.employeeId });
        if (empIdExists) { failedRows.push({ data:emp, errors:['Duplicate Employee ID'] }); continue; }

        await createAccount(emp);
        successRows.push(`${emp.employeeId} (${emp.role})`);
      } catch(err) {
        failedRows.push({ data:emp, errors:[err.message] });
      }
    }

    return res.status(200).json({
      success:true,
      message:`Bulk upload done. Welcome emails with passwords sent to all successful accounts.`,
      summary:{ total: valid.length+invalid.length, succeeded: successRows.length, failed: failedRows.length },
      successRows, failedRows,
    });
  } catch(err) {
    console.error('bulkUpload error:',err);
    return res.status(500).json({ success:false, message:'Server error.' });
  }
};

// ── GET /api/admin/employees ──────────────────────────
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().populate('user','email role').populate('currentProject','title').sort({ createdAt:-1 });
    return res.status(200).json({ success:true, employees });
  } catch(err) { return res.status(500).json({ success:false, message:'Server error.' }); }
};

// ── GET /api/admin/employees/:id ──────────────────────
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('user','email role').populate('currentProject','title');
    if (!employee) return res.status(404).json({ success:false, message:'Employee not found.' });
    return res.status(200).json({ success:true, employee });
  } catch(err) { return res.status(500).json({ success:false, message:'Server error.' }); }
};

// ── PUT /api/admin/employees/:id ──────────────────────
const updateEmployee = async (req, res) => {
  try {
    const { first_name, last_name, dob, contact_number, status, department, designation, joining_date } = req.body;
    const employee = await Employee.findByIdAndUpdate(req.params.id,
      {
        firstName: first_name,
        lastName: last_name,
        dob: new Date(dob),
        contactNumber: contact_number,
        status,
        department,
        designation,
        joiningDate: joining_date ? new Date(joining_date) : undefined
      },
      { new: true, runValidators: true }
    );
    if (!employee) return res.status(404).json({ success:false, message:'Not found.' });

    // Sync with EmployeeProfile
    const EmployeeProfile = require('../models/EmployeeProfile');
    await EmployeeProfile.findOneAndUpdate(
      { user: employee.user },
      {
        name: `${first_name} ${last_name}`,
        phone: contact_number,
        department,
        designation,
        joiningDate: joining_date ? new Date(joining_date) : undefined
      },
      { upsert: true }
    );

    return res.status(200).json({ success:true, message:'Employee updated.', employee });
  } catch(err) { return res.status(500).json({ success:false, message:'Server error.' }); }
};

// ── DELETE /api/admin/employees/:id ──────────────────
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success:false, message:'Not found.' });
    await User.findByIdAndDelete(employee.user);
    await Employee.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success:true, message:'Employee deleted.' });
  } catch(err) { return res.status(500).json({ success:false, message:'Server error.' }); }
};

module.exports = { getDashboard, addEmployee, bulkUploadEmployees, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee };
