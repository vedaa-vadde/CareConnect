const express = require('express');
const router = express.Router();
const { raiseDispute, getDisputes, getDisputeById, updateDispute, respondToDispute } = require('../controllers/dispute.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadImages, handleUploadError } = require('../middleware/upload.middleware');

router.use(protect);

router.post('/', uploadImages.array('evidence', 5), handleUploadError, raiseDispute);
router.get('/', getDisputes);
router.get('/:id', getDisputeById);
router.put('/:id', authorize('admin', 'operations', 'support'), updateDispute);
router.put('/:id/respond', authorize('provider'), uploadImages.array('evidence', 3), handleUploadError, respondToDispute);

module.exports = router;
