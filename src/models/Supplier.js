const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Supplier name is required'],
        trim: true,
        unique: true
    },
    contactPerson: {
        type: String,
        required: [true, 'Contact person is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: {
            type: String,
            default: 'Nepal'
        },
        postalCode: String
    },
    taxId: {
        type: String,
        trim: true
    },
    paymentTerms: {
        type: String,
        enum: ['cash', 'credit-7', 'credit-15', 'credit-30', 'credit-60'],
        default: 'cash'
    },
    creditLimit: {
        type: Number,
        default: 0,
        min: [0, 'Credit limit cannot be negative']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
// Note: name already has unique index from unique: true
supplierSchema.index({ mobile: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
