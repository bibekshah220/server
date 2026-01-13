const express = require('express');
const router = express.Router();
const {
    createSale,
    getSales,
    getSale,
    refund,
    getSalesByDateRange
} = require('../controllers/saleController');
const {
    createSaleValidation,
    refundValidation
} = require('../validators/saleValidator');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/rbac');
const auditLog = require('../middlewares/auditLog');

// All routes require authentication
router.use(auth);

// Create sale (Cashier, Pharmacist)
router.post('/', checkRole('cashier', 'pharmacist', 'admin', 'manager'), createSaleValidation, auditLog('sale', 'sale'), createSale);

// Read routes
router.get('/', getSales);
router.get('/reports/date-range', getSalesByDateRange);
router.get('/:id', getSale);

// Refund route (Manager, Admin only)
router.post('/:id/refund', checkRole('admin', 'manager'), refundValidation, auditLog('refund', 'sale'), refund);

module.exports = router;
