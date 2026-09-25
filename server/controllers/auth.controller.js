const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const { generateToken } = require('../utils/jwt.util');
const { sendSuccess, sendError } = require('../utils/response.util');
const { createAuditLog } = require('../utils/audit.util');
const { notifications } = require('../services/notification.service');

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, username, email, password, mobile, location } = req.body;

    const cleanUsername = username?.trim().toLowerCase();
    const cleanEmail = email?.trim().toLowerCase();
    const cleanMobile = mobile?.trim();

    if (!cleanUsername || !password || !cleanMobile || !name) {
      return sendError(res, 'Please provide name, username, mobile number, and password.', 400);
    }

    // Check if user exists
    const orConditions = [{ username: cleanUsername }, { mobile: cleanMobile }];
    if (cleanEmail) orConditions.push({ email: cleanEmail });

    const existingUser = await User.findOne({ $or: orConditions });

    if (existingUser) {
      if (existingUser.username === cleanUsername) return sendError(res, 'This username is already registered.', 409);
      if (existingUser.mobile === cleanMobile) return sendError(res, 'This mobile number is already registered.', 409);
      return sendError(res, 'This email is already registered.', 409);
    }

    const user = new User({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail || undefined,
      password,
      mobile: cleanMobile,
      location,
      role: 'customer',
    });

    await user.save();

    const token = generateToken({ id: user._id, role: user.role });

    await createAuditLog({
      actor: user._id,
      actorRole: 'customer',
      action: 'REGISTER',
      resource: 'User',
      resourceId: user._id,
      req,
    });

    return sendSuccess(
      res,
      { token, user: { id: user._id, name: user.name, username: user.username, role: user.role } },
      'Account created successfully! Welcome to CareConnect.',
      201
    );
  } catch (err) {
    console.error('Register error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message).join('. ');
      return sendError(res, messages || 'Validation failed.', 422);
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'Field';
      return sendError(res, `This ${field} is already registered.`, 409);
    }
    return sendError(res, err.message || 'Registration failed. Please try again.', 500);
  }
};

