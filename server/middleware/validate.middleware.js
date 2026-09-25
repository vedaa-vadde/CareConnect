const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response.util');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return sendError(res, 'Validation failed. Please check your input.', 422, formattedErrors);
  }
  next();
};

module.exports = { validate };
