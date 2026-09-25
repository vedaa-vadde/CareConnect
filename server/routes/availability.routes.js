const express = require('express');
const router = express.Router();
const { setAvailability, getProviderAvailability, getMyAvailability, checkAvailability } = require('../controllers/availability.controller');
const { protect, requireApprovedProvider } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/provider/:providerId', getProviderAvailability);

router.use(protect);

router.post('/check', checkAvailability);
router.get('/me', authorize('provider'), getMyAvailability);
router.post('/', authorize('provider'), requireApprovedProvider, setAvailability);

module.exports = router;
