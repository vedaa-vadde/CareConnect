const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    // Use Google DNS for MongoDB Atlas SRV resolution
    dns.setServers(['8.8.8.8', '1.1.1.1']);

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;