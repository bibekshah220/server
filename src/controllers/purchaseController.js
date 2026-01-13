const PurchaseOrder = require('../models/PurchaseOrder');
const { addStock } = require('../services/inventoryService');

/**
 * @desc    Create purchase order
 * @route   POST /api/purchases
 * @access  Private (Manager, Admin)
 */
const createPurchaseOrder = async (req, res, next) => {
    try {
        const purchaseOrder = new PurchaseOrder({
            ...req.body,
            createdBy: req.user._id
        });

        await purchaseOrder.save();
        await purchaseOrder.populate('supplier items.medicine');

        res.status(201).json({
            success: true,
            message: 'Purchase order created successfully',
            data: purchaseOrder
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all purchase orders
 * @route   GET /api/purchases
 * @access  Private
 */
const getPurchaseOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, supplier } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (supplier) filter.supplier = supplier;

        const purchaseOrders = await PurchaseOrder.find(filter)
            .populate('supplier')
            .populate('items.medicine')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ orderDate: -1 });

        const count = await PurchaseOrder.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: purchaseOrders,
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
 * @desc    Get single purchase order
 * @route   GET /api/purchases/:id
 * @access  Private
 */
const getPurchaseOrder = async (req, res, next) => {
    try {
        const purchaseOrder = await PurchaseOrder.findById(req.params.id)
            .populate('supplier')
            .populate('items.medicine')
            .populate('createdBy receivedBy', 'name email');

        if (!purchaseOrder) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: purchaseOrder
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Receive purchase order and update inventory
 * @route   POST /api/purchases/:id/receive
 * @access  Private (Pharmacist, Manager, Admin)
 */
const receivePurchaseOrder = async (req, res, next) => {
    try {
        const purchaseOrder = await PurchaseOrder.findById(req.params.id);

        if (!purchaseOrder) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        if (purchaseOrder.status === 'received') {
            return res.status(400).json({
                success: false,
                message: 'Purchase order already received'
            });
        }

        const { receivedItems } = req.body; // Array of { itemIndex, receivedQuantity, damagedQuantity }

        // Update received quantities and add to inventory
        for (const received of receivedItems) {
            const item = purchaseOrder.items[received.itemIndex];

            if (item) {
                item.receivedQuantity = received.receivedQuantity || 0;
                item.damagedQuantity = received.damagedQuantity || 0;

                // Add to inventory (only good quantity)
                const goodQuantity = item.receivedQuantity - item.damagedQuantity;

                if (goodQuantity > 0) {
                    await addStock({
                        medicine: item.medicine,
                        batchNumber: item.batchNumber,
                        expiryDate: item.expiryDate,
                        quantity: goodQuantity,
                        purchasePrice: item.unitPrice,
                        sellingPrice: item.unitPrice * 1.3, // 30% markup example
                        supplier: purchaseOrder.supplier,
                        createdBy: req.user._id
                    });
                }
            }
        }

        // Update PO status
        const totalOrdered = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalReceived = purchaseOrder.items.reduce((sum, item) => sum + item.receivedQuantity, 0);

        if (totalReceived >= totalOrdered) {
            purchaseOrder.status = 'received';
        } else if (totalReceived > 0) {
            purchaseOrder.status = 'partially-received';
        }

        purchaseOrder.receivedDate = Date.now();
        purchaseOrder.receivedBy = req.user._id;
        await purchaseOrder.save();

        res.status(200).json({
            success: true,
            message: 'Purchase order received and inventory updated',
            data: purchaseOrder
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cancel purchase order
 * @route   PUT /api/purchases/:id/cancel
 * @access  Private (Manager, Admin)
 */
const cancelPurchaseOrder = async (req, res, next) => {
    try {
        const purchaseOrder = await PurchaseOrder.findById(req.params.id);

        if (!purchaseOrder) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }

        if (purchaseOrder.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending purchase orders can be cancelled'
            });
        }

        purchaseOrder.status = 'cancelled';
        await purchaseOrder.save();

        res.status(200).json({
            success: true,
            message: 'Purchase order cancelled successfully',
            data: purchaseOrder
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrder,
    receivePurchaseOrder,
    cancelPurchaseOrder
};
