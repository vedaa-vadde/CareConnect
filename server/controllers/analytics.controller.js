const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const Booking = require('../models/Booking');
const ServiceRequest = require('../models/ServiceRequest');
const Dispute = require('../models/Dispute');
const Review = require('../models/Review');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.util');
const { getPagination } = require('../utils/helpers');

// @desc    Get platform analytics
// @route   GET /api/analytics
// @access  Admin, Operations
const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const [
      totalUsers,
      totalCustomers,
      totalProviders,
      activeProviders,
      pendingApplications,
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      openDisputes,
      totalRequests,
      revenueResult,
      monthlyBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'provider' }),
      ProviderProfile.countDocuments({ verificationStatus: 'approved' }),
      ProviderProfile.countDocuments({ verificationStatus: 'pending' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ['pending_acceptance', 'accepted', 'on_the_way', 'in_progress'] } }),
      Booking.countDocuments({ status: 'confirmed_by_customer' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Dispute.countDocuments({ status: { $in: ['open', 'under_review', 'escalated'] } }),
      ServiceRequest.countDocuments(),
      Invoice.aggregate([
        { $match: { status: { $in: ['generated', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        {
          $group: {
            _id: { $dayOfMonth: '$createdAt' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    return sendSuccess(res, {
      users: { total: totalUsers, customers: totalCustomers, providers: totalProviders, activeProviders },
      providers: { pending: pendingApplications, active: activeProviders },
      bookings: { total: totalBookings, active: activeBookings, completed: completedBookings, cancelled: cancelledBookings },
      disputes: { open: openDisputes },
      serviceRequests: { total: totalRequests },
      revenue: { total: totalRevenue },
      charts: { monthlyBookings },
    }, 'Analytics fetched successfully.');
  } catch (err) {
    console.error('Analytics error:', err);
    return sendError(res, 'Failed to fetch analytics.', 500);
  }
};

// @desc    Get audit logs (admin)
// @route   GET /api/audit
// @access  Admin
const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { resource, action, actor } = req.query;

    const filter = {};
    if (resource) filter.resource = resource;
    if (action) filter.action = action;
    if (actor) filter.actor = actor;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'name username role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    return sendPaginated(res, logs, total, page, limit, 'Audit logs fetched.');
  } catch (err) {
    return sendError(res, 'Failed to fetch audit logs.', 500);
  }
};

module.exports = { getAnalytics, getAuditLogs };
