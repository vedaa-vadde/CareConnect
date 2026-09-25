const Quote = require('../models/Quote');
const ServiceRequest = require('../models/ServiceRequest');
const ProviderProfile = require('../models/ProviderProfile');
const ServiceCategory = require('../models/ServiceCategory');
const { sendSuccess, sendError } = require('../utils/response.util');
const { notifications } = require('../services/notification.service');
const { scoreProvider } = require('../ai/matcher');

// @desc    Submit a quote (provider)
// @route   POST /api/quotes
// @access  Provider (approved)
const submitQuote = async (req, res) => {
  try {
    const { serviceRequestId, amount, estimatedDuration, message, proposedDate, proposedTime } = req.body;

    let parsedDuration = estimatedDuration;
    if (typeof estimatedDuration === 'string') {
      try { parsedDuration = JSON.parse(estimatedDuration); } catch { parsedDuration = { value: 2, unit: 'hours' }; }
    }

    // Verify service request exists and is open
    const request = await ServiceRequest.findById(serviceRequestId);
    if (!request) return sendError(res, 'Service request not found.', 404);

    if (!['pending', 'ai_classified', 'finding_providers', 'quotes_received'].includes(request.status)) {
      return sendError(res, 'This service request is no longer accepting quotes.', 400);
    }

    // Check provider hasn't already submitted a quote
    const existingQuote = await Quote.findOne({ serviceRequestId, providerId: req.user._id });
    if (existingQuote) {
      return sendError(res, 'You have already submitted a quote for this request.', 409);
    }

    // Validate amount against pricing rules
    const category = await ServiceCategory.findById(request.category);
    if (category && category.pricingRules.minimum > 0 && amount < category.pricingRules.minimum) {
      return sendError(
        res,
        `Amount must be at least ₹${category.pricingRules.minimum} for this category.`,
        400
      );
    }
    if (category && category.pricingRules.maximum > 0 && amount > category.pricingRules.maximum) {
      return sendError(
        res,
        `Amount cannot exceed ₹${category.pricingRules.maximum} for this category.`,
        400
      );
    }

    // Get provider profile for match scoring
    const profile = await ProviderProfile.findOne({ userId: req.user._id });
    const { score, reasons } = scoreProvider(profile, request, request.location?.city);

    const quote = new Quote({
      serviceRequestId,
      providerId: req.user._id,
      providerProfile: profile._id,
      amount,
      estimatedDuration: parsedDuration,
      message,
      proposedDate: new Date(proposedDate),
      proposedTime,
      matchScore: score,
      matchReasons: reasons,
    });

    await quote.save();

    // Update request status
    await ServiceRequest.findByIdAndUpdate(serviceRequestId, { status: 'quotes_received' });

    // Notify customer
    await notifications.quoteReceived(request.customerId, serviceRequestId, req.user.name);

    return sendSuccess(res, { quote }, 'Quote submitted successfully.', 201);
  } catch (err) {
    console.error('Submit quote error:', err);
    return sendError(res, 'Failed to submit quote.', 500);
  }
};

// @desc    Get quotes for a service request (customer)
// @route   GET /api/quotes/request/:requestId
// @access  Customer (own request)
const getQuotesForRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.requestId);
    if (!request) return sendError(res, 'Service request not found.', 404);

    if (req.user.role === 'customer' && request.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    const quotes = await Quote.find({ serviceRequestId: req.params.requestId })
      .populate('providerId', 'name username profileImage')
      .populate({
        path: 'providerProfile',
        select: 'rating experience skills totalCompletedJobs serviceAreas bio verificationStatus categories',
        populate: { path: 'categories', select: 'name icon' },
      })
      .sort({ matchScore: -1, amount: 1 });

    return sendSuccess(res, { quotes }, 'Quotes fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch quotes.', 500);
  }
};

