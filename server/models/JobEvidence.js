const mongoose = require('mongoose');

const jobEvidenceSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    beforeImages: [
      {
        url: String,
        filename: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    afterImages: [
      {
        url: String,
        filename: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    workSummary: {
      type: String,
      maxlength: [1000, 'Work summary cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('JobEvidence', jobEvidenceSchema);
