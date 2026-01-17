const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const saleRoutes = require('./routes/saleRoutes');
const billingRoutes = require('./routes/billingRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const customerRoutes = require('./routes/customerRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Initialize express app
const app = express();

// Connect to MongoDB (don't crash on failure - allows /health to work; DB routes will fail until connected)
connectDB().catch(err => logger.error('Database connection failed:', err.message));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:8080',
            'http://localhost:3000',
            'http://localhost:5173',
            process.env.FRONTEND_URL,
            // Allow all Vercel preview and production deployments
            /^https:\/\/.*\.vercel\.app$/,
            process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
        ].filter(Boolean);
        
        // Check if origin matches any allowed origin (including regex patterns)
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return allowedOrigin === origin;
            } else if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return false;
        });
        
        if (isAllowed || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging with Morgan (only in development)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Morgan combined format for production logging
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// Shared root/health response handlers (used for both / and /api paths - Vercel may use /api prefix)
const rootResponse = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Pharmacy Management API',
        version: '1.0',
        endpoints: { health: '/health', api: '/api' },
        timestamp: new Date().toISOString()
    });
};
const healthResponse = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
};

// Root and /api (Vercel often mounts api/index.js at /api, so /api or /api/ gets root)
app.get('/', rootResponse);
app.get('/api', rootResponse);
app.get('/api/', rootResponse);

// Health - try /health and /api/health
app.get('/health', healthResponse);
app.get('/api/health', healthResponse);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler (include requested path to help debug routing)
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        requested: { path: req.path, url: req.url, method: req.method }
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
