const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name must not exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: true,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['admin', 'pharmacist', 'cashier', 'manager'],
        default: 'cashier'
    },



    // Mobile verification fields
    isMobileVerified: {
        type: Boolean,
        default: false
    },
    mobileOTP: {
        type: String,
        default: null
    },
    mobileOTPExpiry: {
        type: Date,
        default: null
    },

    // Refresh token
    refreshToken: {
        type: String,
        default: null
    },

    // Account status
    isActive: {
        type: Boolean,
        default: true
    },

    // Password reset
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpiry: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes for performance
// Note: email and mobile already have unique indexes from unique: true
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
