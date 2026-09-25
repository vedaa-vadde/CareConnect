const express = require('express');
const router = express.Router();
const { submitReview, getBookingReview, getProviderReviews, respondToReview } = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/provider/:providerId', getProviderReviews);
router.get('/booking/:bookingId', getBookingReview);

router.use(protect);
router.post('/', authorize('customer'), submitReview);
router.put('/:id/respond', authorize('provider'), respondToReview);

module.exports = router;
