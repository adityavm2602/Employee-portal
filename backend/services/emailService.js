// services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const requiredSmtpKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
const missingKeys = requiredSmtpKeys.filter((key) => !process.env[key]);
if (missingKeys.length > 0) {
  console.warn(`Missing SMTP environment variables: ${missingKeys.join(', ')}. Emails may fail to send.`);
}

const smtpHost = process.env.SMTP_HOST;
if (smtpHost && smtpHost.includes('@')) {
  console.warn('SMTP_HOST looks like an email address. It should be your SMTP server hostname (for Gmail, smtp.gmail.com).');
}

const emailFromRaw = process.env.EMAIL_FROM || 'no-reply@example.com';
const emailFrom = emailFromRaw.includes('<') ? emailFromRaw : `Employee Portal <${emailFromRaw}>`;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP transporter verification failed:', error.message);
  } else {
    console.log('SMTP transporter is ready to send messages');
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    });
    console.log(`📧 Email sent [${subject}]: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    throw err;
  }
};

// ── Welcome email with random password ──────────────────────────────────────
const sendWelcomeEmail = async ({ email, firstName, lastName, employeeId, role, plainPassword }) => {
  const portalUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const roleLabels = { employee: 'Employee', tech_lead: 'Tech Lead', hr: 'HR Manager', admin: 'Admin' };
  const roleLabel = roleLabels[role] || 'User';

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:36px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">👋 Welcome to Employee Portal!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Your <strong>${roleLabel}</strong> account is ready</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#1e293b;margin:0 0 24px;">Hi <strong>${firstName} ${lastName}</strong>,</p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Your Login Credentials</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:6px 6px 0 0;font-size:12px;color:#64748b;font-weight:600;width:140px;">Employee ID</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;border-top:none;font-size:14px;color:#1e293b;font-weight:700;">${employeeId}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;border-top:none;font-size:12px;color:#64748b;font-weight:600;">Login Email</td>
            <td style="padding:10px 12px;background:#fff;border:1px solid #e2e8f0;border-top:none;font-size:14px;color:#1e293b;">${email}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#fef3c7;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 0 6px;font-size:12px;color:#92400e;font-weight:600;">Password</td>
            <td style="padding:10px 12px;background:#fef3c7;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 6px 0;font-size:16px;color:#b45309;font-weight:800;letter-spacing:2px;font-family:monospace;">${plainPassword}</td>
          </tr>
        </table>
      </div>

      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
          ⚠️ <strong>This is your system-generated password.</strong> Please change it immediately after first login using <strong>Change Password</strong> in your dashboard.
        </p>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${portalUrl}/login" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">
          Login to Portal →
        </a>
      </div>

      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#0369a1;">Getting Started</p>
        <ol style="margin:0;padding-left:18px;font-size:13px;color:#0c4a6e;line-height:2;">
          <li>Visit <a href="${portalUrl}/login" style="color:#2563eb;">${portalUrl}/login</a></li>
          <li>Enter your email and the password above</li>
          <li>Go to <strong>Change Password</strong> and set a secure password</li>
          <li>Start using your portal!</li>
        </ol>
      </div>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">Automated email from Employee Portal. Do not reply.</p>
    </div>
  </div>`;

  return sendEmail(email, '🎉 Welcome to Employee Portal — Your Login Credentials', html);
};

