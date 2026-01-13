const { body, param } = require('express-validator');

// Create sale validation
const createSaleValidation = [
    body('items')
        .isArray({ min: 1 }).withMessage('At least one item is required'),

    body('items.*.medicine')
        .notEmpty().withMessage('Medicine is required')
        .isMongoId().withMessage('Invalid medicine ID'),

    body('items.*.quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),

    body('customerMobile')
        .optional()
        .trim()
        .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit mobile number'),

    body('paymentMethod')
        .optional()
        .isIn(['cash', 'card', 'esewa', 'khalti', 'mobile-payment', 'credit']).withMessage('Invalid payment method'),

    body('discountPercentage')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Discount percentage must be between 0 and 100'),

    body('prescription')
        .optional()
        .isMongoId().withMessage('Invalid prescription ID')
];

// Refund validation
const refundValidation = [
    param('id')
        .isMongoId().withMessage('Invalid invoice ID'),

    body('refundAmount')
        .notEmpty().withMessage('Refund amount is required')
        .isFloat({ min: 0 }).withMessage('Refund amount must be positive'),

    body('refundReason')
        .trim()
        .notEmpty().withMessage('Refund reason is required')
];

module.exports = {
    createSaleValidation,
    refundValidation
};
