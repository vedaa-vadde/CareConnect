const express = require('express');
const router = express.Router();
const { submitQuote, getQuotesForRequest, getMyQuotes, updateQuote, withdrawQuote, generateInstantQuote } = require('../controllers/quote.controller');
const { protect, requireApprovedProvider } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.post('/', authorize('provider'), requireApprovedProvider, submitQuote);
router.post('/generate-instant', authorize('customer'), generateInstantQuote);
router.get('/my-quotes', authorize('provider'), getMyQuotes);
router.get('/request/:requestId', getQuotesForRequest);
router.put('/:id', authorize('provider'), updateQuote);
router.delete('/:id', authorize('provider'), withdrawQuote);

module.exports = router;
