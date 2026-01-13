const { body, param, query } = require('express-validator');

// Create customer validation
const createCustomerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Customer name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('mobile')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit mobile number'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email address'),

    body('address.street')
        .optional()
        .trim(),

    body('address.city')
        .optional()
        .trim(),

    body('address.state')
        .optional()
        .trim(),

    body('address.country')
        .optional()
        .trim(),

    body('address.postalCode')
        .optional()
        .trim(),

    body('dateOfBirth')
        .optional()
        .isISO8601().withMessage('Invalid date format'),

    body('gender')
        .optional()
        .isIn(['male', 'female', 'other', '']).withMessage('Invalid gender'),

    body('preferredPaymentMethod')
        .optional()
        .isIn(['cash', 'card', 'esewa', 'khalti', 'mobile-payment', 'credit']).withMessage('Invalid payment method'),

    body('allergies')
        .optional()
        .isArray().withMessage('Allergies must be an array'),

    body('allergies.*')
        .optional()
        .trim()
        .notEmpty().withMessage('Allergy cannot be empty'),

    body('chronicConditions')
        .optional()
        .isArray().withMessage('Chronic conditions must be an array'),

    body('chronicConditions.*')
        .optional()
        .trim()
        .notEmpty().withMessage('Chronic condition cannot be empty'),

    body('status')
        .optional()
        .isIn(['active', 'inactive']).withMessage('Invalid status'),

    body('notes')
        .optional()
        .trim()
];

// Update customer validation
const updateCustomerValidation = [
    param('id')
        .isMongoId().withMessage('Invalid customer ID'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('mobile')
        .optional()
        .trim()
        .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit mobile number'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email address'),

    body('dateOfBirth')
        .optional()
        .isISO8601().withMessage('Invalid date format'),

    body('gender')
        .optional()
        .isIn(['male', 'female', 'other', '']).withMessage('Invalid gender'),

    body('preferredPaymentMethod')
        .optional()
        .isIn(['cash', 'card', 'esewa', 'khalti', 'mobile-payment', 'credit']).withMessage('Invalid payment method'),

    body('status')
        .optional()
        .isIn(['active', 'inactive']).withMessage('Invalid status')
];

// Get customer validation
const getCustomerValidation = [
    param('id')
        .isMongoId().withMessage('Invalid customer ID')
];

// Get customer by mobile validation
const getCustomerByMobileValidation = [
    param('mobile')
        .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit mobile number')
];

module.exports = {
    createCustomerValidation,
    updateCustomerValidation,
    getCustomerValidation,
    getCustomerByMobileValidation
};