// ── Leave application notification (to TL + HR) ─────────────────────────────
const sendLeaveApplicationNotification = async ({ techLeadEmails, hrEmail, employee, leave }) => {
  const days = Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000*60*60*24)) + 1;
  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:#7c3aed;padding:24px 32px;color:#fff;">
      <h2 style="margin:0;">📋 New Leave Request</h2>
      <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">Action required from you</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#475569;font-size:14px;margin:0 0 20px;">
        <strong>${employee.firstName} ${employee.lastName}</strong> (${employee.employeeId}) has submitted a leave request.
      </p>
      <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:600;width:120px;">From</td><td style="padding:10px 14px;font-size:14px;color:#1e293b;">${new Date(leave.fromDate).toDateString()}</td></tr>
        <tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:600;border-top:1px solid #e2e8f0;">To</td><td style="padding:10px 14px;font-size:14px;color:#1e293b;border-top:1px solid #e2e8f0;">${new Date(leave.toDate).toDateString()}</td></tr>
        <tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:600;border-top:1px solid #e2e8f0;">Duration</td><td style="padding:10px 14px;font-size:14px;color:#1e293b;font-weight:700;border-top:1px solid #e2e8f0;">${days} day(s)</td></tr>
        <tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:600;border-top:1px solid #e2e8f0;">Reason</td><td style="padding:10px 14px;font-size:14px;color:#1e293b;border-top:1px solid #e2e8f0;">${leave.reason}</td></tr>
      </table>
      <div style="margin-top:20px;padding:14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;">
        <p style="margin:0;font-size:13px;color:#0369a1;">
          📌 <strong>Approval Process:</strong> Tech Lead must approve first, then HR will do the final review. Both approvals are required for leave to be granted.
        </p>
      </div>
      <p style="margin-top:20px;font-size:13px;color:#64748b;">Login to the portal to review this request.</p>
    </div>
  </div>`;

  const recipients = [...(techLeadEmails || [])];
  if (hrEmail) recipients.push(hrEmail);
  return sendEmail(recipients, `Leave Request: ${employee.firstName} ${employee.lastName} (${days} days)`, html);
};

// ── Tech Lead approved → Notify HR ──────────────────────────────────────────
const sendLeaveToHRAfterTLApproval = async ({ hrEmail, employee, leave, techLeadName }) => {
  const days = Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000*60*60*24)) + 1;
  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:#059669;padding:24px 32px;color:#fff;">
      <h2 style="margin:0;">✅ Tech Lead Approved — Your Turn!</h2>
      <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">HR final approval required</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#475569;font-size:14px;margin:0 0 20px;">
        Tech Lead <strong>${techLeadName}</strong> has approved the leave request from <strong>${employee.firstName} ${employee.lastName}</strong>.
        Your final approval is now required.
      </p>
      <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:600;width:120px;">Employee</td><td style="padding:10px 14px;font-size:14px;color:#1e293b;">${employee.firstName} ${employee.lastName} (${employee.employeeId})</td></tr>
        <tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:600;border-top:1px solid #e2e8f0;">Duration</td><td style="padding:10px 14px;font-size:14px;font-weight:700;color:#1e293b;border-top:1px solid #e2e8f0;">${days} day(s) | ${new Date(leave.fromDate).toDateString()} – ${new Date(leave.toDate).toDateString()}</td></tr>
        <tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:600;border-top:1px solid #e2e8f0;">Reason</td><td style="padding:10px 14px;font-size:14px;color:#1e293b;border-top:1px solid #e2e8f0;">${leave.reason}</td></tr>
        <tr><td style="padding:10px 14px;background:#dcfce7;font-size:12px;color:#166534;font-weight:600;border-top:1px solid #e2e8f0;">TL Status</td><td style="padding:10px 14px;font-size:14px;color:#166534;font-weight:700;border-top:1px solid #e2e8f0;">✅ Approved by ${techLeadName}</td></tr>
      </table>
      <p style="margin-top:20px;font-size:13px;color:#64748b;">Login to the portal to give your final decision.</p>
    </div>
  </div>`;

  return sendEmail(hrEmail, `HR Final Approval Needed: ${employee.firstName} ${employee.lastName}'s Leave`, html);
};

