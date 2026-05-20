// scripts/seed.js — Creates the default admin user in MongoDB
// Run: node scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: 'admin@company.com' });
    if (existing) {
      console.log('ℹ️  Admin user already exists. Skipping seed.');
    } else {
      await User.create({
        email: 'admin@company.com',
        password: 'Admin@123',
        role: 'admin',
      });
      console.log('🌱 Admin user created:');
      console.log('   Email   : admin@company.com');
      console.log('   Password: Admin@123');
      console.log('   ⚠️  Change this password after first login!');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();

// Optional: seed a test HR account
const seedHR = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await User.findOne({ role: 'hr' });
    if (existing) { console.log('ℹ️  HR already exists.'); }
    else {
      const { generateRandomPassword } = require('../utils/passwordGenerator');
      const pwd = generateRandomPassword();
      await User.create({ email: 'hr@company.com', password: pwd, role: 'hr' });
      const Employee = require('../models/Employee');
      await Employee.create({
        user: (await User.findOne({email:'hr@company.com'}))._id,
        firstName: 'HR', lastName: 'Manager', dob: new Date('1985-01-01'),
        employeeId: 'HR001', officialEmail: 'hr@company.com',
        contactNumber: '0000000000', status: 'permanent',
      });
      console.log('🌹 HR user created: hr@company.com | Password:', pwd);
    }
    await mongoose.connection.close(); process.exit(0);
  } catch(err) { console.error(err); process.exit(1); }
};
