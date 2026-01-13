const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true,
        unique: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        sparse: true // Allow multiple null values
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
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', ''],
        default: ''
    },
    // Customer statistics (calculated fields)
    totalPurchases: {
        type: Number,
        default: 0,
        min: [0, 'Total purchases cannot be negative']
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: [0, 'Total spent cannot be negative']
    },
    lastPurchaseDate: {
        type: Date
    },
    // Customer preferences
    preferredPaymentMethod: {
        type: String,
        enum: ['cash', 'card', 'esewa', 'khalti', 'mobile-payment', 'credit'],
        default: 'cash'
    },
    // Medical information (for prescription tracking)
    allergies: [{
        type: String,
        trim: true
    }],
    chronicConditions: [{
        type: String,
        trim: true
    }],
    // Status
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
customerSchema.index({ mobile: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ lastPurchaseDate: -1 });

// Virtual for full address
customerSchema.virtual('fullAddress').get(function() {
    const addr = this.address;
    if (!addr) return '';
    const parts = [addr.street, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
    return parts.join(', ');
});

// Method to update customer statistics from sales
customerSchema.methods.updateStats = async function() {
    const SaleInvoice = mongoose.model('SaleInvoice');
    const sales = await SaleInvoice.find({ customerMobile: this.mobile });
    
    this.totalPurchases = sales.length;
    this.totalSpent = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    
    if (sales.length > 0) {
        const lastSale = sales.sort((a, b) => 
            new Date(b.saleDate) - new Date(a.saleDate)
        )[0];
        this.lastPurchaseDate = lastSale.saleDate;
    }
    
    await this.save();
};

module.exports = mongoose.model('Customer', customerSchema);

