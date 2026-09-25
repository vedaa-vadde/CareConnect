const Booking = require('../models/Booking');
const Quote = require('../models/Quote');
const ServiceRequest = require('../models/ServiceRequest');
const ProviderProfile = require('../models/ProviderProfile');
const JobEvidence = require('../models/JobEvidence');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.util');
const { getPagination } = require('../utils/helpers');
const { notifications } = require('../services/notification.service');
const { checkProviderAvailability, markSlotBooked, releaseSlot } = require('../services/availability.service');
const { generateInvoice } = require('../services/invoice.service');
const { createAuditLog } = require('../utils/audit.util');

// @desc    Create booking (customer accepts a quote)
// @route   POST /api/bookings
// @access  Customer
const createBooking = async (req, res) => {
  try {
    const { quoteId } = req.body;

    const quote = await Quote.findById(quoteId).populate('serviceRequestId');
    if (!quote) return sendError(res, 'Quote not found.', 404);
    if (quote.status !== 'pending') return sendError(res, 'This quote is no longer available.', 400);

    const request = quote.serviceRequestId;
    if (request.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    if (request.status === 'booked') {
      return sendError(res, 'This service request has already been booked.', 400);
    }

    // Check provider availability (prevent overlapping bookings)
    const estimatedHours = quote.estimatedDuration?.value || 2;
    const endTime = addHours(quote.proposedTime, estimatedHours);

    const availabilityCheck = await checkProviderAvailability(
      quote.providerId,
      quote.proposedDate,
      quote.proposedTime,
      endTime
    );

    if (!availabilityCheck.available) {
      return sendError(res, `Provider is not available: ${availabilityCheck.reason}`, 409);
    }

    // Create booking
    const booking = new Booking({
      customerId: req.user._id,
      providerId: quote.providerId,
      serviceRequestId: request._id,
      quoteId: quote._id,
      category: request.category,
      scheduledDate: quote.proposedDate,
      scheduledTime: quote.proposedTime,
      estimatedEndTime: endTime,
      agreedAmount: quote.amount,
      status: 'pending_acceptance',
    });

    booking.statusHistory.push({
      status: 'pending_acceptance',
      changedBy: req.user._id,
      note: 'Booking created by customer.',
    });

    await booking.save();

    // Mark slot as booked
    await markSlotBooked(quote.providerId, quote.proposedDate, quote.proposedTime, endTime, booking._id);

    // Update quote and request status
    await Quote.findByIdAndUpdate(quoteId, { status: 'accepted' });
    await Quote.updateMany(
      { serviceRequestId: request._id, _id: { $ne: quoteId }, status: 'pending' },
      { status: 'expired' }
    );
    await ServiceRequest.findByIdAndUpdate(request._id, { status: 'booked' });

    // Notify provider
    await notifications.quoteAccepted(quote.providerId, booking._id);
    await notifications.bookingConfirmed(req.user._id, booking._id);

    return sendSuccess(res, { booking }, 'Booking created successfully!', 201);
  } catch (err) {
    console.error('Create booking error:', err);
    return sendError(res, 'Failed to create booking. Please try again.', 500);
  }
};

// @desc    Get bookings
// @route   GET /api/bookings
// @access  Customer (own), Provider (own), Admin/Ops (all)
const getBookings = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status } = req.query;

    const filter = {};
    if (req.user.role === 'customer') filter.customerId = req.user._id;
    else if (req.user.role === 'provider') filter.providerId = req.user._id;

    if (status) filter.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('customerId', 'name username profileImage mobile location')
        .populate('providerId', 'name username profileImage mobile')
        .populate('serviceRequestId', 'problemDescription location preferredDate preferredTime images category')
        .populate('category', 'name icon')
        .populate('quoteId', 'amount estimatedDuration message')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    return sendPaginated(res, bookings, total, page, limit, 'Bookings fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch bookings.', 500);
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Customer (own), Provider (own), Admin/Ops
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name username profileImage mobile location')
      .populate('providerId', 'name username profileImage mobile')
      .populate('serviceRequestId', 'problemDescription location preferredDate preferredTime images category')
      .populate('category', 'name icon description')
      .populate('quoteId', 'amount estimatedDuration message proposedDate proposedTime');

    if (!booking) return sendError(res, 'Booking not found.', 404);

    // Access control
    if (
      req.user.role === 'customer' && booking.customerId._id.toString() !== req.user._id.toString() ||
      req.user.role === 'provider' && booking.providerId._id.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'Access denied.', 403);
    }

    // Fetch evidence and invoice
    const [evidence, invoice] = await Promise.all([
      JobEvidence.findOne({ bookingId: booking._id }),
      require('../models/Invoice').findOne({ bookingId: booking._id }),
    ]);

    return sendSuccess(res, { booking, evidence, invoice }, 'Booking fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch booking.', 500);
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Provider, Operations, Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found.', 404);

    // Provider can only update their own bookings
    if (req.user.role === 'provider' && booking.providerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    // Validate status transitions
    const allowedTransitions = {
      pending_acceptance: ['accepted', 'rejected_by_provider'],
      accepted: ['on_the_way', 'cancelled'],
      on_the_way: ['in_progress', 'cancelled'],
      in_progress: ['evidence_uploaded'],
      evidence_uploaded: ['completed_by_provider'],
      completed_by_provider: ['confirmed_by_customer', 'disputed'],
    };

    const allowed = allowedTransitions[booking.status];
    if (!allowed || !allowed.includes(status)) {
      return sendError(res, `Cannot transition from "${booking.status}" to "${status}".`, 400);
    }

    booking.status = status;
    booking.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: note || '',
    });

    if (status === 'completed_by_provider') {
      booking.completionConfirmedAt = new Date();
    }

    await booking.save();

    // Notifications based on status
    if (status === 'on_the_way') {
      const provider = await require('../models/User').findById(booking.providerId).select('name');
      await notifications.providerOnTheWay(booking.customerId, booking._id, provider?.name || 'Provider');
    } else if (status === 'in_progress') {
      await notifications.jobStarted(booking.customerId, booking._id);
    } else if (status === 'completed_by_provider') {
      await notifications.jobCompleted(booking.customerId, booking._id);
      // Generate invoice
      try {
        await generateInvoice(booking._id);
      } catch (invErr) {
        console.error('Invoice generation error:', invErr.message);
      }
    }

    // Release slot if cancelled or rejected
    if (['cancelled', 'rejected_by_provider'].includes(status)) {
      await releaseSlot(booking.providerId, booking._id);
    }

    return sendSuccess(res, { booking }, `Booking status updated to "${status}".`);
  } catch (err) {
    console.error('Update booking status error:', err);
    return sendError(res, 'Failed to update booking status.', 500);
  }
};

