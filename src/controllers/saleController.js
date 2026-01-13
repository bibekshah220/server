const SaleInvoice = require('../models/SaleInvoice');
const { validationResult } = require('express-validator');
const { createSaleInvoice, processRefund } = require('../services/invoiceService');

/**
 * @desc    Create sale
 * @route   POST /api/sales
 * @access  Private (Cashier, Pharmacist)
 */
const createSale = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const invoice = await createSaleInvoice(req.body, req.user._id);

        res.status(201).json({
            success: true,
            message: 'Sale created successfully',
            data: invoice
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all sales
 * @route   GET /api/sales
 * @access  Private
 */
const getSales = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, startDate, endDate, customerMobile } = req.query;

        const filter = {};
        
        // Cashiers can only see their own sales
        if (req.user.role === 'cashier') {
            filter.cashier = req.user._id;
        }
        
        if (status) filter.status = status;
        if (customerMobile) filter.customerMobile = customerMobile;
        if (startDate || endDate) {
            filter.saleDate = {};
            if (startDate) filter.saleDate.$gte = new Date(startDate);
            if (endDate) filter.saleDate.$lte = new Date(endDate);
        }

        const sales = await SaleInvoice.find(filter)
            .populate('items.medicine')
            .populate('cashier', 'name email')
            .populate('prescription')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ saleDate: -1 });

        const count = await SaleInvoice.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: sales,
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
 * @desc    Get single sale
 * @route   GET /api/sales/:id
 * @access  Private
 */
const getSale = async (req, res, next) => {
    try {
        const sale = await SaleInvoice.findById(req.params.id)
            .populate('items.medicine')
            .populate('items.inventory')
            .populate('cashier', 'name email')
            .populate('prescription');

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        res.status(200).json({
            success: true,
            data: sale
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Process refund
 * @route   POST /api/sales/:id/refund
 * @access  Private (Manager, Admin)
 */
const refund = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { refundAmount, refundReason } = req.body;
        const invoice = await processRefund(req.params.id, refundAmount, refundReason);

        res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            data: invoice
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get sales by date range
 * @route   GET /api/sales/reports/date-range
 * @access  Private
 */
const getSalesByDateRange = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const sales = await SaleInvoice.find({
            saleDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            status: { $ne: 'refunded' }
        });

        const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalVAT = sales.reduce((sum, sale) => sum + sale.vatAmount, 0);
        const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);

        res.status(200).json({
            success: true,
            data: {
                sales,
                summary: {
                    totalInvoices: sales.length,
                    totalSales,
                    totalVAT,
                    totalDiscount,
                    netSales: totalSales - totalDiscount
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSale,
    getSales,
    getSale,
    refund,
    getSalesByDateRange
};
