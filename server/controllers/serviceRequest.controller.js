const ServiceRequest = require('../models/ServiceRequest');
const ServiceCategory = require('../models/ServiceCategory');
const Quote = require('../models/Quote');
const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.util');
const { getPagination } = require('../utils/helpers');
const { classifyServiceRequest } = require('../ai/classifier');
const { findMatchingProviders } = require('../ai/matcher');
const { notifications } = require('../services/notification.service');

// @desc    Create service request (customer)
// @route   POST /api/service-requests
// @access  Customer
const createServiceRequest = async (req, res) => {
  try {
    const { categoryId, problemDescription, location, preferredDate, preferredTime, additionalInfo } = req.body;

    // Parse location if string
    let parsedLocation = location;
    if (typeof location === 'string') {
      try { parsedLocation = JSON.parse(location); } catch { parsedLocation = { address: location }; }
    }

    // Validate category
    const category = await ServiceCategory.findById(categoryId);
    if (!category || !category.isActive) {
      return sendError(res, 'Invalid or inactive service category.', 400);
    }

    // Handle image uploads
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        images.push({ url: `/uploads/misc/${file.filename}`, filename: file.originalname });
      }
    }

    const serviceRequest = new ServiceRequest({
      customerId: req.user._id,
      category: categoryId,
      problemDescription,
      images,
      location: parsedLocation,
      preferredDate: new Date(preferredDate),
      preferredTime,
      additionalInfo,
      status: 'pending',
    });

    await serviceRequest.save();

    // Run AI classification asynchronously
    setImmediate(async () => {
      try {
        const classification = await classifyServiceRequest(problemDescription, category.name);
        await ServiceRequest.findByIdAndUpdate(serviceRequest._id, {
          aiClassification: { ...classification, classifiedAt: new Date() },
          status: 'ai_classified',
        });

        // Notify matching providers
        const updatedRequest = await ServiceRequest.findById(serviceRequest._id);
        const providers = await findMatchingProviders(updatedRequest, 20);

        if (providers.length > 0) {
          for (const provider of providers) {
            await notifications.newServiceRequest(provider.providerId, serviceRequest._id);
          }
          await ServiceRequest.findByIdAndUpdate(serviceRequest._id, { status: 'finding_providers' });
        }
      } catch (err) {
        console.error('AI classification error:', err.message);
      }
    });

    return sendSuccess(res, { serviceRequest }, 'Service request created successfully!', 201);
  } catch (err) {
    console.error('Create service request error:', err);
    return sendError(res, 'Failed to create service request. Please try again.', 500);
  }
};

// @desc    Get service requests (customer: own, admin: all)
// @route   GET /api/service-requests
// @access  Customer, Admin, Operations
const getServiceRequests = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, category } = req.query;

    const filter = {};

    // Customers see only their own requests
    if (req.user.role === 'customer') {
      filter.customerId = req.user._id;
    } else if (req.user.role === 'provider') {
      // Providers see requests matching their skills/category
      const profile = await ProviderProfile.findOne({ userId: req.user._id });
      if (profile && profile.categories && profile.categories.length > 0) {
        filter.category = { $in: profile.categories };
      }
      filter.status = { $in: ['pending', 'finding_providers', 'quotes_received', 'ai_classified'] };
    }

    if (status) {
      const statusArr = status.split(',').map((s) => s.trim()).filter(Boolean);
      filter.status = statusArr.length === 1 ? statusArr[0] : { $in: statusArr };
    }
    if (category) filter.category = category;

    const [requests, total] = await Promise.all([
      ServiceRequest.find(filter)
        .populate('customerId', 'name username profileImage mobile location')
        .populate('category', 'name icon image slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ServiceRequest.countDocuments(filter),
    ]);

    return sendPaginated(res, requests, total, page, limit, 'Service requests fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch service requests.', 500);
  }
};

// @desc    Get service request by ID
// @route   GET /api/service-requests/:id
// @access  Customer (own), Provider, Admin
const getServiceRequestById = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customerId', 'name username profileImage mobile location')
      .populate('category', 'name icon image description pricingRules');

    if (!request) return sendError(res, 'Service request not found.', 404);

    // Access control
    if (req.user.role === 'customer' && request.customerId._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    // Fetch quotes if available
    const quotes = await Quote.find({ serviceRequestId: request._id })
      .populate('providerId', 'name username profileImage')
      .populate('providerProfile', 'rating experience skills totalCompletedJobs serviceAreas');

    // Fetch recommended providers for open requests
    let recommendedProviders = [];
    if (['pending', 'finding_providers', 'ai_classified', 'quotes_received'].includes(request.status)) {
      recommendedProviders = await findMatchingProviders(request, 8);
    }

    return sendSuccess(res, { request, serviceRequest: request, quotes, recommendedProviders }, 'Service request fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch service request.', 500);
  }
};

// @desc    Cancel service request (customer)
// @route   PUT /api/service-requests/:id/cancel
// @access  Customer (own)
const cancelServiceRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return sendError(res, 'Service request not found.', 404);

    if (request.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    if (['booked', 'cancelled'].includes(request.status)) {
      return sendError(res, 'Cannot cancel a request that is already booked or cancelled.', 400);
    }

    request.status = 'cancelled';
    request.cancellationReason = req.body.reason || 'Cancelled by customer';
    request.cancelledAt = new Date();
    request.cancelledBy = req.user._id;

    await request.save();

    // Cancel pending quotes
    await Quote.updateMany(
      { serviceRequestId: request._id, status: 'pending' },
      { status: 'expired' }
    );

    return sendSuccess(res, { request }, 'Service request cancelled.');
  } catch (err) {
    return sendError(res, 'Failed to cancel service request.', 500);
  }
};

// @desc    Get AI classification for a request
// @route   POST /api/service-requests/classify
// @access  Customer
const classifyRequest = async (req, res) => {
  try {
    const { description, categoryName } = req.body;
    if (!description) return sendError(res, 'Description is required.', 400);

    const result = await classifyServiceRequest(description, categoryName);
    return sendSuccess(res, { classification: result }, 'Classification complete.');
  } catch (err) {
    return sendError(res, 'AI classification failed.', 500);
  }
};

module.exports = {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  cancelServiceRequest,
  classifyRequest,
};
