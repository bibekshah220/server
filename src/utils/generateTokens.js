const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Generate access and refresh tokens for a user
 * @param {Object} payload - User data to encode in token
 * @returns {Object} - Object containing accessToken and refreshToken
 */
const generateTokens = (payload) => {
    const accessToken = jwt.sign(payload, jwtConfig.accessToken.secret, {
        expiresIn: jwtConfig.accessToken.expiresIn
    });

    const refreshToken = jwt.sign(payload, jwtConfig.refreshToken.secret, {
        expiresIn: jwtConfig.refreshToken.expiresIn
    });

    return {
        accessToken,
        refreshToken
    };
};

module.exports = generateTokens;
