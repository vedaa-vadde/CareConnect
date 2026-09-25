const { generateAssistantResponse } = require('../ai/classifier');
const { classifyServiceRequest } = require('../ai/classifier');
const { findMatchingProviders } = require('../ai/matcher');
const ServiceRequest = require('../models/ServiceRequest');
const { sendSuccess, sendError } = require('../utils/response.util');

// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
// @access  Customer
const chat = async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return sendError(res, 'Message is required.', 400);

    const response = await generateAssistantResponse(message, context || {});
    return sendSuccess(res, response, 'AI response generated.');
  } catch (err) {
    return sendError(res, 'AI assistant failed. Please try again.', 500);
  }
};

// @desc    Classify a request description
// @route   POST /api/ai/classify
// @access  Customer
const classify = async (req, res) => {
  try {
    const { description, categoryName } = req.body;
    if (!description) return sendError(res, 'Description is required.', 400);

    const result = await classifyServiceRequest(description, categoryName);
    return sendSuccess(res, result, 'Classification complete.');
  } catch (err) {
    return sendError(res, 'Classification failed.', 500);
  }
};

// @desc    Get provider recommendations for a service request
// @route   GET /api/ai/match/:requestId
// @access  Customer
const matchProviders = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.requestId);
    if (!request) return sendError(res, 'Service request not found.', 404);

    if (request.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    const providers = await findMatchingProviders(request, 10);
    return sendSuccess(res, { providers }, 'Provider recommendations ready.');
  } catch (err) {
    return sendError(res, 'Provider matching failed.', 500);
  }
};

module.exports = { chat, classify, matchProviders };
