const { sendError } = require('../utils/response.util');

// Allow only specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Not authenticated.', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`,
        403
      );
    }
    next();
  };
};

// Check resource ownership (customer can only access their own resources)
const checkOwnership = (Model, idField = 'id') => {
  return async (req, res, next) => {
    try {
      const doc = await Model.findById(req.params[idField]);
      if (!doc) {
        return sendError(res, 'Resource not found.', 404);
      }

      const isOwner =
        (doc.customerId && doc.customerId.toString() === req.user._id.toString()) ||
        (doc.userId && doc.userId.toString() === req.user._id.toString()) ||
        (doc.providerId && doc.providerId.toString() === req.user._id.toString()) ||
        (doc.raisedBy && doc.raisedBy.toString() === req.user._id.toString());

      const isAdminLike = ['admin', 'operations', 'support'].includes(req.user.role);

      if (!isOwner && !isAdminLike) {
        return sendError(res, 'Access denied. You do not have permission to access this resource.', 403);
      }

      req.resource = doc;
      next();
    } catch (err) {
      return sendError(res, 'Error checking resource access.', 500);
    }
  };
};

module.exports = { authorize, checkOwnership };
