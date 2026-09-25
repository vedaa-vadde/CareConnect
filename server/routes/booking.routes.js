const express = require('express');
const router = express.Router();
const { createBooking, getBookings, getBookingById, updateBookingStatus, confirmCompletion, requestCancellation, uploadEvidence } = require('../controllers/booking.controller');
const { protect, requireApprovedProvider } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadImages, handleUploadError } = require('../middleware/upload.middleware');

router.use(protect);

router.post('/', authorize('customer'), createBooking);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.put('/:id/status', updateBookingStatus);
router.put('/:id/confirm', authorize('customer'), confirmCompletion);
router.post('/:id/cancel-request', requestCancellation);
router.post(
  '/:id/evidence',
  authorize('provider'),
  uploadImages.fields([
    { name: 'beforeImages', maxCount: 5 },
    { name: 'afterImages', maxCount: 5 },
  ]),
  handleUploadError,
  uploadEvidence
);

module.exports = router;
