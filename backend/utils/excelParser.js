// utils/excelParser.js — Parse .xlsx for bulk upload (employees, tech leads, HR)
const XLSX = require('xlsx');

const parseEmployeeExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const valid = [];
  const invalid = [];

  const REQUIRED = ['first_name', 'last_name', 'dob', 'employee_id', 'official_email', 'contact_number', 'status', 'role'];
  const EMAIL_RE = /^\S+@\S+\.\S+$/;
  const VALID_STATUS = ['probation', 'permanent'];
  const VALID_ROLES  = ['employee', 'tech_lead', 'hr'];

  rows.forEach((row, index) => {
    const errors = [];

    REQUIRED.forEach(f => {
      if (!row[f] || String(row[f]).trim() === '') errors.push(`Missing: ${f}`);
    });

    if (row.official_email && !EMAIL_RE.test(row.official_email))
      errors.push(`Invalid email: ${row.official_email}`);

    const role = String(row.role || '').trim().toLowerCase();
    if (role && !VALID_ROLES.includes(role))
      errors.push(`Invalid role: ${row.role}. Must be employee | tech_lead | hr`);

    // HR: status is optional (set permanent by default)
    const status = String(row.status || '').trim().toLowerCase();
    if (role !== 'hr' && status && !VALID_STATUS.includes(status))
      errors.push(`Invalid status: ${row.status}. Must be probation | permanent`);

    let dob = row.dob;
    if (dob instanceof Date) dob = dob.toISOString().split('T')[0];

    if (errors.length > 0) {
      invalid.push({ row: index + 2, data: row, errors });
    } else {
      valid.push({
        firstName:     String(row.first_name).trim(),
        lastName:      String(row.last_name).trim(),
        dob:           new Date(dob),
        employeeId:    String(row.employee_id).trim().toUpperCase(),
        officialEmail: String(row.official_email).trim().toLowerCase(),
        contactNumber: String(row.contact_number).trim(),
        status:        role === 'hr' ? 'permanent' : (status || 'probation'),
        role:          role || 'employee',
      });
    }
  });

  return { valid, invalid };
};

module.exports = { parseEmployeeExcel };