// @desc    Customer confirms completion
// @route   PUT /api/bookings/:id/confirm
// @access  Customer
const confirmCompletion = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found.', 404);

    if (booking.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    if (booking.status !== 'completed_by_provider') {
      return sendError(res, 'Job has not been marked as completed by the provider yet.', 400);
    }

    booking.status = 'confirmed_by_customer';
    booking.statusHistory.push({
      status: 'confirmed_by_customer',
      changedBy: req.user._id,
      note: 'Customer confirmed completion.',
    });

    await booking.save();

    // Update provider earnings and completed jobs
    const invoice = await require('../models/Invoice').findOne({ bookingId: booking._id });
    if (invoice) {
      await ProviderProfile.findOneAndUpdate(
        { userId: booking.providerId },
        {
          $inc: {
            totalCompletedJobs: 1,
            'earnings.total': booking.agreedAmount,
          },
        }
      );
    }

    return sendSuccess(res, { booking }, 'Service completion confirmed!');
  } catch (err) {
    return sendError(res, 'Failed to confirm completion.', 500);
  }
};

// @desc    Request cancellation (customer/provider)
// @route   POST /api/bookings/:id/cancel-request
// @access  Customer, Provider
const requestCancellation = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found.', 404);

    const isCustomer = booking.customerId.toString() === req.user._id.toString();
    const isProvider = booking.providerId.toString() === req.user._id.toString();

    if (!isCustomer && !isProvider) return sendError(res, 'Access denied.', 403);

    if (booking.cancellation.status === 'requested') {
      return sendError(res, 'Cancellation already requested.', 400);
    }

    if (['cancelled', 'confirmed_by_customer', 'disputed'].includes(booking.status)) {
      return sendError(res, 'Cannot request cancellation for this booking.', 400);
    }

    booking.cancellation = {
      requestedBy: req.user._id,
      reason,
      requestedAt: new Date(),
      status: 'requested',
    };

    await booking.save();

    // Notify operations team
    const ops = await require('../models/User').find({ role: 'operations', accountStatus: 'active' }).select('_id');
    for (const op of ops) {
      await notifications.cancellationUpdate(op._id, booking._id, `Cancellation requested for booking #${booking._id.toString().slice(-6)}.`);
    }

    return sendSuccess(res, { booking }, 'Cancellation request submitted. Our team will review it.');
  } catch (err) {
    return sendError(res, 'Failed to request cancellation.', 500);
  }
};

// @desc    Upload job evidence (provider)
// @route   POST /api/bookings/:id/evidence
// @access  Provider
const uploadEvidence = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found.', 404);

    if (booking.providerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    if (!['accepted', 'on_the_way', 'in_progress'].includes(booking.status)) {
      return sendError(res, 'Cannot upload evidence at this stage.', 400);
    }

    let evidence = await JobEvidence.findOne({ bookingId: booking._id });
    if (!evidence) {
      evidence = new JobEvidence({ bookingId: booking._id, providerId: req.user._id });
    }

    if (req.files) {
      if (req.files.beforeImages) {
        for (const file of req.files.beforeImages) {
          evidence.beforeImages.push({ url: `/uploads/evidence/${file.filename}`, filename: file.originalname });
        }
      }
      if (req.files.afterImages) {
        for (const file of req.files.afterImages) {
          evidence.afterImages.push({ url: `/uploads/evidence/${file.filename}`, filename: file.originalname });
        }
      }
    }

    if (req.body.notes) evidence.notes = req.body.notes;
    if (req.body.workSummary) evidence.workSummary = req.body.workSummary;

    await evidence.save();

    // Update booking status
    booking.status = 'evidence_uploaded';
    booking.statusHistory.push({ status: 'evidence_uploaded', changedBy: req.user._id, note: 'Evidence uploaded.' });
    await booking.save();

    return sendSuccess(res, { evidence }, 'Evidence uploaded successfully.');
  } catch (err) {
    return sendError(res, 'Failed to upload evidence.', 500);
  }
};

const addHours = (timeStr, hours) => {
  if (!timeStr) return '23:59';
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + (hours * 60);
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  confirmCompletion,
  requestCancellation,
  uploadEvidence,
};