// ── Final status notification to employee ───────────────────────────────────
const sendLeaveStatusToEmployee = async ({ employeeEmail, employeeName, status, approvedBy, comment, leave }) => {
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const color = isApproved ? '#059669' : '#dc2626';
  const emoji = isApproved ? '✅' : '❌';
  const days = Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000*60*60*24)) + 1;

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:${color};padding:24px 32px;color:#fff;">
      <h2 style="margin:0;">${emoji} Leave Request ${isApproved ? 'Approved' : 'Rejected'}</h2>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#475569;font-size:14px;margin:0 0 20px;">Hi <strong>${employeeName}</strong>, your leave request has been <strong style="color:${color};">${status.toUpperCase()}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:600;width:140px;">Duration</td><td style="padding:10px 14px;font-size:14px;color:#1e293b;">${days} day(s)</td></tr>
        <tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:600;border-top:1px solid #e2e8f0;">Period</td><td style="padding:10px 14px;font-size:14px;color:#1e293b;border-top:1px solid #e2e8f0;">${new Date(leave.fromDate).toDateString()} – ${new Date(leave.toDate).toDateString()}</td></tr>
        <tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:600;border-top:1px solid #e2e8f0;">Final Decision By</td><td style="padding:10px 14px;font-size:14px;color:#1e293b;border-top:1px solid #e2e8f0;">${approvedBy}</td></tr>
        ${comment ? `<tr><td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:600;border-top:1px solid #e2e8f0;">Comment</td><td style="padding:10px 14px;font-size:14px;color:#1e293b;border-top:1px solid #e2e8f0;">${comment}</td></tr>` : ''}
      </table>
      <p style="margin-top:20px;font-size:13px;color:#64748b;">Login to the portal for full details.</p>
    </div>
  </div>`;

  return sendEmail(employeeEmail, `Leave ${isApproved ? 'Approved ✅' : 'Rejected ❌'} — Employee Portal`, html);
};

// ── Project notification ─────────────────────────────────────────────────────
const sendProjectNotification = async (recipientEmails, project) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      <div style="background:#2563eb;padding:24px;color:white;"><h2 style="margin:0;">🚀 New Project Available!</h2></div>
      <div style="padding:24px;">
        <h3 style="color:#1e293b;">${project.title}</h3>
        <p style="color:#475569;">${project.description}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <tr><td style="padding:8px;background:#f1f5f9;font-weight:bold;width:40%;">Required Skills</td><td style="padding:8px;">${project.requiredSkills || 'N/A'}</td></tr>
          <tr><td style="padding:8px;background:#f1f5f9;font-weight:bold;">Duration</td><td style="padding:8px;">${project.duration || 'N/A'}</td></tr>
        </table>
        <p style="margin-top:20px;color:#64748b;">Login to the Employee Portal to apply.</p>
      </div>
    </div>`;
  return sendEmail(recipientEmails, `New Project: ${project.title}`, html);
};

// ── Birthday notification ────────────────────────────────────────────────────
const sendBirthdayNotification = async (techLeadEmails, employeeName) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      <div style="background:#f59e0b;padding:24px;color:white;"><h2 style="margin:0;">🎂 Birthday Alert!</h2></div>
      <div style="padding:24px;text-align:center;">
        <p style="font-size:18px;color:#1e293b;">Today is <strong>${employeeName}</strong>'s birthday!</p>
        <p style="color:#64748b;">Don't forget to wish them! 🎉</p>
      </div>
    </div>`;
  return sendEmail(techLeadEmails, `🎂 Birthday: ${employeeName}`, html);
};

// ── Personal birthday wish to employee ────────────────────────────────────
const sendBirthdayWishToEmployee = async (employeeEmail, employeeName) => {
  const portalUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:#2563eb;padding:24px;color:#fff;text-align:center;"><h2 style="margin:0;">Happy Birthday, ${employeeName}! 🎉</h2></div>
      <div style="padding:28px 32px;color:#1e293b;text-align:left;">
        <p style="font-size:16px;">Dear <strong>${employeeName}</strong>,</p>
        <p style="color:#475569;font-size:14px;line-height:1.6;">Wishing you a very happy birthday from all of us at the company. We hope you have a wonderful day filled with joy and celebration.</p>
        <p style="color:#475569;font-size:14px;line-height:1.6;">Thank you for being an important part of our team. Enjoy your day!</p>
        <p style="margin-top:18px;text-align:center;"><a href="${portalUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Visit Portal</a></p>
      </div>
      <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 24px;text-align:center;color:#94a3b8;">Automated message from Employee Portal</div>
    </div>`;

  return sendEmail(employeeEmail, `Happy Birthday ${employeeName} 🎉 — From Company`, html);
};

// ── Application status ───────────────────────────────────────────────────────
const sendApplicationStatus = async (employeeEmail, projectTitle, status) => {
  const colors = { accepted: '#16a34a', rejected: '#dc2626', hold: '#d97706' };
  const color = colors[status] || '#2563eb';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      <div style="background:${color};padding:24px;color:white;"><h2 style="margin:0;">Application Update</h2></div>
      <div style="padding:24px;">
        <p>Your application for <strong>${projectTitle}</strong> has been <strong style="color:${color};text-transform:uppercase;">${status}</strong>.</p>
        <p style="color:#64748b;">Login to the portal for more details.</p>
      </div>
    </div>`;
  return sendEmail(employeeEmail, `Application ${status}: ${projectTitle}`, html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendLeaveApplicationNotification,
  sendLeaveToHRAfterTLApproval,
  sendLeaveStatusToEmployee,
  sendProjectNotification,
  sendBirthdayNotification,
  sendBirthdayWishToEmployee,
  sendApplicationStatus,
};
