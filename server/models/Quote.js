const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema(
  {
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Quote amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    estimatedDuration: {
      value: { type: Number, required: true },
      unit: { type: String, enum: ['minutes', 'hours', 'days'], default: 'hours' },
    },
    message: {
      type: String,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    proposedDate: {
      type: Date,
      required: [true, 'Proposed date is required'],
    },
    proposedTime: {
      type: String,
      required: [true, 'Proposed time is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'expired'],
      default: 'pending',
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    },
    providerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
    },
    matchScore: {
      type: Number,
      default: 0,
    },
    matchReasons: [String],
  },
  {
    timestamps: true,
  }
);

// Ensure one quote per provider per request
quoteSchema.index({ serviceRequestId: 1, providerId: 1 }, { unique: true });
quoteSchema.index({ serviceRequestId: 1, status: 1 });

module.exports = mongoose.model('Quote', quoteSchema);
