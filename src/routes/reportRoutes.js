const express = require('express');
const router = express.Router();
const {
    getDailySalesReport,
    getMonthlySalesReport,
    getInventoryValuation,
    getExpiredStockReport,
    getProfitLossSummary,
    getAuditLogs
} = require('../controllers/reportController');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/rbac');

// All routes require authentication
router.use(auth);

// Sales reports - Cashiers can view their own sales, others can view all
router.get('/daily-sales', getDailySalesReport);
router.get('/monthly-sales', getMonthlySalesReport);

// Inventory reports (Admin, Manager, Pharmacist only)
router.get('/inventory-valuation', checkRole('admin', 'manager', 'pharmacist'), getInventoryValuation);
router.get('/expired-stock', checkRole('admin', 'manager', 'pharmacist'), getExpiredStockReport);

// Financial reports (Admin, Manager only)
router.get('/profit-loss', checkRole('admin', 'manager'), getProfitLossSummary);

// Audit logs (Admin only)
router.get('/audit-logs', checkRole('admin'), getAuditLogs);

module.exports = router;
