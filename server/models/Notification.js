const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'quote_received',
        'booking_confirmed',
        'provider_assigned',
        'provider_on_the_way',
        'job_started',
        'job_completed',
        'invoice_generated',
        'dispute_update',
        'cancellation_update',
        'new_service_request',
        'quote_accepted',
        'payment_update',
        'review_received',
        'application_update',
        'system',
        'support_message',
        'escalation',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    relatedResource: {
      type: String,
      enum: ['booking', 'service_request', 'quote', 'dispute', 'invoice', 'provider', 'user'],
    },
    relatedResourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    actionUrl: String,
    icon: String,
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
