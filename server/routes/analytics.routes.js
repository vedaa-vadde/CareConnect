const express = require('express');
const router = express.Router();
const { getAnalytics, getAuditLogs } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);
router.get('/', authorize('admin', 'operations'), getAnalytics);
router.get('/audit', authorize('admin'), getAuditLogs);

module.exports = router;
