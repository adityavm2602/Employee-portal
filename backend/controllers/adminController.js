//  controllers/adminController.js
const User     = require('../models/User');
const Employee = require('../models/Employee');
const Project  = require('../models/Project');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

const { parseEmployeeExcel }   = require('../utils/excelParser');
const { generateRandomPassword } = require('../utils/passwordGenerator');
const { sendWelcomeEmail }     = require('../services/emailService');

// ── Dashboard ─────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
    const month = today.getMonth()+1, day = today.getDate();

    //Safety Check
    const Task = mongoose.models.Task ? mongoose.model('Task') : null;
    const Leave = mongoose.models.Leave ? mongoose.model('Leave') : null;

    const [
      totalEmployees, 
      activeProjects, 
      presentToday, 
      absentToday, 
      todayBirthdays, 
      pendingTasksCount,
      pendingLeavesCount,
      approvedLeavesTodayCount
    ] = await Promise.all([
      Employee.countDocuments(),
      Project.countDocuments({ isActive: true }),
      
      // Attendance count
      Attendance.countDocuments({ attDate: { $gte: today, $lt: tomorrow }, status: 'present' }),
      Attendance.countDocuments({ attDate: { $gte: today, $lt: tomorrow }, status: 'absent' }),
      
      // Birthaday list
      Employee.find({ $expr: { $and: [{ $eq: [{ $month: '$dob' }, month] }, { $eq: [{ $dayOfMonth: '$dob' }, day] }] } })
        .select('firstName lastName employeeId'),
      
      // Productivity Overview 
      Task ? Task.countDocuments({ status: { $in: ['pending', 'in-progress'] } }) : 0,

      // १. Pending Leave Requests - Admin/TL Action Required)
      Leave ? Leave.countDocuments({ status: { $in: ['pending', 'tl_approved'] } }) : 0,

      // २. Employees on Leave - Approved Status for Today
      Leave ? Leave.countDocuments({
        status: 'approved',
        startDate: { $lte: tomorrow }, 
        endDate: { $gte: today }       
      }) : 0
    ]);

    // Productivity Calculation: 
    const productivityRate = totalEmployees > 0 
      ? Math.round((presentToday / totalEmployees) * 100) 
      : 0;

    
    return res.status(200).json({ 
      success: true, 
      dashboard: { 
        totalEmployees, 
        activeProjects, 
        attendance: { 
          present: presentToday, 
          absent: absentToday 
        }, 
        todayBirthdays,
        pendingLeaves: pendingLeavesCount,       
        employeesOnLeave: approvedLeavesTodayCount, 
        productivity: {
          rate: productivityRate, 
          pendingTasks: pendingTasksCount
        }
      } 
    });
  } catch(err) {
    console.error('getDashboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
// ── Helper: create one account ────────────────────────
const createAccount = async ({ officialEmail, firstName, lastName, dob, employeeId, contactNumber, status, role }) => {
  const plainPassword = generateRandomPassword();
  const user = await User.create({ email: officialEmail, password: plainPassword, role });
  await Employee.create({ user: user._id, firstName, lastName, dob, employeeId, officialEmail, contactNumber, status });

  sendWelcomeEmail({ email: officialEmail, firstName, lastName, employeeId, role, plainPassword })
    .catch(err => console.error(`Welcome email failed for ${officialEmail}:`, err.message));

  return user;
};

// ── POST /api/admin/employees (manual add) ────────────
const addEmployee = async (req, res) => {
  try {
    const { first_name, last_name, dob, employee_id, official_email, contact_number, status='probation', role='employee' } = req.body;

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

    await createAccount({ officialEmail: official_email.toLowerCase(), firstName: first_name, lastName: last_name, dob: new Date(dob), employeeId: employee_id.toUpperCase(), contactNumber: contact_number, status, role });

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
    const { search, department, projectId } = req.query;
    let query = {};

    if (department) query.department = department;
    if (projectId) query.currentProject = projectId;

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query)
      .populate('user', 'email role')
      .populate('currentProject', 'title')
      .populate({
        path: 'assignedProjects',
        select: 'title description',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 });

    let updatedEmployees = [];
    if (mongoose.models.Task) {
      const Task = mongoose.model('Task');
      updatedEmployees = await Promise.all(employees.map(async (emp) => {
        const currentTask = await Task.findOne({ 
          assignedTo: emp.user?._id, 
          status: { $in: ['in-progress', 'active', 'Ongoing'] } 
        }).select('title status description');
        return { ...emp.toObject(), currentTask };
      }));
    } else {
      updatedEmployees = employees;
    }

    return res.status(200).json({ success: true, employees: updatedEmployees });
  } catch (err) { 
    console.error('getAllEmployees error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' }); 
  }
};

