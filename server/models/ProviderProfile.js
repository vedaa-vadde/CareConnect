const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceCategory',
      },
    ],
    skills: [
      {
        name: { type: String, required: true },
        yearsOfExperience: { type: Number, default: 0 },
        certified: { type: Boolean, default: false },
      },
    ],
    experience: {
      years: { type: Number, default: 0 },
      description: String,
      previousEmployers: [String],
    },
    serviceAreas: [
      {
        city: String,
        state: String,
        pincode: String,
        radius: { type: Number, default: 10 }, // km
      },
    ],
    documents: [
      {
        type: {
          type: String,
          enum: ['aadhar', 'pan', 'driving_license', 'certification', 'police_verification', 'other'],
        },
        url: String,
        filename: String,
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    adminVerificationNotes: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    totalCompletedJobs: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    earnings: {
      total: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
      thisWeek: { type: Number, default: 0 },
      today: { type: Number, default: 0 },
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
    applicationSubmittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
