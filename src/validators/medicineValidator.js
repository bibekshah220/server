const { body, param } = require('express-validator');

// Create medicine validation
const createMedicineValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Medicine name is required'),

    body('genericName')
        .trim()
        .notEmpty().withMessage('Generic name is required'),

    body('manufacturer')
        .trim()
        .notEmpty().withMessage('Manufacturer is required'),

    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'other'])
        .withMessage('Invalid category'),

    body('dosageForm')
        .trim()
        .notEmpty().withMessage('Dosage form is required'),

    body('strength')
        .trim()
        .notEmpty().withMessage('Strength is required'),

    body('unitPrice')
        .notEmpty().withMessage('Unit price is required')
        .isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),

    body('minimumStockLevel')
        .optional()
        .isInt({ min: 0 }).withMessage('Minimum stock level must be a positive integer'),

    body('barcode')
        .optional()
        .trim(),

    body('prescriptionRequired')
        .optional()
        .isBoolean().withMessage('Prescription required must be a boolean')
];

// Update medicine validation
const updateMedicineValidation = [
    param('id')
        .isMongoId().withMessage('Invalid medicine ID'),

    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('Medicine name cannot be empty'),

    body('unitPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),

    body('status')
        .optional()
        .isIn(['active', 'inactive']).withMessage('Invalid status')
];

// Get medicine by ID validation
const getMedicineValidation = [
    param('id')
        .isMongoId().withMessage('Invalid medicine ID')
];

module.exports = {
    createMedicineValidation,
    updateMedicineValidation,
    getMedicineValidation
};
