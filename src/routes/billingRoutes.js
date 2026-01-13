const express = require('express');
const router = express.Router();
const {
    searchMedicines,
    getMedicineBatches
} = require('../controllers/billingController');
const auth = require('../middlewares/auth');

// All routes require authentication
router.use(auth);

// Billing routes (Cashier, Pharmacist, Admin, Manager can access)
router.get('/medicines/search', searchMedicines);
router.get('/medicines/:id/batches', getMedicineBatches);

module.exports = router;

