const ServiceCategory = require('../models/ServiceCategory');
const { sendSuccess, sendError } = require('../utils/response.util');
const { createAuditLog } = require('../utils/audit.util');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getAllCategories = async (req, res) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    } else if (!req.user || !['admin', 'operations'].includes(req.user?.role)) {
      filter.isActive = true;
    }

    const categories = await ServiceCategory.find(filter).sort({ sortOrder: 1, name: 1 });
    return sendSuccess(res, { categories }, 'Categories fetched successfully.');
  } catch (err) {
    return sendError(res, 'Failed to fetch categories.', 500);
  }
};

// @desc    Get category by ID or slug
// @route   GET /api/categories/:idOrSlug
// @access  Public
const getCategoryById = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const category = await ServiceCategory.findOne({
      $or: [{ _id: idOrSlug.match(/^[a-f\d]{24}$/i) ? idOrSlug : null }, { slug: idOrSlug }],
    });

    if (!category) return sendError(res, 'Category not found.', 404);
    return sendSuccess(res, { category }, 'Category fetched.');
  } catch (err) {
    return sendError(res, 'Failed to fetch category.', 500);
  }
};

// @desc    Create category (admin)
// @route   POST /api/categories
// @access  Admin
const createCategory = async (req, res) => {
  try {
    const { name, description, icon, requiredSkills, pricingRules, sortOrder, subCategories } = req.body;

    let parsedSkills = requiredSkills;
    if (typeof requiredSkills === 'string') {
      try { parsedSkills = JSON.parse(requiredSkills); } catch { parsedSkills = []; }
    }

    let parsedPricing = pricingRules;
    if (typeof pricingRules === 'string') {
      try { parsedPricing = JSON.parse(pricingRules); } catch { parsedPricing = {}; }
    }

    let parsedSubCats = subCategories;
    if (typeof subCategories === 'string') {
      try { parsedSubCats = JSON.parse(subCategories); } catch { parsedSubCats = []; }
    }

    const imageUrl = req.file ? `/uploads/categories/${req.file.filename}` : null;

    const category = new ServiceCategory({
      name,
      description,
      icon,
      image: imageUrl,
      requiredSkills: parsedSkills || [],
      pricingRules: parsedPricing || {},
      sortOrder: sortOrder || 0,
      subCategories: parsedSubCats || [],
    });

    await category.save();

    await createAuditLog({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'CREATE_CATEGORY',
      resource: 'ServiceCategory',
      resourceId: category._id,
      metadata: { name },
      req,
    });

    return sendSuccess(res, { category }, 'Category created successfully.', 201);
  } catch (err) {
    if (err.code === 11000) return sendError(res, 'A category with this name already exists.', 409);
    return sendError(res, 'Failed to create category.', 500);
  }
};

// @desc    Update category (admin)
// @route   PUT /api/categories/:id
// @access  Admin
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Parse JSON fields
    ['requiredSkills', 'pricingRules', 'subCategories'].forEach((field) => {
      if (typeof updates[field] === 'string') {
        try { updates[field] = JSON.parse(updates[field]); } catch { delete updates[field]; }
      }
    });

    if (req.file) updates.image = `/uploads/categories/${req.file.filename}`;

    const category = await ServiceCategory.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!category) return sendError(res, 'Category not found.', 404);

    await createAuditLog({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'UPDATE_CATEGORY',
      resource: 'ServiceCategory',
      resourceId: id,
      req,
    });

    return sendSuccess(res, { category }, 'Category updated successfully.');
  } catch (err) {
    return sendError(res, 'Failed to update category.', 500);
  }
};

// @desc    Delete/disable category (admin)
// @route   DELETE /api/categories/:id
// @access  Admin
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query;

    let category;
    if (hardDelete === 'true') {
      category = await ServiceCategory.findByIdAndDelete(id);
    } else {
      category = await ServiceCategory.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }

    if (!category) return sendError(res, 'Category not found.', 404);

    await createAuditLog({
      actor: req.user._id,
      actorRole: req.user.role,
      action: hardDelete === 'true' ? 'DELETE_CATEGORY' : 'DISABLE_CATEGORY',
      resource: 'ServiceCategory',
      resourceId: id,
      req,
    });

    return sendSuccess(res, null, `Category ${hardDelete === 'true' ? 'deleted' : 'disabled'} successfully.`);
  } catch (err) {
    return sendError(res, 'Failed to delete category.', 500);
  }
};

// @desc    Update pricing rules (admin)
// @route   PUT /api/categories/:id/pricing
// @access  Admin
const updatePricingRules = async (req, res) => {
  try {
    const { id } = req.params;
    const { minimum, maximum, unit, notes } = req.body;

    const category = await ServiceCategory.findByIdAndUpdate(
      id,
      { pricingRules: { minimum, maximum, unit, notes } },
      { new: true }
    );

    if (!category) return sendError(res, 'Category not found.', 404);

    await createAuditLog({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'UPDATE_PRICING_RULES',
      resource: 'ServiceCategory',
      resourceId: id,
      metadata: { minimum, maximum },
      req,
    });

    return sendSuccess(res, { category }, 'Pricing rules updated successfully.');
  } catch (err) {
    return sendError(res, 'Failed to update pricing rules.', 500);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updatePricingRules,
};
