const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist (skip on Vercel - read-only filesystem)
const logsDir = path.join(__dirname, '..', 'logs');
if (!process.env.VERCEL && !fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// On Vercel: use Console only (no file writes - serverless has read-only filesystem)
// Elsewhere: use File transports, and add Console in development
const transports = process.env.VERCEL
    ? [new winston.transports.Console({ format: consoleFormat })]
    : [
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ];

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports
});

// Add console transport in development (when not on Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

module.exports = logger;
