const User = require("../models/User");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const otpGenerator = require("otp-generator");

const { sendOTP } = require("../services/smsService");
const generateTokens = require("../utils/generateTokens");
const jwtConfig = require("../config/jwt");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const register = async (req, res, next) => {
  try {
    // Validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, email, mobile, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or mobile already exists",
      });
    }

    // Generate mobile OTP
    const mobileOTP = otpGenerator.generate(
      parseInt(process.env.OTP_LENGTH) || 6,
      {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      }
    );
    const mobileOTPExpiry = new Date(
      Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000
    );

    // Create user
    const user = new User({
      name,
      email,
      mobile,
      password, // Will be hashed by pre-save middleware
      role: role || "cashier",
      mobileOTP,
      mobileOTPExpiry,
    });

    await user.save();

    // Send OTP SMS
    try {
      await sendOTP(mobile, mobileOTP);
    } catch (smsError) {
      logger.error("Failed to send OTP:", smsError);
    }

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your mobile number with the OTP sent.",
      data: {
        userId: user._id,
        email: user.email,
        mobile: user.mobile,
        isMobileVerified: user.isMobileVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { token } = req.query;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

const verifyMobile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { mobile, otp } = req.body;

    const user = await User.findOne({
      mobile,
      mobileOTP: otp,
      mobileOTPExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.isMobileVerified = true;
    user.mobileOTP = null;
    user.mobileOTPExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Mobile number verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Please contact administrator.",
      });
    }

    // Generate tokens
    const tokens = generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(token, jwtConfig.refreshToken.secret);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

const resendOTP = async (req, res, next) => {
  try {
    const { mobile } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isMobileVerified) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already verified",
      });
    }

    // Generate new OTP
    const mobileOTP = otpGenerator.generate(
      parseInt(process.env.OTP_LENGTH) || 6,
      {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      }
    );
    const mobileOTPExpiry = new Date(
      Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000
    );

    user.mobileOTP = mobileOTP;
    user.mobileOTPExpiry = mobileOTPExpiry;
    await user.save();

    // Send OTP
    await sendOTP(mobile, mobileOTP);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyMobile,
  login,
  refreshToken,
  logout,
  resendOTP,
};
