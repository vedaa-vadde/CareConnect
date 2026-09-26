require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
const User = require('../models/User');

// Use Google DNS for MongoDB Atlas SRV resolution on Windows
dns.setServers(['8.8.8.8', '1.1.1.1']);

const staffData = [
  {
    name: 'Platform Admin',
    username: 'admin',
    email: 'admin@careconnect.in',
    password: 'Admin@123',
    mobile: '9800000001',
    role: 'admin',
    accountStatus: 'active',
    location: { address: '123 Admin Office, Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
  },
  {
    name: 'Rakesh Sharma',
    username: 'ops_manager',
    email: 'ops@careconnect.in',
    password: 'Ops@1234',
    mobile: '9800000002',
    role: 'operations',
    accountStatus: 'active',
    location: { address: '456 Ops Center, Bandra', city: 'Mumbai', state: 'Maharashtra', pincode: '400051' },
  },
  {
    name: 'Priya Nair',
    username: 'support_agent',
    email: 'support@careconnect.in',
    password: 'Support@123',
    mobile: '9800000003',
    role: 'support',
    accountStatus: 'active',
    location: { address: '789 Support Office, Koramangala', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
  },
];

async function seedStaffOnly() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  console.log('Connecting to MongoDB...');
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  const dbName = conn.connection.name;
  console.log(`Connected to database: ${dbName}`);

  const userCountBefore = await User.countDocuments();
  console.log(`Total users before: ${userCountBefore}`);

  let adminUser = await User.findOne({ username: 'admin' });
  if (!adminUser) {
    const adminData = staffData.find((s) => s.role === 'admin');
    adminUser = new User(adminData);
    await adminUser.save();
    console.log(`✅ Created Admin user: "${adminUser.username}" (${adminUser.email})`);
  } else {
    console.log(`ℹ️ Admin user already exists: "${adminUser.username}"`);
  }

  for (const staff of staffData.filter((s) => s.role !== 'admin')) {
    const existing = await User.findOne({ username: staff.username });
    if (existing) {
      console.log(`ℹ️ User already exists: "${staff.username}" (${staff.role})`);
    } else {
      const newUser = new User({
        ...staff,
        createdBy: adminUser._id,
      });
      await newUser.save();
      console.log(`✅ Created ${staff.role} user: "${staff.username}" (${staff.email})`);
    }
  }

  const userCountAfter = await User.countDocuments();
  console.log('\n--- Summary ---');
  console.log(`Database name used: ${dbName}`);
  console.log(`Users before: ${userCountBefore}`);
  console.log(`Users after: ${userCountAfter}`);

  await mongoose.disconnect();
  console.log('Disconnected cleanly from MongoDB.');
}

seedStaffOnly().catch((err) => {
  console.error('Error seeding staff accounts:', err);
  process.exit(1);
});
