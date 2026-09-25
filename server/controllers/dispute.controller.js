const Dispute = require('../models/Dispute');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.util');
const { getPagination } = require('../utils/helpers');
const { notifications } = require('../services/notification.service');
const { createAuditLog } = require('../utils/audit.util');

// @desc    Raise a dispute (customer/provider)
// @route   POST /api/disputes
// @access  Customer, Provider
const raiseDispute = async (req, res) => {
  try {
    const { bookingId, reason, description } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return sendError(res, 'Booking not found.', 404);

    const isCustomer = booking.customerId.toString() === req.user._id.toString();
    const isProvider = booking.providerId.toString() === req.user._id.toString();

    if (!isCustomer && !isProvider) return sendError(res, 'Access denied.', 403);

    // Only allow disputes after certain stages
    if (!['in_progress', 'evidence_uploaded', 'completed_by_provider', 'confirmed_by_customer'].includes(booking.status)) {
      return sendError(res, 'Disputes can only be raised for active or completed bookings.', 400);
    }

    // Handle evidence uploads
    const evidence = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        evidence.push({ url: `/uploads/disputes/${file.filename}`, filename: file.originalname });
      }
    }

    const dispute = new Dispute({
      bookingId,
      raisedBy: req.user._id,
      raisedByRole: isCustomer ? 'customer' : 'provider',
      reason,
      description,
      evidence,
      timeline: [{ action: 'DISPUTE_RAISED', by: req.user._id, note: 'Dispute raised.' }],
    });

    await dispute.save();

    // Update booking status
    booking.status = 'disputed';
    booking.statusHistory.push({ status: 'disputed', changedBy: req.user._id });
    await booking.save();

    // Notify support
    const supportAgents = await User.find({ role: 'support', accountStatus: 'active' }).select('_id');
    for (const agent of supportAgents) {
      await notifications.disputeUpdate(agent._id, dispute._id, `New dispute raised for booking #${bookingId.toString().slice(-6)}.`);
    }

    // Notify other party
    const otherPartyId = isCustomer ? booking.providerId : booking.customerId;
    await notifications.disputeUpdate(otherPartyId, dispute._id, 'A dispute has been raised for your booking.');

    return sendSuccess(res, { dispute }, 'Dispute raised. Our support team will review it.', 201);
  } catch (err) {
    return sendError(res, 'Failed to raise dispute.', 500);
  }
};

// @desc    Get disputes (support/admin: all, user: own)
// @route   GET /api/disputes
// @access  Support, Admin, Operations, Customer (own), Provider (own)
const getDisputes = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, priority } = req.query;

    const filter = {};

    if (req.user.role === 'customer') filter.raisedBy = req.user._id;
    else if (req.user.role === 'provider') filter.raisedBy = req.user._id;

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const [disputes, total] = await Promise.all([
      Dispute.find(filter)
        .populate('bookingId', 'customerId providerId scheduledDate agreedAmount')
        .populate('raisedBy', 'name role')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Dispute.countDocuments(filter),
    ]);

    return sendPaginated(res, disputes, total, page, limit, 'Disputes fetched.');
  } catch (err) {
    return sendError(res, 'Failed to fetch disputes.', 500);
  }
};

// @desc    Get dispute by ID
// @route   GET /api/disputes/:id
// @access  Involved parties, Support, Admin, Operations
const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('bookingId')
      .populate('raisedBy', 'name role profileImage')
      .populate('assignedTo', 'name role')
      .populate('resolution.resolvedBy', 'name');

    if (!dispute) return sendError(res, 'Dispute not found.', 404);

    // Access check for non-staff
    if (['customer', 'provider'].includes(req.user.role)) {
      const booking = await Booking.findById(dispute.bookingId);
      if (!booking) return sendError(res, 'Access denied.', 403);
      const hasAccess =
        booking.customerId.toString() === req.user._id.toString() ||
        booking.providerId.toString() === req.user._id.toString();
      if (!hasAccess) return sendError(res, 'Access denied.', 403);
    }

    return sendSuccess(res, { dispute }, 'Dispute fetched.');
  } catch (err) {
    return sendError(res, 'Failed to fetch dispute.', 500);
  }
};

// @desc    Update dispute (support/admin)
// @route   PUT /api/disputes/:id
// @access  Support, Admin, Operations
const updateDispute = async (req, res) => {
  try {
    const { status, priority, assignedTo, resolutionDecision, resolutionNotes, refundApproved, refundAmount } = req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return sendError(res, 'Dispute not found.', 404);

    if (status) dispute.status = status;
    if (priority) dispute.priority = priority;
    if (assignedTo) dispute.assignedTo = assignedTo;

    if (resolutionDecision) {
      dispute.resolution = {
        decision: resolutionDecision,
        notes: resolutionNotes,
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
        refundApproved: refundApproved || false,
        refundAmount: refundAmount || 0,
      };
      dispute.status = 'resolved';
    }

    dispute.timeline.push({
      action: `STATUS_UPDATE_${(status || 'resolved').toUpperCase()}`,
      by: req.user._id,
      note: resolutionNotes || `Updated by ${req.user.name}`,
    });

    await dispute.save();

    // Notify involved parties
    const booking = await Booking.findById(dispute.bookingId);
    if (booking) {
      await notifications.disputeUpdate(booking.customerId, dispute._id, `Your dispute has been updated: ${status || 'resolved'}.`);
      await notifications.disputeUpdate(booking.providerId, dispute._id, `Dispute for your booking has been updated.`);
    }

    await createAuditLog({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'UPDATE_DISPUTE',
      resource: 'Dispute',
      resourceId: dispute._id,
      metadata: { status, refundApproved },
      req,
    });

    return sendSuccess(res, { dispute }, 'Dispute updated.');
  } catch (err) {
    return sendError(res, 'Failed to update dispute.', 500);
  }
};

// @desc    Provider responds to dispute
// @route   PUT /api/disputes/:id/respond
// @access  Provider
const respondToDispute = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return sendError(res, 'Dispute not found.', 404);

    const booking = await Booking.findById(dispute.bookingId);
    if (booking.providerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    dispute.providerResponse = {
      text: req.body.text,
      respondedAt: new Date(),
    };

    if (req.files && req.files.length > 0) {
      dispute.providerResponse.evidence = req.files.map((f) => ({
        url: `/uploads/disputes/${f.filename}`,
        filename: f.originalname,
      }));
    }

    dispute.timeline.push({ action: 'PROVIDER_RESPONDED', by: req.user._id });

    await dispute.save();

    return sendSuccess(res, { dispute }, 'Response submitted.');
  } catch (err) {
    return sendError(res, 'Failed to respond to dispute.', 500);
  }
};

module.exports = { raiseDispute, getDisputes, getDisputeById, updateDispute, respondToDispute };
