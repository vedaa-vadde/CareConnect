const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { sendError } = require('./utils/response.util');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Rate limit
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/providers', require('./routes/provider.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/service-requests', require('./routes/serviceRequest.routes'));
app.use('/api/quotes', require('./routes/quote.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/availability', require('./routes/availability.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/disputes', require('./routes/dispute.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/operations', require('./routes/operations.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/ai', require('./routes/ai.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CareConnect API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 404 handler
app.use((req, res) => {
  return sendError(res, `Route ${req.method} ${req.path} not found.`, 404);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return sendError(res, 'Validation failed.', 422, errors);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, `${field} already exists.`, 409);
  }

  if (err.name === 'CastError') {
    return sendError(res, 'Invalid ID format.', 400);
  }

  return sendError(res, err.message || 'An unexpected error occurred.', err.status || 500);
});

module.exports = app;
