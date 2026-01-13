const express = require('express');
const router = express.Router();
const {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrder,
    receivePurchaseOrder,
    cancelPurchaseOrder
} = require('../controllers/purchaseController');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/rbac');
const auditLog = require('../middlewares/auditLog');

// All routes require authentication
router.use(auth);

// Read routes
router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrder);

// Create purchase order (Manager, Admin)
router.post('/', checkRole('admin', 'manager'), auditLog('purchase-order', 'purchase-order'), createPurchaseOrder);

// Receive purchase order (Pharmacist, Manager, Admin)
router.post('/:id/receive', checkRole('admin', 'manager', 'pharmacist'), auditLog('update', 'purchase-order'), receivePurchaseOrder);

// Cancel purchase order (Manager, Admin)
router.put('/:id/cancel', checkRole('admin', 'manager'), auditLog('update', 'purchase-order'), cancelPurchaseOrder);

module.exports = router;
