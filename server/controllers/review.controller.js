const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { sendSuccess, sendError } = require('../utils/response.util');

// @desc    Submit review (customer)
// @route   POST /api/reviews
// @access  Customer
const submitReview = async (req, res) => {
  try {
    const { bookingId, rating, review, tags } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return sendError(res, 'Booking not found.', 404);

    if (booking.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    const allowedStatuses = ['completed_by_provider', 'confirmed_by_customer', 'completed'];
    if (!allowedStatuses.includes(booking.status)) {
      return sendError(res, 'You can only review a completed service booking.', 400);
    }

    // Check if already reviewed
    const existing = await Review.findOne({ bookingId });
    if (existing) return sendError(res, 'You have already reviewed this booking.', 409);

    let parsedTags = tags;
    if (typeof tags === 'string') {
      try { parsedTags = JSON.parse(tags); } catch { parsedTags = []; }
    }

    const newReview = new Review({
      bookingId,
      customerId: req.user._id,
      providerId: booking.providerId,
      rating: Number(rating) || 5,
      review: review || '',
      tags: parsedTags || [],
    });

    await newReview.save();

    // If booking was not yet confirmed by customer, confirm it now
    if (booking.status !== 'confirmed_by_customer') {
      booking.status = 'confirmed_by_customer';
      booking.completionConfirmedAt = new Date();
      booking.statusHistory.push({
        status: 'confirmed_by_customer',
        changedBy: req.user._id,
        note: 'Customer confirmed completion via rating & review.',
      });
      await booking.save();

      // Update provider earnings and completed jobs
      const ProviderProfile = require('../models/ProviderProfile');
      await ProviderProfile.findOneAndUpdate(
        { userId: booking.providerId },
        {
          $inc: {
            totalCompletedJobs: 1,
            'earnings.total': booking.agreedAmount || 0,
          },
        }
      );
    }

    return sendSuccess(res, { review: newReview }, 'Thank you for your review!', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to submit review.', 500);
  }
};

// @desc    Get review for a specific booking
// @route   GET /api/reviews/booking/:bookingId
// @access  Public / Authenticated
const getBookingReview = async (req, res) => {
  try {
    const review = await Review.findOne({ bookingId: req.params.bookingId });
    return sendSuccess(res, { review }, 'Review fetched.');
  } catch (err) {
    return sendError(res, 'Failed to fetch review.', 500);
  }
};

// @desc    Get reviews for a provider
// @route   GET /api/reviews/provider/:providerId
// @access  Public
const getProviderReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ providerId: req.params.providerId, isVisible: true })
      .populate('customerId', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(50);

    return sendSuccess(res, { reviews }, 'Reviews fetched.');
  } catch (err) {
    return sendError(res, 'Failed to fetch reviews.', 500);
  }
};

// @desc    Provider responds to review
// @route   PUT /api/reviews/:id/respond
// @access  Provider
const respondToReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return sendError(res, 'Review not found.', 404);

    if (review.providerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    review.providerResponse = { text: req.body.text, respondedAt: new Date() };
    await review.save();

    return sendSuccess(res, { review }, 'Response added.');
  } catch (err) {
    return sendError(res, 'Failed to respond to review.', 500);
  }
};

module.exports = { submitReview, getBookingReview, getProviderReviews, respondToReview };
