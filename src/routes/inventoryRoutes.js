const express = require('express');
const router = express.Router();
const {
    addInventory,
    getInventory,
    getInventoryItem,
    updateInventory,
    stockAdjustment,
    getExpired,
    getNearingExpiry,
    getLowStock
} = require('../controllers/inventoryController');
const {
    addInventoryValidation,
    stockAdjustmentValidation
} = require('../validators/inventoryValidator');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/rbac');
const auditLog = require('../middlewares/auditLog');

// All routes require authentication
router.use(auth);

// Block cashier from accessing inventory routes (403)
router.use((req, res, next) => {
    if (req.user && req.user.role === 'cashier') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Cashiers cannot access inventory management.'
        });
    }
    next();
});

// Alert routes (Admin, Pharmacist, Manager only)
router.get('/alerts/expired', getExpired);
router.get('/alerts/nearing-expiry', getNearingExpiry);
router.get('/alerts/low-stock', getLowStock);

// Read routes
router.get('/', getInventory);
router.get('/:id', getInventoryItem);

// Create/Update routes (Pharmacist, Manager, Admin)
router.post('/', checkRole('admin', 'manager', 'pharmacist'), addInventoryValidation, auditLog('create', 'inventory'), addInventory);
router.put('/:id', checkRole('admin', 'manager', 'pharmacist'), auditLog('update', 'inventory'), updateInventory);
router.post('/:id/adjust', checkRole('admin', 'manager', 'pharmacist'), stockAdjustmentValidation, auditLog('stock-adjustment', 'inventory'), stockAdjustment);

module.exports = router;
