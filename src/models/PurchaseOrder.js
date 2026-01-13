const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
    poNumber: {
        type: String,
        required: true,
        unique: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'Supplier is required']
    },

    // Order Items
    items: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: true
        },
        batchNumber: String,
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1']
        },
        unitPrice: {
            type: Number,
            required: true,
            min: [0, 'Unit price cannot be negative']
        },
        expiryDate: Date,
        subtotal: {
            type: Number,
            required: true
        },
        // Received information
        receivedQuantity: {
            type: Number,
            default: 0,
            min: [0, 'Received quantity cannot be negative']
        },
        damagedQuantity: {
            type: Number,
            default: 0,
            min: [0, 'Damaged quantity cannot be negative']
        }
    }],

    // Pricing
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
    },
    tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative']
    },
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative']
    },

    // Dates
    orderDate: {
        type: Date,
        default: Date.now
    },
    expectedDeliveryDate: {
        type: Date
    },
    receivedDate: {
        type: Date
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'partially-received', 'received', 'cancelled'],
        default: 'pending'
    },

    // Invoice Matching
    supplierInvoiceNumber: {
        type: String,
        trim: true
    },
    supplierInvoiceDate: {
        type: Date
    },

    // Payment
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'paid'],
        default: 'pending'
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: [0, 'Paid amount cannot be negative']
    },

    notes: {
        type: String,
        trim: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Auto-generate PO number
purchaseOrderSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await mongoose.model('PurchaseOrder').countDocuments();
        const year = new Date().getFullYear();
        this.poNumber = `PO-${year}-${(count + 1).toString().padStart(6, '0')}`;
    }
    next();
});

// Calculate totals before saving
purchaseOrderSchema.pre('save', function (next) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.totalAmount = this.subtotal + this.tax;
    next();
});

// Indexes
// Note: poNumber already has unique index from unique: true
purchaseOrderSchema.index({ supplier: 1 });
purchaseOrderSchema.index({ orderDate: -1 });
purchaseOrderSchema.index({ status: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
