const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Middleware to log critical actions
 * @param {string} action - Action being performed
 * @param {string} resourceType - Type of resource being acted upon
 */
const auditLog = (action, resourceType) => {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json;

        // Override res.json to capture response
        res.json = function (data) {
            // Only log successful operations
            if (data.success !== false && res.statusCode < 400) {
                const logData = {
                    user: req.user?._id,
                    action,
                    resourceType,
                    resourceId: data.data?._id || req.params.id || null,
                    details: {
                        method: req.method,
                        path: req.path,
                        query: req.query,
                        body: sanitizeBody(req.body),
                        ip: req.ip || req.connection.remoteAddress
                    },
                    timestamp: new Date()
                };

                // Log asynchronously without blocking response
                AuditLog.create(logData).catch(err => {
                    logger.error('Failed to create audit log:', err);
                });
            }

            // Call original json method
            return originalJson.call(this, data);
        };

        next();
    };
};

/**
 * Remove sensitive data from body before logging
 */
const sanitizeBody = (body) => {
    if (!body) return {};

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'confirmPassword', 'token', 'otp'];

    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });

    return sanitized;
};

module.exports = auditLog;
