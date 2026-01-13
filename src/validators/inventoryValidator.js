const { body, param } = require('express-validator');

// Add inventory validation
const addInventoryValidation = [
    body('medicine')
        .notEmpty().withMessage('Medicine reference is required')
        .isMongoId().withMessage('Invalid medicine ID'),

    body('batchNumber')
        .trim()
        .notEmpty().withMessage('Batch number is required'),

    body('manufacturingDate')
        .notEmpty().withMessage('Manufacturing date is required')
        .isISO8601().withMessage('Invalid manufacturing date format')
        .custom((value, { req }) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(value) > today) {
                throw new Error('Manufacturing date cannot be in the future');
            }
            return true;
        }),

    body('expiryDate')
        .notEmpty().withMessage('Expiry date is required')
        .isISO8601().withMessage('Invalid expiry date format')
        .custom((value, { req }) => {
            if (req.body.manufacturingDate && new Date(value) <= new Date(req.body.manufacturingDate)) {
                throw new Error('Expiry date must be after manufacturing date');
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(value) <= today) {
                throw new Error('Expiry date must be in the future');
            }
            return true;
        }),

    body('quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),

    body('purchasePrice')
        .notEmpty().withMessage('Purchase price is required')
        .isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),

    body('sellingPrice')
        .notEmpty().withMessage('Selling price is required')
        .isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),

    body('supplier')
        .optional()
        .isMongoId().withMessage('Invalid supplier ID')
];

// Stock adjustment validation
const stockAdjustmentValidation = [
    param('id')
        .isMongoId().withMessage('Invalid inventory ID'),

    body('adjustment')
        .notEmpty().withMessage('Adjustment value is required')
        .isInt().withMessage('Adjustment must be an integer'),

    body('reason')
        .trim()
        .notEmpty().withMessage('Reason for adjustment is required')
];

module.exports = {
    addInventoryValidation,
    stockAdjustmentValidation
};
