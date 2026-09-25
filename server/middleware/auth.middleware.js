const { verifyToken } = require('../utils/jwt.util');
const { sendError } = require('../utils/response.util');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, 'Access denied. Please login to continue.', 401);
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Session expired. Please login again.', 401);
      }
      return sendError(res, 'Invalid token. Please login again.', 401);
    }

    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user) {
      return sendError(res, 'User not found. Please login again.', 401);
    }

    if (user.accountStatus !== 'active') {
      return sendError(
        res,
        `Your account is ${user.accountStatus}. Please contact support.`,
        403
      );
    }

    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
      return sendError(res, 'Password was recently changed. Please login again.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return sendError(res, 'Authentication failed. Please try again.', 500);
  }
};

// Middleware for provider: must be approved
const requireApprovedProvider = async (req, res, next) => {
  if (req.user.role !== 'provider') {
    return sendError(res, 'This action requires a provider account.', 403);
  }

  const ProviderProfile = require('../models/ProviderProfile');
  const profile = await ProviderProfile.findOne({ userId: req.user._id });

  if (!profile) {
    return sendError(res, 'Provider profile not found.', 404);
  }

  if (profile.verificationStatus !== 'approved') {
    return sendError(
      res,
      `Your provider account is ${profile.verificationStatus}. You cannot access provider features until approved by admin.`,
      403
    );
  }

  req.providerProfile = profile;
  next();
};

module.exports = { protect, requireApprovedProvider };
