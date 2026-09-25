require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Create upload directories
const fs = require('fs');
const path = require('path');
const uploadDirs = [
  'uploads/profiles',
  'uploads/documents',
  'uploads/categories',
  'uploads/evidence',
  'uploads/disputes',
  'uploads/misc',
];

uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Connect to MongoDB and start server
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     🏠 CareConnect API Server          ║
║     Running on port: ${PORT}              ║
║     Environment: ${process.env.NODE_ENV || 'development'}         ║
╚════════════════════════════════════════╝
    `);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err.message);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err.message);
    process.exit(1);
  });
};

startServer();
