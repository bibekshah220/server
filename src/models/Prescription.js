const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    prescriptionNumber: {
        type: String,
        required: true,
        unique: true
    },

    // Patient Information
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true
    },
    patientAge: {
        type: Number,
        required: [true, 'Patient age is required'],
        min: [0, 'Age cannot be negative']
    },
    patientGender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: [true, 'Patient gender is required']
    },
    patientMobile: {
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
    },
    patientAddress: {
        type: String,
        trim: true
    },

    // Doctor Information
    doctorName: {
        type: String,
        required: [true, 'Doctor name is required'],
        trim: true
    },
    doctorRegistrationNumber: {
        type: String,
        required: [true, 'Doctor registration number is required'],
        trim: true
    },
    doctorSpecialization: {
        type: String,
        trim: true
    },

    // Prescription File
    prescriptionFile: {
        filename: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },

    // Prescribed Medicines
    medicines: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine'
        },
        dosage: String,
        duration: String,
        instructions: String
    }],

    // Prescription Dates
    prescriptionDate: {
        type: Date,
        required: [true, 'Prescription date is required'],
        default: Date.now
    },
    validUntil: {
        type: Date,
        required: [true, 'Validity date is required']
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'partially-dispensed', 'fully-dispensed', 'expired'],
        default: 'pending'
    },

    // Dispensing Information
    dispensedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dispensedDate: {
        type: Date
    },

    // Related Sales
    sales: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SaleInvoice'
    }],

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

// Auto-generate prescription number
prescriptionSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await mongoose.model('Prescription').countDocuments();
        this.prescriptionNumber = `PRX-${Date.now()}-${(count + 1).toString().padStart(5, '0')}`;
    }
    next();
});

// Check if prescription is valid
prescriptionSchema.methods.isValid = function () {
    return new Date() <= this.validUntil && this.status !== 'expired';
};

// Indexes
// Note: prescriptionNumber already has unique index from unique: true
prescriptionSchema.index({ patientMobile: 1 });
prescriptionSchema.index({ doctorRegistrationNumber: 1 });
prescriptionSchema.index({ prescriptionDate: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
