const express = require('express');
const router = express.Router();
const { getActiveBookings, assignProvider, handleCancellation, getCancellationRequests } = require('../controllers/operations.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);
router.use(authorize('admin', 'operations'));

router.get('/bookings', getActiveBookings);
router.put('/bookings/:id/assign', assignProvider);
router.put('/bookings/:id/cancellation', handleCancellation);
router.get('/cancellations', getCancellationRequests);

module.exports = router;
