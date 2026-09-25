const express = require('express');
const router = express.Router();
const { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory, updatePricingRules } = require('../controllers/category.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadImages, handleUploadError } = require('../middleware/upload.middleware');

// Public
router.get('/', getAllCategories);
router.get('/:idOrSlug', getCategoryById);

// Admin only
router.use(protect);
router.post('/', authorize('admin'), uploadImages.single('categoryImage'), handleUploadError, createCategory);
router.put('/:id', authorize('admin'), uploadImages.single('categoryImage'), handleUploadError, updateCategory);
router.put('/:id/pricing', authorize('admin'), updatePricingRules);
router.delete('/:id', authorize('admin'), deleteCategory);

module.exports = router;
