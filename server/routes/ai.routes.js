const express = require('express');
const router = express.Router();
const { chat, classify, matchProviders } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { aiLimiter } = require('../middleware/rateLimiter.middleware');

router.use(protect);
router.post('/chat', aiLimiter, chat);
router.post('/classify', aiLimiter, classify);
router.get('/match/:requestId', authorize('customer'), matchProviders);

module.exports = router;
