const express = require('express');
const router = express.Router();
const {
    createMedicine,
    getMedicines,
    getMedicine,
    updateMedicine,
    deleteMedicine,
    searchByBarcode
} = require('../controllers/medicineController');
const {
    createMedicineValidation,
    updateMedicineValidation,
    getMedicineValidation
} = require('../validators/medicineValidator');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/rbac');
const auditLog = require('../middlewares/auditLog');

// All routes require authentication
router.use(auth);

// Block cashier from accessing medicine routes (403)
router.use((req, res, next) => {
    if (req.user && req.user.role === 'cashier') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Cashiers cannot access medicine management.'
        });
    }
    next();
});

// Read routes (Admin, Pharmacist, Manager only)
router.get('/', getMedicines);
router.get('/barcode/:barcode', searchByBarcode);
router.get('/:id', getMedicineValidation, getMedicine);

// Create/Update routes (Pharmacist, Manager, Admin)
router.post('/', checkRole('admin', 'manager', 'pharmacist'), createMedicineValidation, auditLog('create', 'medicine'), createMedicine);
router.put('/:id', checkRole('admin', 'manager', 'pharmacist'), updateMedicineValidation, auditLog('update', 'medicine'), updateMedicine);

// Delete route (Admin only)
router.delete('/:id', checkRole('admin'), auditLog('delete', 'medicine'), deleteMedicine);

module.exports = router;
