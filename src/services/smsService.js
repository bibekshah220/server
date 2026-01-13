const { client, phoneNumber } = require('../config/sms');
const logger = require('../utils/logger');

/**
 * Send OTP via SMS
 */
const sendOTP = async (mobile, otp) => {
    try {
        if (!client) {
            logger.warn('Twilio client not initialized. Skipping SMS send.');
            // In development, log OTP to console
            if (process.env.NODE_ENV === 'development') {
                console.log(`\n📱 SMS OTP for ${mobile}: ${otp}\n`);
                return true;
            }
            throw new Error('SMS service not configured');
        }

        const message = `Your OTP for Pharmacy Management System is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. Do not share this code.`;

        await client.messages.create({
            body: message,
            from: phoneNumber,
            to: `+977${mobile}` // Nepal country code
        });

        logger.info(`OTP sent to ${mobile}`);
        return true;
    } catch (error) {
        logger.error('SMS sending failed:', error);

        // In development, still log OTP even if sending fails
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n📱 SMS Failed - OTP for ${mobile}: ${otp}\n`);
            return true;
        }

        throw new Error('Failed to send OTP');
    }
};

/**
 * Send general SMS notification
 */
const sendSMS = async (mobile, message) => {
    try {
        if (!client) {
            logger.warn('Twilio client not initialized. Skipping SMS send.');
            if (process.env.NODE_ENV === 'development') {
                console.log(`\n📱 SMS for ${mobile}: ${message}\n`);
                return true;
            }
            return false;
        }

        await client.messages.create({
            body: message,
            from: phoneNumber,
            to: `+977${mobile}` // Nepal country code
        });

        logger.info(`SMS sent to ${mobile}`);
        return true;
    } catch (error) {
        logger.error('SMS sending failed:', error);
        return false; // Don't throw for general notifications
    }
};

module.exports = {
    sendOTP,
    sendSMS
};
