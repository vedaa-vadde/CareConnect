const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.util');
const { getPagination, getSortOptions } = require('../utils/helpers');
const { createAuditLog } = require('../utils/audit.util');

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { role, status, search } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.accountStatus = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return sendPaginated(res, users, total, page, limit, 'Users fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch users.', 500);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin, Operations, or self
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Self check
    if (req.user.role === 'customer' && req.user._id.toString() !== id) {
      return sendError(res, 'Access denied.', 403);
    }

    const user = await User.findById(id);
    if (!user) return sendError(res, 'User not found.', 404);

    let providerProfile = null;
    if (user.role === 'provider') {
      providerProfile = await ProviderProfile.findOne({ userId: user._id })
        .populate('categories', 'name icon');
    }

    return sendSuccess(res, { user, providerProfile }, 'User fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch user.', 500);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private (self)
const updateProfile = async (req, res) => {
  try {
    const { name, mobile, location } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (mobile) updates.mobile = mobile;
    if (location) updates.location = location;

    if (req.file) {
      updates.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });

    return sendSuccess(res, { user }, 'Profile updated successfully.');
  } catch (err) {
    return sendError(res, 'Failed to update profile.', 500);
  }
};

// @desc    Update user status (admin)
// @route   PUT /api/users/:id/status
// @access  Admin
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { accountStatus: status },
      { new: true }
    );

    if (!user) return sendError(res, 'User not found.', 404);

    await createAuditLog({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'UPDATE_USER_STATUS',
      resource: 'User',
      resourceId: id,
      metadata: { newStatus: status },
      req,
    });

    return sendSuccess(res, { user }, `User status updated to ${status}.`);
  } catch (err) {
    return sendError(res, 'Failed to update user status.', 500);
  }
};

// @desc    Create staff account (admin creates ops/support)
// @route   POST /api/users/create-staff
// @access  Admin
const createStaff = async (req, res) => {
  try {
    const { name, username, password, mobile, role } = req.body;

    if (!['operations', 'support'].includes(role)) {
      return sendError(res, 'Invalid role. Can only create operations or support accounts.', 400);
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) return sendError(res, 'Username already exists.', 409);

    const user = new User({
      name,
      username: username.toLowerCase(),
      password,
      mobile,
      role,
      createdBy: req.user._id,
    });

    await user.save();

    await createAuditLog({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'CREATE_STAFF',
      resource: 'User',
      resourceId: user._id,
      metadata: { role },
      req,
    });

    return sendSuccess(res, { user }, `${role} account created successfully.`, 201);
  } catch (err) {
    return sendError(res, 'Failed to create staff account.', 500);
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return sendError(res, 'You cannot delete your own account.', 400);
    }

    const user = await User.findByIdAndUpdate(id, { accountStatus: 'inactive' }, { new: true });
    if (!user) return sendError(res, 'User not found.', 404);

    await createAuditLog({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'DEACTIVATE_USER',
      resource: 'User',
      resourceId: id,
      req,
    });

    return sendSuccess(res, null, 'User account deactivated.');
  } catch (err) {
    return sendError(res, 'Failed to deactivate user.', 500);
  }
};

module.exports = { getAllUsers, getUserById, updateProfile, updateUserStatus, createStaff, deleteUser };