// @desc    Get provider's submitted quotes
// @route   GET /api/quotes/my-quotes
// @access  Provider
const getMyQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find({ providerId: req.user._id })
      .populate({
        path: 'serviceRequestId',
        select: 'problemDescription location preferredDate preferredTime status category',
        populate: { path: 'category', select: 'name icon' },
      })
      .sort({ createdAt: -1 });

    return sendSuccess(res, { quotes }, 'Your quotes fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch quotes.', 500);
  }
};

// @desc    Update quote (provider)
// @route   PUT /api/quotes/:id
// @access  Provider (own quote)
const updateQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return sendError(res, 'Quote not found.', 404);

    if (quote.providerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    if (quote.status !== 'pending') {
      return sendError(res, 'Cannot update a quote that is not pending.', 400);
    }

    const { amount, message, proposedDate, proposedTime, estimatedDuration } = req.body;

    let parsedDuration = estimatedDuration;
    if (typeof estimatedDuration === 'string') {
      try { parsedDuration = JSON.parse(estimatedDuration); } catch { parsedDuration = undefined; }
    }

    if (amount !== undefined) quote.amount = amount;
    if (message !== undefined) quote.message = message;
    if (proposedDate) quote.proposedDate = new Date(proposedDate);
    if (proposedTime) quote.proposedTime = proposedTime;
    if (parsedDuration) quote.estimatedDuration = parsedDuration;

    await quote.save();
    return sendSuccess(res, { quote }, 'Quote updated successfully.');
  } catch (err) {
    return sendError(res, 'Failed to update quote.', 500);
  }
};

// @desc    Withdraw quote (provider)
// @route   DELETE /api/quotes/:id
// @access  Provider (own quote)
const withdrawQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return sendError(res, 'Quote not found.', 404);

    if (quote.providerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    if (quote.status !== 'pending') {
      return sendError(res, 'Cannot withdraw an accepted or rejected quote.', 400);
    }

    quote.status = 'withdrawn';
    await quote.save();

    return sendSuccess(res, null, 'Quote withdrawn successfully.');
  } catch (err) {
    return sendError(res, 'Failed to withdraw quote.', 500);
  }
};

// @desc    Generate instant quote from matched provider (customer)
// @route   POST /api/quotes/generate-instant
// @access  Customer
const generateInstantQuote = async (req, res) => {
  try {
    const { serviceRequestId, providerId } = req.body;
    const request = await ServiceRequest.findById(serviceRequestId);
    if (!request) return sendError(res, 'Service request not found.', 404);
    if (request.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    const profile = await ProviderProfile.findOne({ userId: providerId, verificationStatus: 'approved' });
    if (!profile) return sendError(res, 'Provider is not available.', 404);

    const existingQuote = await Quote.findOne({ serviceRequestId, providerId });
    if (existingQuote) {
      return sendSuccess(res, { quote: existingQuote }, 'Quote already exists.');
    }

    const category = await ServiceCategory.findById(request.category);
    const minPrice = category?.pricingRules?.minimum || 600;
    const maxPrice = category?.pricingRules?.maximum || 2500;
    const avgPrice = Math.round((minPrice + maxPrice) / 2);

    const { score, reasons } = scoreProvider(profile, request, request.location?.city);

    const quote = new Quote({
      serviceRequestId,
      providerId,
      providerProfile: profile._id,
      amount: avgPrice,
      estimatedDuration: { value: 2, unit: 'hours' },
      message: `Verified technician ready to assist you for ${category?.name || 'repair'}.`,
      proposedDate: request.preferredDate,
      proposedTime: request.preferredTime || '10:00 AM',
      aiMatchScore: score,
      aiMatchReasons: reasons,
      status: 'pending',
    });

    await quote.save();

    await ServiceRequest.findByIdAndUpdate(serviceRequestId, { status: 'quotes_received' });
    await notifications.newQuote(request.customerId, quote._id);

    return sendSuccess(res, { quote }, 'Instant quote generated successfully!', 201);
  } catch (err) {
    console.error('generateInstantQuote error:', err);
    return sendError(res, 'Failed to generate instant quote.', 500);
  }
};

module.exports = { submitQuote, getQuotesForRequest, getMyQuotes, updateQuote, withdrawQuote, generateInstantQuote };
