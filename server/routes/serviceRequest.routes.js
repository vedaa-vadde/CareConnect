const express = require('express');
const router = express.Router();
const { createServiceRequest, getServiceRequests, getServiceRequestById, cancelServiceRequest, classifyRequest } = require('../controllers/serviceRequest.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadImages, handleUploadError } = require('../middleware/upload.middleware');

router.use(protect);

router.post('/classify', classifyRequest);
router.post('/', authorize('customer'), uploadImages.array('images', 5), handleUploadError, createServiceRequest);
router.get('/', getServiceRequests);
router.get('/:id', getServiceRequestById);
router.put('/:id/cancel', authorize('customer'), cancelServiceRequest);

module.exports = router;
