const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Medicine name is required'],
        trim: true,
        unique: true
    },
    genericName: {
        type: String,
        required: [true, 'Generic name is required'],
        trim: true
    },
    manufacturer: {
        type: String,
        required: [true, 'Manufacturer is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'other']
    },
    dosageForm: {
        type: String,
        required: [true, 'Dosage form is required'],
        trim: true
    },
    strength: {
        type: String,
        required: [true, 'Strength is required'],
        trim: true
    },
    barcode: {
        type: String,
        trim: true,
        unique: true,
        sparse: true // Allow multiple null values
    },
    prescriptionRequired: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        trim: true
    },
    sideEffects: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
// Note: name and barcode already have unique indexes from unique: true
medicineSchema.index({ genericName: 1 });
medicineSchema.index({ category: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
