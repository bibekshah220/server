const emailTransporter = require('../config/email');
const {
    emailVerificationTemplate,
    passwordResetTemplate,
    lowStockAlertTemplate
} = require('../utils/emailTemplates');
const logger = require('../utils/logger');

/**
 * Send email verification
 */
const sendEmailVerification = async (email, name, verificationToken) => {
    try {
        const verificationLink = `${process.env.BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Email Verification - Pharmacy Management System',
            html: emailVerificationTemplate(name, verificationLink)
        };

        await emailTransporter.sendMail(mailOptions);
        logger.info(`Verification email sent to ${email}`);
        return true;
    } catch (error) {
        logger.error('Email sending failed:', error);
        throw new Error('Failed to send verification email');
    }
};

/**
 * Send password reset email
 */
const sendPasswordReset = async (email, name, resetToken) => {
    try {
        const resetLink = `${process.env.BASE_URL}/api/auth/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Password Reset Request - Pharmacy Management System',
            html: passwordResetTemplate(name, resetLink)
        };

        await emailTransporter.sendMail(mailOptions);
        logger.info(`Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        logger.error('Password reset email failed:', error);
        throw new Error('Failed to send password reset email');
    }
};

/**
 * Send low stock alert
 */
const sendLowStockAlert = async (email, medicineName, currentStock, minimumStock) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Low Stock Alert: ${medicineName}`,
            html: lowStockAlertTemplate(medicineName, currentStock, minimumStock)
        };

        await emailTransporter.sendMail(mailOptions);
        logger.info(`Low stock alert sent for ${medicineName}`);
        return true;
    } catch (error) {
        logger.error('Low stock alert email failed:', error);
        return false; // Don't throw error for alerts
    }
};

module.exports = {
    sendEmailVerification,
    sendPasswordReset,
    sendLowStockAlert
};
