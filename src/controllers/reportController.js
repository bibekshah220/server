const SaleInvoice = require('../models/SaleInvoice');
const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const AuditLog = require('../models/AuditLog');

/**
 * @desc    Get daily sales report
 * @route   GET /api/reports/daily-sales
 * @access  Private (Manager, Admin)
 */
const getDailySalesReport = async (req, res, next) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();

        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const filter = {
            saleDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'refunded' }
        };

        // Cashiers can only see their own sales
        if (req.user.role === 'cashier') {
            filter.cashier = req.user._id;
        }

        const sales = await SaleInvoice.find(filter).populate('cashier', 'name');

        const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalVAT = sales.reduce((sum, sale) => sum + sale.vatAmount, 0);
        const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);

        res.status(200).json({
            success: true,
            data: {
                date: targetDate,
                totalInvoices: sales.length,
                totalSales,
                totalVAT,
                totalDiscount,
                netSales: totalSales - totalDiscount,
                sales
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get monthly sales report
 * @route   GET /api/reports/monthly-sales
 * @access  Private (Manager, Admin)
 */
const getMonthlySalesReport = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        const matchFilter = {
            saleDate: { $gte: startDate, $lte: endDate },
            status: { $ne: 'refunded' }
        };

        // Cashiers can only see their own sales
        if (req.user.role === 'cashier') {
            matchFilter.cashier = req.user._id;
        }

        const sales = await SaleInvoice.aggregate([
            {
                $match: matchFilter
            },
            {
                $group: {
                    _id: { $dayOfMonth: '$saleDate' },
                    totalSales: { $sum: '$totalAmount' },
                    totalVAT: { $sum: '$vatAmount' },
                    totalDiscount: { $sum: '$discount' },
                    invoiceCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const totalSales = sales.reduce((sum, day) => sum + day.totalSales, 0);
        const totalInvoices = sales.reduce((sum, day) => sum + day.invoiceCount, 0);

        res.status(200).json({
            success: true,
            data: {
                year: targetYear,
                month: targetMonth + 1,
                totalInvoices,
                totalSales,
                dailyBreakdown: sales
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get inventory valuation
 * @route   GET /api/reports/inventory-valuation
 * @access  Private (Manager, Admin)
 */
const getInventoryValuation = async (req, res, next) => {
    try {
        const inventory = await Inventory.find({ status: 'available', quantity: { $gt: 0 } })
            .populate('medicine');

        const totalValue = inventory.reduce((sum, item) => {
            return sum + (item.quantity * item.purchasePrice);
        }, 0);

        const totalSellingValue = inventory.reduce((sum, item) => {
            return sum + (item.quantity * item.sellingPrice);
        }, 0);

        const potentialProfit = totalSellingValue - totalValue;

        res.status(200).json({
            success: true,
            data: {
                totalItems: inventory.length,
                totalPurchaseValue: totalValue,
                totalSellingValue,
                potentialProfit,
                profitMargin: ((potentialProfit / totalValue) * 100).toFixed(2) + '%',
                inventory
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get expired stock report
 * @route   GET /api/reports/expired-stock
 * @access  Private (Manager, Admin)
 */
const getExpiredStockReport = async (req, res, next) => {
    try {
        const expiredStock = await Inventory.find({
            expiryDate: { $lt: new Date() },
            quantity: { $gt: 0 }
        }).populate('medicine supplier');

        const totalLoss = expiredStock.reduce((sum, item) => {
            return sum + (item.quantity * item.purchasePrice);
        }, 0);

        res.status(200).json({
            success: true,
            data: {
                totalExpiredItems: expiredStock.length,
                totalLoss,
                expiredStock
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get profit and loss summary
 * @route   GET /api/reports/profit-loss
 * @access  Private (Admin)
 */
const getProfitLossSummary = async (req, res, next) => {
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
        }).populate('items.inventory');

        let totalRevenue = 0;
        let totalCost = 0;

        sales.forEach(sale => {
            totalRevenue += sale.totalAmount;
            sale.items.forEach(item => {
                // Calculate cost from inventory purchase price
                totalCost += item.quantity * (item.inventory?.purchasePrice || 0);
            });
        });

        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            data: {
                period: { startDate, endDate },
                totalRevenue,
                totalCost,
                grossProfit,
                profitMargin: profitMargin + '%',
                totalInvoices: sales.length
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get audit logs
 * @route   GET /api/reports/audit-logs
 * @access  Private (Admin)
 */
const getAuditLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, user, action, resourceType, startDate, endDate } = req.query;

        const filter = {};
        if (user) filter.user = user;
        if (action) filter.action = action;
        if (resourceType) filter.resourceType = resourceType;
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(filter)
            .populate('user', 'name email role')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ timestamp: -1 });

        const count = await AuditLog.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: logs,
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

module.exports = {
    getDailySalesReport,
    getMonthlySalesReport,
    getInventoryValuation,
    getExpiredStockReport,
    getProfitLossSummary,
    getAuditLogs
};
