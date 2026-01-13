const Inventory = require('../models/Inventory');
const Medicine = require('../models/Medicine');
const logger = require('../utils/logger');

/**
 * Get available batches for a medicine using FEFO (First Expiry First Out)
 * Returns batches sorted by expiry date (oldest first)
 * Filters out expired batches and batches with manufacturing date > today
 */
const getAvailableBatches = async (medicineId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const batches = await Inventory.find({
            medicine: medicineId,
            quantity: { $gt: 0 },
            status: 'available',
            expiryDate: { $gt: today }, // Not expired
            manufacturingDate: { $lte: today } // Manufacturing date not in future
        })
            .sort({ expiryDate: 1 }) // FEFO: First Expiry First Out
            .populate('medicine');

        return batches;
    } catch (error) {
        logger.error('Error fetching available batches:', error);
        throw error;
    }
};

/**
 * Reduce stock using FEFO (First Expiry First Out) logic
 */
const reduceStock = async (medicineId, quantityNeeded) => {
    try {
        const batches = await getAvailableBatches(medicineId);

        if (!batches || batches.length === 0) {
            throw new Error('No available stock for this medicine');
        }

        const totalAvailable = batches.reduce((sum, batch) => sum + batch.quantity, 0);

        if (totalAvailable < quantityNeeded) {
            throw new Error(`Insufficient stock. Available: ${totalAvailable}, Requested: ${quantityNeeded}`);
        }

        let remainingQuantity = quantityNeeded;
        const usedBatches = [];

        // Use FIFO: Take from oldest batches first
        for (const batch of batches) {
            if (remainingQuantity <= 0) break;

            const quantityToTake = Math.min(batch.quantity, remainingQuantity);

            batch.quantity -= quantityToTake;
            await batch.save();

            usedBatches.push({
                inventoryId: batch._id,
                batchNumber: batch.batchNumber,
                quantityUsed: quantityToTake,
                unitPrice: batch.sellingPrice
            });

            remainingQuantity -= quantityToTake;
        }

        return usedBatches;
    } catch (error) {
        logger.error('Error reducing stock:', error);
        throw error;
    }
};

/**
 * Add stock
 */
const addStock = async (inventoryData) => {
    try {
        // Check if batch already exists
        const existingBatch = await Inventory.findOne({
            medicine: inventoryData.medicine,
            batchNumber: inventoryData.batchNumber
        });

        if (existingBatch) {
            // Update existing batch quantity
            existingBatch.quantity += inventoryData.quantity;
            await existingBatch.save();
            return existingBatch;
        } else {
            // Create new batch
            const newBatch = new Inventory(inventoryData);
            await newBatch.save();
            return newBatch;
        }
    } catch (error) {
        logger.error('Error adding stock:', error);
        throw error;
    }
};

/**
 * Get expired medicines
 */
const getExpiredMedicines = async () => {
    try {
        const expired = await Inventory.find({
            expiryDate: { $lte: new Date() },
            quantity: { $gt: 0 }
        })
            .populate('medicine')
            .populate('supplier');

        return expired;
    } catch (error) {
        logger.error('Error fetching expired medicines:', error);
        throw error;
    }
};

/**
 * Get medicines nearing expiry (within 3 months)
 */
const getMedicinesNearingExpiry = async (months = 3) => {
    try {
        const thresholdDate = new Date();
        thresholdDate.setMonth(thresholdDate.getMonth() + months);

        const nearExpiry = await Inventory.find({
            expiryDate: {
                $gt: new Date(),
                $lte: thresholdDate
            },
            quantity: { $gt: 0 },
            status: 'available'
        })
            .populate('medicine')
            .populate('supplier')
            .sort({ expiryDate: 1 });

        return nearExpiry;
    } catch (error) {
        logger.error('Error fetching medicines nearing expiry:', error);
        throw error;
    }
};

/**
 * Get low stock medicines
 * Low stock is defined as medicines with total available quantity < 10 (configurable via env)
 */
const getLowStockMedicines = async () => {
    try {
        const minimumStockLevel = parseInt(process.env.MINIMUM_STOCK_LEVEL) || 10;
        
        // Get all medicines with their stock levels
        const medicines = await Medicine.find({ status: 'active' });

        const lowStockItems = [];

        for (const medicine of medicines) {
            // Calculate total available quantity for this medicine
            const totalStock = await Inventory.aggregate([
                {
                    $match: {
                        medicine: medicine._id,
                        status: 'available',
                        quantity: { $gt: 0 },
                        expiryDate: { $gt: new Date() } // Not expired
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalQuantity: { $sum: '$quantity' }
                    }
                }
            ]);

            const currentStock = totalStock.length > 0 ? totalStock[0].totalQuantity : 0;

            if (currentStock < minimumStockLevel) {
                lowStockItems.push({
                    medicine: medicine,
                    currentStock: currentStock,
                    minimumStock: minimumStockLevel,
                    deficit: minimumStockLevel - currentStock
                });
            }
        }

        return lowStockItems;
    } catch (error) {
        logger.error('Error fetching low stock medicines:', error);
        throw error;
    }
};

/**
 * Adjust stock (for returns, damages, etc.)
 */
const adjustStock = async (inventoryId, adjustment, reason) => {
    try {
        const batch = await Inventory.findById(inventoryId);

        if (!batch) {
            throw new Error('Batch not found');
        }

        batch.quantity += adjustment; // Can be positive or negative
        batch.notes = reason;

        if (batch.quantity < 0) {
            throw new Error('Stock cannot be negative');
        }

        await batch.save();
        return batch;
    } catch (error) {
        logger.error('Error adjusting stock:', error);
        throw error;
    }
};

module.exports = {
    getAvailableBatches,
    reduceStock,
    addStock,
    getExpiredMedicines,
    getMedicinesNearingExpiry,
    getLowStockMedicines,
    adjustStock
};
