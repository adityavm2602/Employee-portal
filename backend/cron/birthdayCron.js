// cron/birthdayCron.js — Daily 8 AM: find birthday employees, email tech leads
const cron = require("node-cron");
const Employee = require("../models/Employee");
const User = require("../models/User");
const { sendBirthdayNotification } = require("../services/emailService");

const startBirthdayCron = () => {
  // Runs every day at 08:00
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log("Running birthday cron job...");
      try {
        const today = new Date();
        const month = today.getMonth() + 1; // 1-indexed
        const day = today.getDate();

        // MongoDB: use $expr + $month / $dayOfMonth operators
        const birthdayEmployees = await Employee.find({
          $expr: {
            $and: [
              { $eq: [{ $month: "$dob" }, month] },
              { $eq: [{ $dayOfMonth: "$dob" }, day] },
            ],
          },
        });

        if (birthdayEmployees.length === 0) {
          console.log("No birthdays today.");
          return;
        }

        // Get all tech lead emails
        const techLeads = await User.find({ role: "tech_lead" }).select(
          "email",
        );
        if (techLeads.length === 0) {
          console.log("No tech leads to notify.");
          return;
        }

        const techLeadEmails = techLeads.map((tl) => tl.email);

        for (const emp of birthdayEmployees) {
          const name = `${emp.firstName} ${emp.lastName}`;
          await sendBirthdayNotification(techLeadEmails, name);
          console.log(`Birthday notification sent for: ${name}`);
        }
      } catch (err) {
        console.error("Birthday cron error:", err.message);
      }
    },
    { timezone: "Asia/Kolkata" },
  ); // Change to your timezone

  console.log("Birthday cron scheduled (daily 8:00 AM)");
};

module.exports = { startBirthdayCron };
