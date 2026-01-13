const { body, param, query } = require('express-validator');

// Registration validation
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('mobile')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit mobile number'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    body('role')
        .optional()
        .isIn(['admin', 'pharmacist', 'cashier', 'manager']).withMessage('Invalid role')
];

// Login validation
const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
];

// Email verification
const verifyEmailValidation = [
    query('token')
        .notEmpty().withMessage('Verification token is required')
];

// Mobile OTP verification
const verifyMobileValidation = [
    body('mobile')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit mobile number'),

    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

// Refresh token validation
const refreshTokenValidation = [
    body('refreshToken')
        .notEmpty().withMessage('Refresh token is required')
];

module.exports = {
    registerValidation,
    loginValidation,
    verifyEmailValidation,
    verifyMobileValidation,
    refreshTokenValidation
};
