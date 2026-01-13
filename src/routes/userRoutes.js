const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    getMyProfile
} = require('../controllers/userController');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/rbac');
const auditLog = require('../middlewares/auditLog');

// Get my profile (any authenticated user)
router.get('/me', auth, getMyProfile);

// Admin only routes
router.get('/', auth, checkRole('admin'), getUsers);
router.get('/:id', auth, checkRole('admin'), getUser);
router.put('/:id', auth, checkRole('admin'), auditLog('update', 'user'), updateUser);
router.delete('/:id', auth, checkRole('admin'), auditLog('delete', 'user'), deleteUser);

module.exports = router;
