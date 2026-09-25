require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const ServiceCategory = require('../models/ServiceCategory');
const ServiceRequest = require('../models/ServiceRequest');
const Quote = require('../models/Quote');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Availability = require('../models/Availability');
const Invoice = require('../models/Invoice');
const Dispute = require('../models/Dispute');
const JobEvidence = require('../models/JobEvidence');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/careconnect');
  console.log('✅ Connected to MongoDB for clean seeding...');
};

const seed = async () => {
  await connectDB();

  console.log('🧹 Purging all previous data (clean slate)...');
  await Promise.all([
    User.deleteMany({}),
    ProviderProfile.deleteMany({}),
    ServiceCategory.deleteMany({}),
    ServiceRequest.deleteMany({}),
    Quote.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    Availability.deleteMany({}),
    Invoice.deleteMany({}),
    Dispute.deleteMany({}),
    JobEvidence.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log('🌱 Seeding service categories catalog...');
  const categories = await ServiceCategory.insertMany([
    {
      name: 'Washing Machine Repair',
      slug: 'washing-machine-repair',
      description: 'Professional washing machine repair and maintenance services. Drum, motor, pump, and spin cycles.',
      icon: '🧺',
      image: '/uploads/categories/washing-machine.jpg',
      requiredSkills: ['Washing Machine Technician', 'Appliance Repair'],
      pricingRules: { minimum: 500, maximum: 3000, unit: 'per_job', notes: 'Price varies based on fault complexity.' },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Refrigerator Repair',
      slug: 'refrigerator-repair',
      description: 'Expert refrigerator and freezer repair services. Cooling issues, compressor, gas refilling.',
      icon: '❄️',
      image: '/uploads/categories/refrigerator.jpg',
      requiredSkills: ['Refrigerator Technician', 'Appliance Repair'],
      pricingRules: { minimum: 500, maximum: 4000, unit: 'per_job' },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'AC Repair',
      slug: 'ac-repair',
      description: 'Air conditioner installation, service, and repair. All brands and models covered.',
      icon: '❄️',
      image: '/uploads/categories/ac-repair.jpg',
      requiredSkills: ['AC Technician', 'HVAC Specialist'],
      pricingRules: { minimum: 400, maximum: 5000, unit: 'per_job' },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Electrical Work',
      slug: 'electrical-work',
      description: 'Licensed electricians for all your home electrical needs. Wiring, switches, panel upgrades, and fans.',
      icon: '⚡',
      image: '/uploads/categories/electrical.jpg',
      requiredSkills: ['Electrician', 'Electrical Engineer'],
      pricingRules: { minimum: 300, maximum: 8000, unit: 'per_job', notes: 'Includes material cost estimate.' },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Plumbing',
      slug: 'plumbing',
      description: 'Expert plumbing services for leaks, drainage, pipe fitting, and bathroom fixtures.',
      icon: '🚰',
      image: '/uploads/categories/plumbing.jpg',
      requiredSkills: ['Plumber', 'Pipe Fitter'],
      pricingRules: { minimum: 300, maximum: 6000, unit: 'per_job' },
      sortOrder: 5,
      isActive: true,
    },
    {
      name: 'House Cleaning',
      slug: 'house-cleaning',
      description: 'Deep home cleaning, kitchen cleaning, bathroom sanitization, and sofa shampooing.',
      icon: '🧹',
      image: '/uploads/categories/cleaning.jpg',
      requiredSkills: ['Professional Cleaner', 'Deep Cleaning Specialist'],
      pricingRules: { minimum: 800, maximum: 5500, unit: 'per_job', notes: 'House Cleaning minimum ₹4000 for full house deep clean' },
      sortOrder: 6,
      isActive: true,
    },
    {
      name: 'Appliance Repair',
      slug: 'appliance-repair',
      description: 'Repair services for microwave, oven, dishwasher, geyser, and other home appliances.',
      icon: '🔧',
      image: '/uploads/categories/appliance.jpg',
      requiredSkills: ['Appliance Technician'],
      pricingRules: { minimum: 300, maximum: 3500, unit: 'per_job' },
      sortOrder: 7,
      isActive: true,
    },
    {
      name: 'Home Maintenance',
      slug: 'home-maintenance',
      description: 'General home repairs, carpentry, painting, and maintenance services.',
      icon: '🏠',
      image: '/uploads/categories/maintenance.jpg',
      requiredSkills: ['Handyman', 'Carpenter', 'Painter'],
      pricingRules: { minimum: 500, maximum: 10000, unit: 'per_job' },
      sortOrder: 8,
      isActive: true,
    },
  ]);

  console.log(`✅ Created ${categories.length} service categories`);

  console.log('👑 Creating Platform Admin account...');
  const admin = new User({
    name: 'Platform Admin',
    username: 'admin',
    email: 'admin@careconnect.in',
    password: 'Admin@123',
    mobile: '9800000001',
    role: 'admin',
    accountStatus: 'active',
    location: { address: '123 Admin Office, Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
  });
  await admin.save();

  console.log('🔧 Creating Operations Manager account...');
  const ops = new User({
    name: 'Rakesh Sharma',
    username: 'ops_manager',
    email: 'ops@careconnect.in',
    password: 'Ops@1234',
    mobile: '9800000002',
    role: 'operations',
    accountStatus: 'active',
    location: { address: '456 Ops Center, Bandra', city: 'Mumbai', state: 'Maharashtra', pincode: '400051' },
    createdBy: admin._id,
  });
  await ops.save();

  console.log('🎧 Creating Support Agent account...');
  const support = new User({
    name: 'Priya Nair',
    username: 'support_agent',
    email: 'support@careconnect.in',
    password: 'Support@123',
    mobile: '9800000003',
    role: 'support',
    accountStatus: 'active',
    location: { address: '789 Support Office, Koramangala', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
    createdBy: admin._id,
  });
  await support.save();

  console.log('\n=============================================');
  console.log('✨ CLEAN DATABASE INITIALIZATION COMPLETE!');
  console.log('=============================================');
  console.log('Zero seeded demo customers, providers, or bookings.');
  console.log('Active staff accounts:');
  console.log('  - Admin:        admin / Admin@123');
  console.log('  - Operations:   ops_manager / Ops@1234');
  console.log('  - Support:      support_agent / Support@123');
  console.log('=============================================\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
