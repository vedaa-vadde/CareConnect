const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const { sendSuccess, sendError } = require('../utils/response.util');
const { generateInvoice } = require('../services/invoice.service');

// @desc    Generate/get invoice for a booking
// @route   POST /api/invoices/booking/:bookingId
// @access  Provider (own booking), Admin
const getOrCreateInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return sendError(res, 'Booking not found.', 404);

    // Access check
    if (
      req.user.role === 'provider' && booking.providerId.toString() !== req.user._id.toString() ||
      req.user.role === 'customer' && booking.customerId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'Access denied.', 403);
    }

    const invoice = await generateInvoice(bookingId);
    return sendSuccess(res, { invoice }, 'Invoice fetched/generated successfully.');
  } catch (err) {
    return sendError(res, 'Failed to generate invoice.', 500);
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Customer (own), Provider (own), Admin
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name mobile email location')
      .populate('providerId', 'name mobile')
      .populate({
        path: 'bookingId',
        populate: { path: 'category', select: 'name' },
      });

    if (!invoice) return sendError(res, 'Invoice not found.', 404);

    if (
      req.user.role === 'customer' && invoice.customerId._id.toString() !== req.user._id.toString() ||
      req.user.role === 'provider' && invoice.providerId._id.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'Access denied.', 403);
    }

    return sendSuccess(res, { invoice }, 'Invoice fetched.');
  } catch (err) {
    return sendError(res, 'Failed to fetch invoice.', 500);
  }
};

// @desc    Get my invoices
// @route   GET /api/invoices
// @access  Customer, Provider
const getMyInvoices = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'customer') filter.customerId = req.user._id;
    else if (req.user.role === 'provider') filter.providerId = req.user._id;

    const invoices = await Invoice.find(filter)
      .populate('bookingId', 'scheduledDate')
      .populate('customerId', 'name')
      .populate('providerId', 'name')
      .sort({ createdAt: -1 });

    return sendSuccess(res, { invoices }, 'Invoices fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch invoices.', 500);
  }
};

module.exports = { getOrCreateInvoice, getInvoiceById, getMyInvoices };