// ── GET /api/admin/employees/:id ──────────────────────
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'email role')
      .populate('currentProject', 'title')
      .populate({
        path: 'assignedProjects',
        select: 'title description',
        options: { strictPopulate: false }
      });
      
    if (!employee) return res.status(404).json({ success:false, message:'Employee not found.' });
    
    let empObj = employee.toObject();
    if (mongoose.models.Task) {
      const Task = mongoose.model('Task');
      const currentTask = await Task.findOne({ 
        assignedTo: employee.user?._id, 
        status: { $in: ['in-progress', 'active', 'Ongoing'] } 
      });
      empObj.currentTask = currentTask;
    }

    return res.status(200).json({ success:true, employee: empObj });
  } catch(err) { return res.status(500).json({ success:false, message:'Server error.' }); }
};

// ── PUT /api/admin/employees/:id ──────────────────────
const updateEmployee = async (req, res) => {
  try {
    const { first_name, last_name, dob, contact_number, status } = req.body;
    const employee = await Employee.findByIdAndUpdate(req.params.id,
      { firstName:first_name, lastName:last_name, dob:new Date(dob), contactNumber:contact_number, status },
      { new:true, runValidators:true }
    );
    if (!employee) return res.status(404).json({ success:false, message:'Not found.' });
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

// ── GET /api/admin/work-logs ──────────────────────────
const getAdminWorkLogs = async (req, res) => {
  try {
    const WorkLog = mongoose.model('WorkLog'); 
    const logs = await WorkLog.find()
      .populate({ path: 'employee', select: 'firstName lastName employeeId' })
      .sort({ date: -1 });
    return res.status(200).json({ success: true, logs });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

// ── GET /api/admin/attendance ─────────────────────────
const getAdminAttendance = async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find()
      .populate({ path: 'employee', select: 'firstName lastName employeeId officialEmail' })
      .sort({ attDate: -1 });
    return res.status(200).json({ success: true, attendance: attendanceRecords });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

// ── 2-STEP LEAVE APPROVAL BACKEND APIs ────────────────

// 1. Fetch all leaves for admin
const getAdminLeaves = async (req, res) => {
  try {
    const Leave = mongoose.model('Leave');
    const leaves = await Leave.find()
      .populate({ path: 'employee', select: 'firstName lastName employeeId' })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, leaves });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// 2. Action API: Update 2-Step Status (Approve / Reject)
const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body; 
    const Leave = mongoose.model('Leave');

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { hrStatus: status, status: status },
      { new: true }
    );

    if (!leave) return res.status(404).json({ success: false, message: 'Leave record not found.' });

    return res.status(200).json({ success: true, message: `Leave request ${status} successfully.`, leave });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/admin/tech-lead-updates (NEW: Fetch Tech Lead Only Activities) ──
const getTechLeadUpdates = async (req, res) => {
  try {
    const WorkLog = mongoose.model('WorkLog'); 
    
    // १.  'tech_lead' 
    const Employee = mongoose.model('Employee');
    const techLeads = await Employee.find().populate({
      path: 'user',
      match: { role: 'tech_lead' } 
    });

    // २.  IDs filter
    const techLeadIds = techLeads.filter(emp => emp.user).map(emp => emp._id);

    // ३. worklogs
    const logs = await WorkLog.find({ employee: { $in: techLeadIds } })
      .populate('employee', 'firstName lastName employeeId')
      .sort({ date: -1 });

    return res.status(200).json({ success: true, logs });
  } catch (err) {
    console.error('getTechLeadUpdates error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { 
  getDashboard, addEmployee, bulkUploadEmployees, getAllEmployees, 
  getEmployeeById, updateEmployee, deleteEmployee, getAdminWorkLogs, 
  getAdminAttendance, getAdminLeaves, updateLeaveStatus, getTechLeadUpdates
};