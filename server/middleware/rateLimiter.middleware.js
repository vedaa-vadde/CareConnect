const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response.util');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return sendError(res, message || 'Too many requests. Please try again later.', 429);
    },
  });

// Auth endpoints: strict limiting
const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  20,
  'Too many login attempts. Please try again in 15 minutes.'
);

// General API: moderate limiting
const apiLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  200,
  'Too many requests from this IP. Please try again in 15 minutes.'
);

// AI endpoints: stricter
const aiLimiter = createLimiter(
  60 * 1000, // 1 minute
  10,
  'Too many AI requests. Please slow down.'
);

// Upload endpoints
const uploadLimiter = createLimiter(
  60 * 1000, // 1 minute
  20,
  'Too many upload requests. Please try again in a minute.'
);

module.exports = { authLimiter, apiLimiter, aiLimiter, uploadLimiter };
