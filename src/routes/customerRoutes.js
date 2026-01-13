const express = require('express');
const router = express.Router();
const {
    createCustomer,
    getCustomers,
    getCustomer,
    getCustomerByMobile,
    updateCustomer,
    deleteCustomer,
    updateCustomerStats,
    getTopCustomers
} = require('../controllers/customerController');
const {
    createCustomerValidation,
    updateCustomerValidation,
    getCustomerValidation,
    getCustomerByMobileValidation
} = require('../validators/customerValidator');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/rbac');
const auditLog = require('../middlewares/auditLog');

// All routes require authentication
router.use(auth);

// Read routes (all authenticated users)
router.get('/', getCustomers);
router.get('/top', getTopCustomers);
router.get('/mobile/:mobile', getCustomerByMobileValidation, getCustomerByMobile);
router.get('/:id', getCustomerValidation, getCustomer);

// Create route (Admin, Pharmacist, Manager)
router.post('/', checkRole('admin', 'manager', 'pharmacist'), createCustomerValidation, auditLog('create', 'customer'), createCustomer);

// Update route (Admin, Pharmacist, Manager)
router.put('/:id', checkRole('admin', 'manager', 'pharmacist'), updateCustomerValidation, auditLog('update', 'customer'), updateCustomer);

// Delete route (Admin only)
router.delete('/:id', checkRole('admin'), auditLog('delete', 'customer'), deleteCustomer);

// Update stats route
router.post('/:id/update-stats', getCustomerValidation, updateCustomerStats);

module.exports = router;

