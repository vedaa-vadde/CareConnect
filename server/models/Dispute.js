const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    raisedByRole: {
      type: String,
      enum: ['customer', 'provider'],
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'poor_quality',
        'no_show',
        'overcharge',
        'damage',
        'incomplete_work',
        'unprofessional',
        'safety_concern',
        'other',
      ],
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Please describe the dispute'],
      minlength: [20, 'Please provide more details'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    evidence: [
      {
        url: String,
        filename: String,
        type: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    providerResponse: {
      text: String,
      evidence: [
        {
          url: String,
          filename: String,
        },
      ],
      respondedAt: Date,
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'escalated', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: {
      decision: String,
      notes: String,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      resolvedAt: Date,
      refundApproved: { type: Boolean, default: false },
      refundAmount: Number,
      refundReason: String,
    },
    escalationHistory: [
      {
        escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        escalatedAt: { type: Date, default: Date.now },
      },
    ],
    timeline: [
      {
        action: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

disputeSchema.index({ bookingId: 1 });
disputeSchema.index({ status: 1, priority: 1 });
disputeSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
