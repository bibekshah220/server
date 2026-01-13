const Inventory = require('../models/Inventory');
const { validationResult } = require('express-validator');
const {
    addStock,
    getExpiredMedicines,
    getMedicinesNearingExpiry,
    getLowStockMedicines,
    adjustStock
} = require('../services/inventoryService');

/**
 * @desc    Add inventory
 * @route   POST /api/inventory
 * @access  Private (Pharmacist, Admin, Manager)
 */
const addInventory = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const inventoryData = {
            ...req.body,
            createdBy: req.user._id
        };

        const inventory = await addStock(inventoryData);
        await inventory.populate('medicine supplier');

        res.status(201).json({
            success: true,
            message: 'Inventory added successfully',
            data: inventory
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all inventory
 * @route   GET /api/inventory
 * @access  Private
 */
const getInventory = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, medicine, status } = req.query;

        const filter = {};
        if (medicine) filter.medicine = medicine;
        if (status) filter.status = status;

        const inventory = await Inventory.find(filter)
            .populate('medicine')
            .populate('supplier')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ expiryDate: 1 });

        const count = await Inventory.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: inventory,
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
 * @desc    Get single inventory item
 * @route   GET /api/inventory/:id
 * @access  Private
 */
const getInventoryItem = async (req, res, next) => {
    try {
        const inventory = await Inventory.findById(req.params.id)
            .populate('medicine')
            .populate('supplier');

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: inventory
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update inventory
 * @route   PUT /api/inventory/:id
 * @access  Private (Pharmacist, Admin, Manager)
 */
const updateInventory = async (req, res, next) => {
    try {
        const inventory = await Inventory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('medicine supplier');

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Inventory updated successfully',
            data: inventory
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Stock adjustment
 * @route   POST /api/inventory/:id/adjust
 * @access  Private (Pharmacist, Admin, Manager)
 */
const stockAdjustment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { adjustment, reason } = req.body;
        const inventory = await adjustStock(req.params.id, adjustment, reason);

        res.status(200).json({
            success: true,
            message: 'Stock adjusted successfully',
            data: inventory
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get expired medicines
 * @route   GET /api/inventory/alerts/expired
 * @access  Private
 */
const getExpired = async (req, res, next) => {
    try {
        const expired = await getExpiredMedicines();

        res.status(200).json({
            success: true,
            count: expired.length,
            data: expired
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get medicines nearing expiry
 * @route   GET /api/inventory/alerts/nearing-expiry
 * @access  Private
 */
const getNearingExpiry = async (req, res, next) => {
    try {
        const { months = 3 } = req.query;
        const nearExpiry = await getMedicinesNearingExpiry(parseInt(months));

        res.status(200).json({
            success: true,
            count: nearExpiry.length,
            data: nearExpiry
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get low stock medicines
 * @route   GET /api/inventory/alerts/low-stock
 * @access  Private
 */
const getLowStock = async (req, res, next) => {
    try {
        const lowStock = await getLowStockMedicines();

        res.status(200).json({
            success: true,
            count: lowStock.length,
            data: lowStock
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addInventory,
    getInventory,
    getInventoryItem,
    updateInventory,
    stockAdjustment,
    getExpired,
    getNearingExpiry,
    getLowStock
};
