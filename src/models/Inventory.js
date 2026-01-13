const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    medicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: [true, 'Medicine reference is required']
    },
    batchNumber: {
        type: String,
        required: [true, 'Batch number is required'],
        trim: true
    },
    manufacturingDate: {
        type: Date,
        required: [true, 'Manufacturing date is required']
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required'],
        validate: {
            validator: function(value) {
                // Expiry date must be after manufacturing date
                return value > this.manufacturingDate;
            },
            message: 'Expiry date must be after manufacturing date'
        }
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
        default: 0
    },
    purchasePrice: {
        type: Number,
        required: [true, 'Purchase price is required'],
        min: [0, 'Purchase price cannot be negative']
    },
    sellingPrice: {
        type: Number,
        required: [true, 'Selling price is required'],
        min: [0, 'Selling price cannot be negative']
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['available', 'expired', 'damaged', 'sold-out'],
        default: 'available'
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

// Compound index for medicine and batch number (unique combination)
inventorySchema.index({ medicine: 1, batchNumber: 1 }, { unique: true });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ status: 1 });

// Check if batch is expired
inventorySchema.methods.isExpired = function () {
    return new Date() > this.expiryDate;
};

// Validate manufacturing date is not in the future
inventorySchema.pre('save', function (next) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Manufacturing date should not be in the future
    if (this.manufacturingDate > today) {
        return next(new Error('Manufacturing date cannot be in the future'));
    }
    
    // Expiry date must be in the future (for available stock)
    if (this.expiryDate <= today && this.quantity > 0) {
        this.status = 'expired';
    } else if (this.quantity <= 0) {
        this.status = 'sold-out';
    } else {
        this.status = 'available';
    }
    next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
