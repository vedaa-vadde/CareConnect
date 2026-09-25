const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
    },
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
    },
    estimatedEndTime: {
      type: String,
    },
    agreedAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending_acceptance',
        'accepted',
        'rejected_by_provider',
        'on_the_way',
        'in_progress',
        'evidence_uploaded',
        'completed_by_provider',
        'confirmed_by_customer',
        'disputed',
        'cancelled',
        'refunded',
      ],
      default: 'pending_acceptance',
    },
    cancellation: {
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      requestedAt: Date,
      status: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected'],
        default: 'none',
      },
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      processedAt: Date,
      refundAmount: Number,
    },
    completionConfirmedAt: Date,
    providerNotes: String,
    operationsNotes: String,
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ providerId: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1, providerId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
