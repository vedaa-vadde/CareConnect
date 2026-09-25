/**
 * Notification Service
 * Creates and manages notifications for all user types
 */

const Notification = require('../models/Notification');

const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedResource = null,
  relatedResourceId = null,
  actionUrl = null,
  priority = 'normal',
  icon = null,
}) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedResource,
      relatedResourceId,
      actionUrl,
      priority,
      icon,
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

// Bulk create for multiple users
const createBulkNotifications = async (notifications) => {
  try {
    await Notification.insertMany(notifications);
  } catch (err) {
    console.error('Failed to create bulk notifications:', err.message);
  }
};

// Predefined notification creators
const notifications = {
  quoteReceived: (customerId, bookingId, providerName) =>
    createNotification({
      userId: customerId,
      type: 'quote_received',
      title: 'New Quote Received',
      message: `${providerName} has submitted a quote for your service request.`,
      relatedResource: 'service_request',
      relatedResourceId: bookingId,
      icon: '💰',
    }),

  bookingConfirmed: (customerId, bookingId) =>
    createNotification({
      userId: customerId,
      type: 'booking_confirmed',
      title: 'Booking Confirmed! 🎉',
      message: 'Your booking has been confirmed. The provider will be in touch shortly.',
      relatedResource: 'booking',
      relatedResourceId: bookingId,
      priority: 'high',
      icon: '✅',
    }),

  providerOnTheWay: (customerId, bookingId, providerName) =>
    createNotification({
      userId: customerId,
      type: 'provider_on_the_way',
      title: 'Provider On The Way! 🚗',
      message: `${providerName} is on the way to your location.`,
      relatedResource: 'booking',
      relatedResourceId: bookingId,
      priority: 'high',
      icon: '🚗',
    }),

  jobStarted: (customerId, bookingId) =>
    createNotification({
      userId: customerId,
      type: 'job_started',
      title: 'Service Started 🔧',
      message: 'Your service has started. The provider is working on it.',
      relatedResource: 'booking',
      relatedResourceId: bookingId,
      icon: '🔧',
    }),

  jobCompleted: (customerId, bookingId) =>
    createNotification({
      userId: customerId,
      type: 'job_completed',
      title: 'Service Completed ✅',
      message: 'Your service has been completed. Please confirm and leave a review.',
      relatedResource: 'booking',
      relatedResourceId: bookingId,
      priority: 'high',
      icon: '✅',
    }),

  invoiceGenerated: (customerId, invoiceId) =>
    createNotification({
      userId: customerId,
      type: 'invoice_generated',
      title: 'Invoice Generated 📄',
      message: 'Your service invoice has been generated. Please review it.',
      relatedResource: 'invoice',
      relatedResourceId: invoiceId,
      icon: '📄',
    }),

  newServiceRequest: (providerId, requestId) =>
    createNotification({
      userId: providerId,
      type: 'new_service_request',
      title: 'New Service Request 📋',
      message: 'A new service request has been posted that matches your skills.',
      relatedResource: 'service_request',
      relatedResourceId: requestId,
      icon: '📋',
    }),

  quoteAccepted: (providerId, bookingId) =>
    createNotification({
      userId: providerId,
      type: 'quote_accepted',
      title: 'Your Quote Was Accepted! 🎉',
      message: 'A customer accepted your quote. Please accept the booking to confirm.',
      relatedResource: 'booking',
      relatedResourceId: bookingId,
      priority: 'high',
      icon: '🎉',
    }),

  cancellationUpdate: (userId, bookingId, message) =>
    createNotification({
      userId,
      type: 'cancellation_update',
      title: 'Booking Cancellation Update',
      message,
      relatedResource: 'booking',
      relatedResourceId: bookingId,
      priority: 'high',
      icon: '❌',
    }),

  disputeUpdate: (userId, disputeId, message) =>
    createNotification({
      userId,
      type: 'dispute_update',
      title: 'Dispute Update',
      message,
      relatedResource: 'dispute',
      relatedResourceId: disputeId,
      priority: 'high',
      icon: '⚠️',
    }),

  applicationUpdate: (providerId, status, reason = '') =>
    createNotification({
      userId: providerId,
      type: 'application_update',
      title: status === 'approved' ? 'Application Approved! 🎉' : 'Application Status Update',
      message:
        status === 'approved'
          ? 'Congratulations! Your provider application has been approved. You can now start accepting jobs!'
          : `Your application status has been updated to: ${status}. ${reason ? `Reason: ${reason}` : ''}`,
      priority: 'high',
      icon: status === 'approved' ? '🎉' : 'ℹ️',
    }),

  newProviderApplication: (adminIds, profileId) =>
    createBulkNotifications(
      adminIds.map((adminId) => ({
        userId: adminId,
        type: 'application_update',
        title: 'New Provider Application',
        message: 'A new provider has applied to join the platform. Please review.',
        relatedResource: 'provider',
        relatedResourceId: profileId,
        priority: 'normal',
        icon: '👤',
      }))
    ),
};

module.exports = { createNotification, createBulkNotifications, notifications };
