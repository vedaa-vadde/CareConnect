require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
const ServiceCategory = require('../models/ServiceCategory');

// Ensure DNS resolution succeeds for Atlas SRV on Windows
dns.setServers(['8.8.8.8', '1.1.1.1']);

const categoriesData = [
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
];

async function seedCategoriesOnly() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  console.log('Connecting to MongoDB...');
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  const dbName = conn.connection.name;
  console.log(`Connected to database: ${dbName}`);
  console.log(`Target collection: ${ServiceCategory.collection.name}`);

  const countBefore = await ServiceCategory.countDocuments();
  console.log(`ServiceCategory count before: ${countBefore}`);

  let inserted = 0;
  let alreadyExisting = 0;

  for (const cat of categoriesData) {
    const existing = await ServiceCategory.findOne({ slug: cat.slug });
    if (existing) {
      console.log(`  - Category already exists: "${cat.name}" (slug: ${cat.slug})`);
      alreadyExisting++;
    } else {
      await ServiceCategory.create(cat);
      console.log(`  + Inserted category: "${cat.name}" (slug: ${cat.slug})`);
      inserted++;
    }
  }

  const countAfter = await ServiceCategory.countDocuments();
  console.log('\n--- Summary ---');
  console.log(`Database name used: ${dbName}`);
  console.log(`Documents before: ${countBefore}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Already existing: ${alreadyExisting}`);
  console.log(`Final count: ${countAfter}`);

  await mongoose.disconnect();
  console.log('Disconnected cleanly from MongoDB.');
}

seedCategoriesOnly().catch((err) => {
  console.error('Error seeding categories:', err);
  process.exit(1);
});
