const mongoose = require('mongoose');

const saleInvoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: false, // Will be generated in pre-save hook
        unique: true,
        sparse: true
    },

    // Pharmacy Information (Nepal Compliance)
    pharmacyName: {
        type: String,
        default: process.env.PHARMACY_NAME || 'PharmaNP Pharmacy'
    },
    pharmacyPAN: {
        type: String,
        default: process.env.PHARMACY_PAN || ''
    },
    pharmacyAddress: {
        type: String,
        default: process.env.PHARMACY_ADDRESS || ''
    },
    pharmacyPhone: {
        type: String,
        default: process.env.PHARMACY_PHONE || ''
    },

    // Customer Information
    customerName: {
        type: String,
        trim: true
    },
    customerMobile: {
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
    },
    customerAddress: {
        type: String,
        trim: true
    },

    // Sale Items
    items: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: true
        },
        inventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
            required: true
        },
        batchNumber: {
            type: String,
            required: true
        },
        manufacturingDate: {
            type: Date,
            required: true
        },
        expiryDate: {
            type: Date,
            required: true
        },
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
        subtotal: {
            type: Number,
            required: true,
            min: [0, 'Subtotal cannot be negative']
        }
    }],

    // Pricing
    subtotal: {
        type: Number,
        required: false, // Calculated in pre-save hook or service
        default: 0,
        min: [0, 'Subtotal cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    discountPercentage: {
        type: Number,
        default: 0,
        min: [0, 'Discount percentage cannot be negative'],
        max: [100, 'Discount percentage cannot exceed 100']
    },
    vatRate: {
        type: Number,
        required: false,
        default: 13 // Nepal VAT rate
    },
    vatAmount: {
        type: Number,
        required: false, // Calculated in pre-save hook or service
        default: 0,
        min: [0, 'VAT amount cannot be negative']
    },
    totalAmount: {
        type: Number,
        required: false, // Calculated in pre-save hook or service
        default: 0,
        min: [0, 'Total amount cannot be negative']
    },

    // Payment Information
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'esewa', 'khalti', 'mobile-payment', 'credit'],
        default: 'cash'
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'partial', 'pending'],
        default: 'paid'
    },
    amountPaid: {
        type: Number,
        min: [0, 'Amount paid cannot be negative'],
        default: 0
    },
    amountDue: {
        type: Number,
        min: [0, 'Amount due cannot be negative'],
        default: 0
    },

    // Prescription Reference
    prescription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
    },

    // Cashier Information
    cashier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Status
    status: {
        type: String,
        enum: ['completed', 'refunded', 'partially-refunded'],
        default: 'completed'
    },

    // Refund Information
    refundAmount: {
        type: Number,
        default: 0,
        min: [0, 'Refund amount cannot be negative']
    },
    refundReason: {
        type: String,
        trim: true
    },
    refundDate: {
        type: Date
    },

    notes: {
        type: String,
        trim: true
    },

    saleDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Auto-generate invoice number
saleInvoiceSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await mongoose.model('SaleInvoice').countDocuments();
        const year = new Date().getFullYear();
        this.invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(6, '0')}`;
    }
    next();
});

// Calculate amounts before saving
saleInvoiceSchema.pre('save', function (next) {
    // Calculate subtotal from items
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);

    // Calculate discount
    if (this.discountPercentage > 0) {
        this.discount = (this.subtotal * this.discountPercentage) / 100;
    }

    // Calculate VAT
    const amountAfterDiscount = this.subtotal - this.discount;
    this.vatAmount = (amountAfterDiscount * this.vatRate) / 100;

    // Calculate total
    this.totalAmount = amountAfterDiscount + this.vatAmount;

    // Calculate amount due
    this.amountDue = this.totalAmount - this.amountPaid;

    next();
});

// Indexes
// Note: invoiceNumber already has unique index from unique: true
saleInvoiceSchema.index({ customerMobile: 1 });
saleInvoiceSchema.index({ cashier: 1 });
saleInvoiceSchema.index({ saleDate: -1 });

module.exports = mongoose.model('SaleInvoice', saleInvoiceSchema);
