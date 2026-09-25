const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/response.util');
const { getPagination } = require('../utils/helpers');

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { unreadOnly } = req.query;

    const filter = { userId: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifs, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      data: { notifications: notifs, unreadCount },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return sendError(res, 'Failed to fetch notifications.', 500);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notif) return sendError(res, 'Notification not found.', 404);
    return sendSuccess(res, { notification: notif }, 'Marked as read.');
  } catch (err) {
    return sendError(res, 'Failed to mark notification.', 500);
  }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return sendSuccess(res, null, 'All notifications marked as read.');
  } catch (err) {
    return sendError(res, 'Failed to mark all as read.', 500);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    return sendSuccess(res, null, 'Notification deleted.');
  } catch (err) {
    return sendError(res, 'Failed to delete notification.', 500);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
