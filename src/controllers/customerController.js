const Customer = require('../models/Customer');
const SaleInvoice = require('../models/SaleInvoice');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * @desc    Create customer
 * @route   POST /api/customers
 * @access  Private (Admin, Pharmacist, Manager)
 */
const createCustomer = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Check if customer with same mobile already exists
        const existingCustomer = await Customer.findOne({ mobile: req.body.mobile });
        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: 'Customer with this mobile number already exists'
            });
        }

        const customer = new Customer({
            ...req.body,
            createdBy: req.user._id
        });

        await customer.save();

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: customer
        });
    } catch (error) {
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Customer with this ${field} already exists`
            });
        }
        next(error);
    }
};

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 * @access  Private
 */
const getCustomers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, status } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const customers = await Customer.find(filter)
            .populate('createdBy', 'name email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ lastPurchaseDate: -1, createdAt: -1 });

        const count = await Customer.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: customers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single customer
 * @route   GET /api/customers/:id
 * @access  Private
 */
const getCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Get customer's purchase history
        const sales = await SaleInvoice.find({ customerMobile: customer.mobile })
            .select('invoiceNumber saleDate totalAmount paymentMethod items')
            .populate('items.medicine', 'name genericName')
            .sort({ saleDate: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                ...customer.toObject(),
                purchaseHistory: sales
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get customer by mobile
 * @route   GET /api/customers/mobile/:mobile
 * @access  Private
 */
const getCustomerByMobile = async (req, res, next) => {
    try {
        const customer = await Customer.findOne({ mobile: req.params.mobile })
            .populate('createdBy', 'name email');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update customer
 * @route   PUT /api/customers/:id
 * @access  Private (Admin, Pharmacist, Manager)
 */
const updateCustomer = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Check if mobile is being updated and if it conflicts
        if (req.body.mobile) {
            const existingCustomer = await Customer.findOne({
                mobile: req.body.mobile,
                _id: { $ne: req.params.id }
            });
            if (existingCustomer) {
                return res.status(400).json({
                    success: false,
                    message: 'Customer with this mobile number already exists'
                });
            }
        }

        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            data: customer
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Customer with this ${field} already exists`
            });
        }
        next(error);
    }
};

/**
 * @desc    Delete customer
 * @route   DELETE /api/customers/:id
 * @access  Private (Admin only)
 */
const deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check if customer has any sales
        const salesCount = await SaleInvoice.countDocuments({ customerMobile: customer.mobile });
        if (salesCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete customer with purchase history. Consider deactivating instead.'
            });
        }

        await Customer.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update customer statistics from sales
 * @route   POST /api/customers/:id/update-stats
 * @access  Private
 */
const updateCustomerStats = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        await customer.updateStats();

        res.status(200).json({
            success: true,
            message: 'Customer statistics updated successfully',
            data: customer
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get top customers
 * @route   GET /api/customers/top
 * @access  Private
 */
const getTopCustomers = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        const customers = await Customer.find({ status: 'active' })
            .sort({ totalSpent: -1, totalPurchases: -1 })
            .limit(parseInt(limit))
            .select('name mobile email totalPurchases totalSpent lastPurchaseDate');

        res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCustomer,
    getCustomers,
    getCustomer,
    getCustomerByMobile,
    updateCustomer,
    deleteCustomer,
    updateCustomerStats,
    getTopCustomers
};

