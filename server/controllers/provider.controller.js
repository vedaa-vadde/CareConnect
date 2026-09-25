const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.util');
const { getPagination } = require('../utils/helpers');
const { createAuditLog } = require('../utils/audit.util');
const { notifications } = require('../services/notification.service');

// @desc    Get all providers
// @route   GET /api/providers
// @access  Public (limited) / Admin (full)
const getAllProviders = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, category, city, search } = req.query;

    const filter = {};

    // Public sees only approved
    if (!req.user || !['admin', 'operations', 'support'].includes(req.user.role)) {
      filter.verificationStatus = 'approved';
    } else if (status) {
      filter.verificationStatus = status;
    }

    if (category) filter.categories = category;

    const [profiles, total] = await Promise.all([
      ProviderProfile.find(filter)
        .populate('userId', 'name username profileImage mobile location accountStatus')
        .populate('categories', 'name icon slug')
        .sort({ 'rating.average': -1 })
        .skip(skip)
        .limit(limit),
      ProviderProfile.countDocuments(filter),
    ]);

    return sendPaginated(res, profiles, total, page, limit, 'Providers fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch providers.', 500);
  }
};

// @desc    Get provider by ID (public profile)
// @route   GET /api/providers/:id
// @access  Public
const getProviderById = async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({ userId: req.params.id })
      .populate('userId', 'name username profileImage mobile location')
      .populate('categories', 'name icon slug description');

    if (!profile) return sendError(res, 'Provider not found.', 404);

    // Public: only show approved providers
    if (profile.verificationStatus !== 'approved' && (!req.user || !['admin', 'operations', 'support'].includes(req.user.role))) {
      return sendError(res, 'Provider not found.', 404);
    }

    return sendSuccess(res, { profile }, 'Provider fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch provider.', 500);
  }
};

// @desc    Update provider profile
// @route   PUT /api/providers/profile
// @access  Provider (approved)
const updateProviderProfile = async (req, res) => {
  try {
    const { bio, skills, experience, serviceAreas, bankDetails, isAvailable } = req.body;

    let parsedSkills = skills;
    if (typeof skills === 'string') {
      try { parsedSkills = JSON.parse(skills); } catch { parsedSkills = undefined; }
    }
    let parsedServiceAreas = serviceAreas;
    if (typeof serviceAreas === 'string') {
      try { parsedServiceAreas = JSON.parse(serviceAreas); } catch { parsedServiceAreas = undefined; }
    }
    let parsedExperience = experience;
    if (typeof experience === 'string') {
      try { parsedExperience = JSON.parse(experience); } catch { parsedExperience = undefined; }
    }
    let parsedBankDetails = bankDetails;
    if (typeof bankDetails === 'string') {
      try { parsedBankDetails = JSON.parse(bankDetails); } catch { parsedBankDetails = undefined; }
    }

    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (parsedSkills !== undefined) updates.skills = parsedSkills.map((s) => (typeof s === 'string' ? { name: s } : s));
    if (parsedExperience !== undefined) updates.experience = parsedExperience;
    if (parsedServiceAreas !== undefined) updates.serviceAreas = parsedServiceAreas;
    if (parsedBankDetails !== undefined) updates.bankDetails = parsedBankDetails;
    if (isAvailable !== undefined) updates.isAvailable = isAvailable === 'true' || isAvailable === true;

    if (req.file) {
      updates.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    const profile = await ProviderProfile.findOneAndUpdate(
      { userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('categories', 'name icon');

    if (!profile) return sendError(res, 'Provider profile not found.', 404);

    return sendSuccess(res, { profile }, 'Profile updated successfully.');
  } catch (err) {
    return sendError(res, 'Failed to update profile.', 500);
  }
};

// @desc    Upload provider documents
// @route   POST /api/providers/documents
// @access  Provider
const uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No files uploaded.', 400);
    }

    const newDocs = req.files.map((file) => ({
      type: req.body.docType || 'other',
      url: `/uploads/documents/${file.filename}`,
      filename: file.originalname,
    }));

    const profile = await ProviderProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { documents: { $each: newDocs } } },
      { new: true }
    );

    return sendSuccess(res, { documents: profile.documents }, 'Documents uploaded successfully.');
  } catch (err) {
    return sendError(res, 'Failed to upload documents.', 500);
  }
};

// @desc    Admin: Review provider application
// @route   PUT /api/providers/:id/verify
// @access  Admin
const verifyProvider = async (req, res) => {
  try {
    const { status, notes, rejectionReason } = req.body;
    const { id } = req.params; // provider profile ID

    if (!['approved', 'rejected', 'under_review', 'suspended'].includes(status)) {
      return sendError(res, 'Invalid verification status.', 400);
    }

    const profile = await ProviderProfile.findById(id).populate('userId');
    if (!profile) return sendError(res, 'Provider profile not found.', 404);

    profile.verificationStatus = status;
    if (notes) profile.adminVerificationNotes = notes;
    if (rejectionReason) profile.rejectionReason = rejectionReason;
    profile.reviewedBy = req.user._id;
    profile.reviewedAt = new Date();

    await profile.save();

    // Activate/deactivate user account based on verification
    const accountStatus = status === 'approved' ? 'active' : 'pending';
    await User.findByIdAndUpdate(profile.userId._id, { accountStatus });

    // Notify provider
    await notifications.applicationUpdate(
      profile.userId._id,
      status,
      rejectionReason
    );

    await createAuditLog({
      actor: req.user._id,
      actorRole: req.user.role,
      action: `PROVIDER_${status.toUpperCase()}`,
      resource: 'ProviderProfile',
      resourceId: id,
      metadata: { notes, rejectionReason },
      req,
    });

    return sendSuccess(res, { profile }, `Provider ${status} successfully.`);
  } catch (err) {
    return sendError(res, 'Failed to update provider verification.', 500);
  }
};

// @desc    Get provider's own profile
// @route   GET /api/providers/me
// @access  Provider
const getMyProfile = async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({ userId: req.user._id })
      .populate('categories', 'name icon slug description pricingRules')
      .populate('userId', 'name username email mobile location profileImage');

    if (!profile) return sendError(res, 'Provider profile not found.', 404);

    return sendSuccess(res, { profile }, 'Profile fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch provider profile.', 500);
  }
};

// @desc    Get pending provider applications (admin)
// @route   GET /api/providers/applications
// @access  Admin
const getPendingApplications = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status } = req.query;

    const filter = { verificationStatus: status || 'pending' };

    const [applications, total] = await Promise.all([
      ProviderProfile.find(filter)
        .populate('userId', 'name username mobile email location')
        .sort({ applicationSubmittedAt: -1 })
        .skip(skip)
        .limit(limit),
      ProviderProfile.countDocuments(filter),
    ]);

    return sendPaginated(res, applications, total, page, limit, 'Applications fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch applications.', 500);
  }
};

module.exports = {
  getAllProviders,
  getProviderById,
  updateProviderProfile,
  uploadDocuments,
  verifyProvider,
  getMyProfile,
  getPendingApplications,
};