// @desc    Provider application (signup for providers)
// @route   POST /api/auth/provider-apply
// @access  Public
const providerApply = async (req, res) => {
  try {
    const { name, username, email, password, mobile, location, bio, skills, experience, serviceAreas, categories } = req.body;

    const cleanUsername = username?.trim().toLowerCase();
    const cleanEmail = email?.trim().toLowerCase();
    const cleanMobile = mobile?.trim();

    if (!cleanUsername || !password || !cleanMobile || !name) {
      return sendError(res, 'Please provide name, username, mobile number, and password.', 400);
    }

    // Check if user exists
    const orConditions = [{ username: cleanUsername }, { mobile: cleanMobile }];
    if (cleanEmail) orConditions.push({ email: cleanEmail });

    const existingUser = await User.findOne({ $or: orConditions });

    if (existingUser) {
      if (existingUser.username === cleanUsername) return sendError(res, 'This username is already registered.', 409);
      if (existingUser.mobile === cleanMobile) return sendError(res, 'This mobile number is already registered.', 409);
      return sendError(res, 'This email is already registered.', 409);
    }

    // Create user with pending status (cannot login until approved)
    const user = new User({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail || undefined,
      password,
      mobile: cleanMobile,
      location,
      role: 'provider',
      accountStatus: 'pending',
    });

    await user.save();

    // Handle profile image upload
    let profileImageUrl = null;
    if (req.files && req.files.profileImage) {
      profileImageUrl = `/uploads/profiles/${req.files.profileImage[0].filename}`;
    }

    // Parse skills if string
    let parsedSkills = skills;
    if (typeof skills === 'string') {
      try { parsedSkills = JSON.parse(skills); } catch { parsedSkills = []; }
    }

    let parsedServiceAreas = serviceAreas;
    if (typeof serviceAreas === 'string') {
      try { parsedServiceAreas = JSON.parse(serviceAreas); } catch { parsedServiceAreas = []; }
    }

    let parsedCategories = categories;
    if (typeof categories === 'string') {
      try { parsedCategories = JSON.parse(categories); } catch { parsedCategories = []; }
    }

    let parsedExperience = experience;
    if (typeof experience === 'string') {
      try { parsedExperience = JSON.parse(experience); } catch { parsedExperience = {}; }
    }

    // Handle document uploads
    const documents = [];
    if (req.files && req.files.documents) {
      for (const doc of req.files.documents) {
        documents.push({
          type: 'other',
          url: `/uploads/documents/${doc.filename}`,
          filename: doc.originalname,
        });
      }
    }

    // Create provider profile
    const profile = new ProviderProfile({
      userId: user._id,
      profileImage: profileImageUrl,
      bio,
      categories: parsedCategories || [],
      skills: Array.isArray(parsedSkills)
        ? parsedSkills.map((s) => (typeof s === 'string' ? { name: s } : s))
        : [],
      experience: parsedExperience || {},
      serviceAreas: parsedServiceAreas || [],
      documents,
      verificationStatus: 'pending',
    });

    await profile.save();

    // Notify admins about new application
    const admins = await User.find({ role: 'admin', accountStatus: 'active' }).select('_id');
    if (admins.length > 0) {
      await notifications.newProviderApplication(admins.map((a) => a._id), profile._id);
    }

    await createAuditLog({
      actor: user._id,
      actorRole: 'provider',
      action: 'PROVIDER_APPLY',
      resource: 'ProviderProfile',
      resourceId: profile._id,
      req,
    });

    return sendSuccess(
      res,
      { applicationId: profile._id },
      'Application submitted successfully! Our team will review it within 2-3 business days.',
      201
    );
  } catch (err) {
    console.error('Provider apply error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message).join('. ');
      return sendError(res, messages || 'Validation failed. Please verify your details.', 422);
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'Field';
      return sendError(res, `This ${field} is already registered.`, 409);
    }
    return sendError(res, err.message || 'Application submission failed. Please try again.', 500);
  }
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return sendError(res, 'Please provide both username and password.', 400);
    }

    const cleanUsername = String(username).trim();

    const user = await User.findOne({
      $or: [
        { username: cleanUsername.toLowerCase() },
        { email: cleanUsername.toLowerCase() },
        { mobile: cleanUsername },
      ],
    }).select('+password');

    if (!user) {
      return sendError(res, 'Invalid username or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid username or password.', 401);
    }

    // For providers: check if approved
    if (user.role === 'provider') {
      const profile = await ProviderProfile.findOne({ userId: user._id });
      if (!profile || profile.verificationStatus === 'pending') {
        return sendError(
          res,
          'Your provider application is under review. You will be notified once approved.',
          403
        );
      }
      if (profile.verificationStatus === 'rejected') {
        return sendError(
          res,
          `Your application was rejected. Reason: ${profile.rejectionReason || 'Please contact support.'}`,
          403
        );
      }
    }

    // Check account status
    if (user.accountStatus === 'suspended') {
      return sendError(res, 'Your account has been suspended. Please contact support.', 403);
    }
    if (user.accountStatus === 'inactive') {
      return sendError(res, 'Your account is inactive. Please contact support.', 403);
    }
    if (user.accountStatus === 'pending' && user.role !== 'provider') {
      return sendError(res, 'Your account is pending activation.', 403);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken({ id: user._id, role: user.role });

    // Fetch provider profile if provider
    let providerProfile = null;
    if (user.role === 'provider') {
      providerProfile = await ProviderProfile.findOne({ userId: user._id })
        .select('verificationStatus rating totalCompletedJobs isAvailable');
    }

    await createAuditLog({
      actor: user._id,
      actorRole: user.role,
      action: 'LOGIN',
      resource: 'User',
      resourceId: user._id,
      req,
    });

    return sendSuccess(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profileImage: user.profileImage,
        location: user.location,
        accountStatus: user.accountStatus,
        providerProfile,
      },
    }, 'Login successful!');
  } catch (err) {
    console.error('Login error:', err);
    return sendError(res, 'Login failed. Please try again.', 500);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let providerProfile = null;
    if (user.role === 'provider') {
      providerProfile = await ProviderProfile.findOne({ userId: user._id })
        .populate('categories', 'name icon slug');
    }

    return sendSuccess(res, { user, providerProfile }, 'Profile fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch profile.', 500);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return sendError(res, 'Current password is incorrect.', 400);
    }

    user.password = newPassword;
    await user.save();

    await createAuditLog({
      actor: user._id,
      actorRole: user.role,
      action: 'CHANGE_PASSWORD',
      resource: 'User',
      resourceId: user._id,
      req,
    });

    return sendSuccess(res, null, 'Password changed successfully.');
  } catch (err) {
    return sendError(res, 'Failed to change password.', 500);
  }
};

module.exports = { register, providerApply, login, getMe, changePassword };
