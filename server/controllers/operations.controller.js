const Booking = require('../models/Booking');
const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const Dispute = require('../models/Dispute');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.util');
const { getPagination } = require('../utils/helpers');
const { notifications } = require('../services/notification.service');
const { createAuditLog } = require('../utils/audit.util');

// @desc    Get all active bookings (operations)
// @route   GET /api/operations/bookings
// @access  Operations, Admin
const getActiveBookings = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ['pending_acceptance', 'accepted', 'on_the_way', 'in_progress', 'evidence_uploaded'] };
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('customerId', 'name mobile location')
        .populate('providerId', 'name mobile')
        .populate('category', 'name icon')
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    return sendPaginated(res, bookings, total, page, limit, 'Active bookings fetched.');
  } catch (err) {
    return sendError(res, 'Failed to fetch bookings.', 500);
  }
};

// @desc    Assign/reassign provider (operations)
// @route   PUT /api/operations/bookings/:id/assign
// @access  Operations, Admin
const assignProvider = async (req, res) => {
  try {
    const { providerId, note } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found.', 404);

    // Check new provider is approved
    const profile = await ProviderProfile.findOne({ userId: providerId, verificationStatus: 'approved' });
    if (!profile) return sendError(res, 'Provider not found or not approved.', 404);

    const oldProviderId = booking.providerId;
    booking.providerId = providerId;
    booking.assignedBy = req.user._id;
    booking.operationsNotes = note || booking.operationsNotes;
    booking.statusHistory.push({
      status: booking.status,
      changedBy: req.user._id,
      note: note || `Provider reassigned by ${req.user.name}`,
    });

    await booking.save();

    // Notify both providers and customer
    const provider = await User.findById(providerId).select('name');
    if (oldProviderId.toString() !== providerId) {
      await notifications.cancellationUpdate(oldProviderId, booking._id, 'You have been reassigned from this booking.');
    }
    await notifications.bookingConfirmed(booking.customerId, booking._id);

    await createAuditLog({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'REASSIGN_PROVIDER',
      resource: 'Booking',
      resourceId: booking._id,
      metadata: { oldProviderId, newProviderId: providerId },
      req,
    });

    return sendSuccess(res, { booking }, 'Provider assigned successfully.');
  } catch (err) {
    return sendError(res, 'Failed to assign provider.', 500);
  }
};

// @desc    Handle cancellation request (operations)
// @route   PUT /api/operations/bookings/:id/cancellation
// @access  Operations, Support
const handleCancellation = async (req, res) => {
  try {
    const { decision, reason, refundAmount } = req.body; // decision: 'approved' or 'rejected'
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found.', 404);

    if (booking.cancellation.status !== 'requested') {
      return sendError(res, 'No cancellation request found for this booking.', 400);
    }

    booking.cancellation.status = decision;
    booking.cancellation.processedBy = req.user._id;
    booking.cancellation.processedAt = new Date();
    if (refundAmount) booking.cancellation.refundAmount = refundAmount;

    if (decision === 'approved') {
      booking.status = 'cancelled';
      booking.statusHistory.push({ status: 'cancelled', changedBy: req.user._id, note: reason });
    }

    await booking.save();

    // Notify both parties
    const msg = decision === 'approved'
      ? `Your cancellation request has been approved. ${refundAmount ? `Refund of ₹${refundAmount} will be processed.` : ''}`
      : `Your cancellation request was rejected. Reason: ${reason || 'Please contact support.'}`;

    await notifications.cancellationUpdate(booking.customerId, booking._id, msg);
    await notifications.cancellationUpdate(booking.providerId, booking._id, `Booking cancellation ${decision}.`);

    await createAuditLog({
      actor: req.user._id,
      actorRole: req.user.role,
      action: `CANCELLATION_${decision.toUpperCase()}`,
      resource: 'Booking',
      resourceId: booking._id,
      metadata: { decision, refundAmount },
      req,
    });

    return sendSuccess(res, { booking }, `Cancellation ${decision}.`);
  } catch (err) {
    return sendError(res, 'Failed to handle cancellation.', 500);
  }
};

// @desc    Get cancellation requests
// @route   GET /api/operations/cancellations
// @access  Operations, Admin
const getCancellationRequests = async (req, res) => {
  try {
    const bookings = await Booking.find({ 'cancellation.status': 'requested' })
      .populate('customerId', 'name mobile')
      .populate('providerId', 'name mobile')
      .populate('category', 'name')
      .sort({ 'cancellation.requestedAt': -1 });

    return sendSuccess(res, { bookings }, 'Cancellation requests fetched.');
  } catch (err) {
    return sendError(res, 'Failed to fetch cancellation requests.', 500);
  }
};

module.exports = { getActiveBookings, assignProvider, handleCancellation, getCancellationRequests };
