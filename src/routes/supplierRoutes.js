const express = require('express');
const router = express.Router();
const {
    createSupplier,
    getSuppliers,
    getSupplier,
    updateSupplier,
    deleteSupplier
} = require('../controllers/supplierController');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/rbac');
const auditLog = require('../middlewares/auditLog');

// All routes require authentication
router.use(auth);

// Read routes (all authenticated users)
router.get('/', getSuppliers);
router.get('/:id', getSupplier);

// Create/Update routes (Manager, Admin)
router.post('/', checkRole('admin', 'manager'), auditLog('create', 'supplier'), createSupplier);
router.put('/:id', checkRole('admin', 'manager'), auditLog('update', 'supplier'), updateSupplier);

// Delete route (Admin only)
router.delete('/:id', checkRole('admin'), auditLog('delete', 'supplier'), deleteSupplier);

module.exports = router;
