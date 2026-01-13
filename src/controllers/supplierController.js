const Supplier = require('../models/Supplier');

/**
 * @desc    Create supplier
 * @route   POST /api/suppliers
 * @access  Private (Manager, Admin)
 */
const createSupplier = async (req, res, next) => {
    try {
        const supplier = new Supplier({
            ...req.body,
            createdBy: req.user._id
        });

        await supplier.save();

        res.status(201).json({
            success: true,
            message: 'Supplier created successfully',
            data: supplier
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all suppliers
 * @route   GET /api/suppliers
 * @access  Private
 */
const getSuppliers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
                { mobile: search }
            ];
        }

        const suppliers = await Supplier.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ name: 1 });

        const count = await Supplier.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: suppliers,
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
 * @desc    Get single supplier
 * @route   GET /api/suppliers/:id
 * @access  Private
 */
const getSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        res.status(200).json({
            success: true,
            data: supplier
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update supplier
 * @route   PUT /api/suppliers/:id
 * @access  Private (Manager, Admin)
 */
const updateSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Supplier updated successfully',
            data: supplier
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete supplier
 * @route   DELETE /api/suppliers/:id
 * @access  Private (Admin)
 */
const deleteSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Supplier deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    getSupplier,
    updateSupplier,
    deleteSupplier
};
