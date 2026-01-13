const express = require('express');
const router = express.Router();
const {
    upload,
    uploadPrescription,
    getPrescriptions,
    getPrescription,
    validatePrescription,
    dispensePrescription
} = require('../controllers/prescriptionController');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/rbac');
const auditLog = require('../middlewares/auditLog');

// All routes require authentication
router.use(auth);

// Upload prescription (with file)
router.post('/', upload.single('prescriptionFile'), auditLog('prescription-upload', 'prescription'), uploadPrescription);

// Read routes
router.get('/', getPrescriptions);
router.get('/:id', getPrescription);
router.get('/:id/validate', validatePrescription);

// Dispense route (Pharmacist only)
router.put('/:id/dispense', checkRole('pharmacist', 'admin', 'manager'), auditLog('update', 'prescription'), dispensePrescription);

module.exports = router;
