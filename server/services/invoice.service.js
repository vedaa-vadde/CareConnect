/**
 * Invoice Service
 * Generates invoices from bookings
 */

const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Quote = require('../models/Quote');
const { notifications } = require('./notification.service');

const generateInvoice = async (bookingId) => {
  // Check if invoice already exists
  const existing = await Invoice.findOne({ bookingId });
  if (existing) return existing;

  const booking = await Booking.findById(bookingId)
    .populate('quoteId')
    .populate('serviceRequestId')
    .populate('category', 'name');

  if (!booking) throw new Error('Booking not found');

  const quote = booking.quoteId;
  const serviceName = booking.category?.name || 'Home Service';

  const items = [
    {
      description: `${serviceName} - ${booking.serviceRequestId?.problemDescription?.substring(0, 100) || 'Professional service'}`,
      quantity: 1,
      unitPrice: booking.agreedAmount,
      total: booking.agreedAmount,
    },
  ];

  // Add convenience fee (optional)
  const convenienceFee = Math.round(booking.agreedAmount * 0.02); // 2%
  items.push({
    description: 'Platform Convenience Fee',
    quantity: 1,
    unitPrice: convenienceFee,
    total: convenienceFee,
  });

  const subtotal = booking.agreedAmount;
  const taxes = [
    {
      name: 'GST (18%)',
      rate: 18,
      amount: Math.round(subtotal * 0.18),
    },
  ];
  const totalTax = taxes.reduce((sum, t) => sum + t.amount, 0);
  const total = subtotal + convenienceFee + totalTax;

  const invoice = new Invoice({
    bookingId,
    customerId: booking.customerId,
    providerId: booking.providerId,
    items,
    subtotal,
    taxes,
    totalTax,
    total,
    status: 'generated',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await invoice.save();

  // Notify customer
  await notifications.invoiceGenerated(booking.customerId, invoice._id);

  return invoice;
};

module.exports = { generateInvoice };
