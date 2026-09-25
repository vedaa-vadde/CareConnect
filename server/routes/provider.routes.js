const express = require('express');
const router = express.Router();
const {
  getAllProviders, getProviderById, updateProviderProfile,
  uploadDocuments, verifyProvider, getMyProfile, getPendingApplications
} = require('../controllers/provider.controller');
const { protect, requireApprovedProvider } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadImages, uploadDocuments: uploadDocs, handleUploadError } = require('../middleware/upload.middleware');

// Public
router.get('/', getAllProviders);

// Protected
router.use(protect);

router.get('/me', getMyProfile);
router.get('/applications', authorize('admin', 'operations'), getPendingApplications);
router.get('/:id', getProviderById);

router.put(
  '/profile',
  authorize('provider'),
  uploadImages.single('profileImage'),
  handleUploadError,
  updateProviderProfile
);

router.post(
  '/documents',
  authorize('provider'),
  uploadDocs.array('documents', 5),
  handleUploadError,
  uploadDocuments
);

router.put('/:id/verify', authorize('admin'), verifyProvider);

module.exports = router;
