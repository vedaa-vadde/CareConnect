const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateProfile, updateUserStatus, createStaff, deleteUser } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadImages, handleUploadError } = require('../middleware/upload.middleware');

router.use(protect);

router.get('/', authorize('admin', 'operations', 'support'), getAllUsers);
router.get('/:id', getUserById);
router.put('/profile', uploadImages.single('profileImage'), handleUploadError, updateProfile);
router.put('/:id/status', authorize('admin'), updateUserStatus);
router.post('/create-staff', authorize('admin'), createStaff);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
