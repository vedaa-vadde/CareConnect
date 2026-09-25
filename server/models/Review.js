const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    review: {
      type: String,
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
    tags: [
      {
        type: String,
        enum: ['punctual', 'professional', 'quality_work', 'good_value', 'friendly', 'would_hire_again'],
      },
    ],
    providerResponse: {
      text: String,
      respondedAt: Date,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// After save, update provider's average rating
reviewSchema.post('save', async function () {
  const ProviderProfile = mongoose.model('ProviderProfile');
  const Review = mongoose.model('Review');

  const stats = await Review.aggregate([
    { $match: { providerId: this.providerId, isVisible: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await ProviderProfile.findOneAndUpdate(
      { userId: this.providerId },
      {
        'rating.average': Math.round(stats[0].avgRating * 10) / 10,
        'rating.count': stats[0].count,
      }
    );
  }
});

module.exports = mongoose.model('Review', reviewSchema);
