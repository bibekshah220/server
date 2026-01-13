const twilio = require('twilio');

let twilioClient = null;

// Only initialize Twilio if credentials are provided
// Twilio Account SID must start with 'AC'
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (accountSid && authToken && accountSid.startsWith('AC')) {
    try {
        twilioClient = twilio(accountSid, authToken);
        console.log('✅ Twilio SMS client initialized');
    } catch (error) {
        console.error('❌ Twilio initialization failed:', error.message);
        console.warn('⚠️  SMS functionality will be disabled.');
    }
} else {
    console.warn('⚠️  Twilio credentials not found or invalid. SMS functionality will be disabled.');
}

module.exports = {
    client: twilioClient,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
};
