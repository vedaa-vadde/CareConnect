const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    slots: [
      {
        startTime: { type: String, required: true }, // "09:00"
        endTime: { type: String, required: true }, // "17:00"
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' },
        status: {
          type: String,
          enum: ['available', 'booked', 'blocked'],
          default: 'available',
        },
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
    // Recurring weekly schedule
    isRecurring: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for provider + date lookup
availabilitySchema.index({ providerId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);
