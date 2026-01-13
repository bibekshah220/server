const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    action: {
        type: String,
        required: [true, 'Action is required'],
        enum: [
            'create', 'read', 'update', 'delete',
            'login', 'logout',
            'register', 'verify-email', 'verify-mobile',
            'sale', 'refund',
            'stock-adjustment',
            'prescription-upload',
            'purchase-order'
        ]
    },
    resourceType: {
        type: String,
        required: [true, 'Resource type is required'],
        enum: [
            'user', 'medicine', 'inventory',
            'prescription', 'sale', 'supplier',
            'purchase-order', 'auth'
        ]
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    details: {
        method: String,
        path: String,
        query: mongoose.Schema.Types.Mixed,
        body: mongoose.Schema.Types.Mixed,
        ip: String,
        userAgent: String,
        beforeData: mongoose.Schema.Types.Mixed,
        afterData: mongoose.Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false // We're using custom timestamp field
});

// Indexes for efficient querying
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, timestamp: -1 });
auditLogSchema.index({ resourceId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// TTL index to automatically delete old logs after 2 years (optional)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

module.exports = mongoose.model('AuditLog', auditLogSchema);
