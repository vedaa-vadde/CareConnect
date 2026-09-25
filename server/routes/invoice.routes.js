const express = require('express');
const router = express.Router();
const { getOrCreateInvoice, getInvoiceById, getMyInvoices } = require('../controllers/invoice.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', getMyInvoices);
router.get('/:id', getInvoiceById);
router.post('/booking/:bookingId', getOrCreateInvoice);

module.exports = router;
