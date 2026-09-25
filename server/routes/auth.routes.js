const express = require('express');
const router = express.Router();
const { register, providerApply, login, getMe, changePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const { uploadImages, uploadDocuments, handleUploadError } = require('../middleware/upload.middleware');

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post(
  '/provider-apply',
  authLimiter,
  uploadImages.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'documents', maxCount: 5 }]),
  handleUploadError,
  providerApply
);

// Protected routes
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
