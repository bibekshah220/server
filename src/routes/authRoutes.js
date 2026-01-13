const express = require('express');
const router = express.Router();
const {
    register,
    verifyMobile,
    login,
    refreshToken,
    logout,
    resendOTP
} = require('../controllers/authController');
const {
    registerValidation,
    loginValidation,
    verifyMobileValidation,
    refreshTokenValidation
} = require('../validators/authValidator');
const auth = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const auditLog = require('../middlewares/auditLog');

// Public routes
router.post('/register', authLimiter, registerValidation, auditLog('register', 'auth'), register);

router.post('/verify-mobile', authLimiter, verifyMobileValidation, auditLog('verify-mobile', 'auth'), verifyMobile);
router.post('/login', authLimiter, loginValidation, auditLog('login', 'auth'), login);
router.post('/refresh-token', refreshTokenValidation, refreshToken);
router.post('/resend-otp', authLimiter, resendOTP);

// Protected routes
router.post('/logout', auth, auditLog('logout', 'auth'), logout);

module.exports = router;
