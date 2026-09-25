const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
    },
    problemDescription: {
      type: String,
      required: [true, 'Problem description is required'],
      minlength: [10, 'Please provide a more detailed description'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    images: [
      {
        url: String,
        filename: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    location: {
      address: { type: String, required: true },
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required'],
    },
    preferredTime: {
      type: String,
      required: [true, 'Preferred time is required'],
    },
    aiClassification: {
      category: String,
      specificService: String,
      requiredSkills: [String],
      possibleIssue: String,
      confidence: Number,
      classifiedAt: Date,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'ai_classified',
        'finding_providers',
        'quotes_received',
        'provider_selected',
        'booked',
        'cancelled',
        'expired',
      ],
      default: 'pending',
    },
    cancellationReason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    additionalInfo: {
      type: String,
      maxlength: [1000, 'Additional info cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
serviceRequestSchema.index({ customerId: 1, status: 1 });
serviceRequestSchema.index({ category: 1, status: 1 });
serviceRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
