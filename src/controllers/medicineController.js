const Medicine = require('../models/Medicine');
const { validationResult } = require('express-validator');

/**
 * @desc    Create medicine
 * @route   POST /api/medicines
 * @access  Private (Pharmacist, Admin, Manager)
 */
const createMedicine = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Check for duplicate name
        const existingMedicine = await Medicine.findOne({ name: req.body.name.trim() });
        if (existingMedicine) {
            return res.status(400).json({
                success: false,
                message: 'Medicine with this name already exists'
            });
        }

        // Check for duplicate barcode if provided
        if (req.body.barcode) {
            const existingBarcode = await Medicine.findOne({ barcode: req.body.barcode.trim() });
            if (existingBarcode) {
                return res.status(400).json({
                    success: false,
                    message: 'Medicine with this barcode already exists'
                });
            }
        }

        const medicine = new Medicine({
            ...req.body,
            createdBy: req.user._id
        });

        await medicine.save();
        await medicine.populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Medicine created successfully',
            data: medicine
        });
    } catch (error) {
        // Handle MongoDB duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Medicine with this ${field} already exists`
            });
        }
        next(error);
    }
};

/**
 * @desc    Get all medicines
 * @route   GET /api/medicines
 * @access  Private
 */
const getMedicines = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, category, status, search } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } },
                { barcode: search }
            ];
        }

        const medicines = await Medicine.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ name: 1 });

        const count = await Medicine.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: medicines,
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
 * @desc    Get single medicine
 * @route   GET /api/medicines/:id
 * @access  Private
 */
const getMedicine = async (req, res, next) => {
    try {
        const medicine = await Medicine.findById(req.params.id).populate('createdBy', 'name email');

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        res.status(200).json({
            success: true,
            data: medicine
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update medicine
 * @route   PUT /api/medicines/:id
 * @access  Private (Pharmacist, Admin, Manager)
 */
const updateMedicine = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Medicine updated successfully',
            data: medicine
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete medicine
 * @route   DELETE /api/medicines/:id
 * @access  Private (Admin)
 */
const deleteMedicine = async (req, res, next) => {
    try {
        const medicine = await Medicine.findByIdAndDelete(req.params.id);

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Medicine deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Search medicine by barcode
 * @route   GET /api/medicines/barcode/:barcode
 * @access  Private
 */
const searchByBarcode = async (req, res, next) => {
    try {
        const medicine = await Medicine.findOne({ barcode: req.params.barcode });

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        res.status(200).json({
            success: true,
            data: medicine
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createMedicine,
    getMedicines,
    getMedicine,
    updateMedicine,
    deleteMedicine,
    searchByBarcode
};
