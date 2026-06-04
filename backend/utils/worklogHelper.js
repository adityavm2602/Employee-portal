const DailyWorkLog = require('../models/DailyWorkLog');

const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const recordEmployeeContact = async (employee) => {
  try {
    if (!employee) return;
    const today = getStartOfDay();
    
    // Check if daily work log already exists
    const existing = await DailyWorkLog.findOne({
      employee: employee._id,
      date: today,
    });
    
    if (!existing) {
      // Create new daily work log with loginTime set to now
      await DailyWorkLog.create({
        employee: employee._id,
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        date: today,
        loginTime: new Date(),
        status: 'Pending',
        isFinalSubmitted: false,
      });
      console.log(`Created new daily work log for employee ${employee.employeeId} on ${today.toISOString().split('T')[0]}`);
    } else if (!existing.loginTime) {
      // If log exists but doesn't have loginTime set for some reason, set it now
      existing.loginTime = new Date();
      await existing.save();
    }
  } catch (err) {
    console.error('Error in recordEmployeeContact helper:', err);
  }
};

module.exports = {
  getStartOfDay,
  recordEmployeeContact,
};
