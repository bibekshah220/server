const SaleInvoice = require('../models/SaleInvoice');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const { reduceStock } = require('./inventoryService');
const logger = require('../utils/logger');

/**
 * Create sale invoice and reduce inventory
 */
const createSaleInvoice = async (saleData, cashierId) => {
    try {
        const { items, customerName, customerMobile, customerAddress, paymentMethod, prescription, discount, discountPercentage } = saleData;

        // Process each item and reduce stock
        const processedItems = [];

        for (const item of items) {
            const { medicine, quantity } = item;

            // Reduce stock using FEFO (First Expiry First Out)
            const usedBatches = await reduceStock(medicine, quantity);

            // If multiple batches were used, we need to create separate line items
            // For simplicity, we'll use the first batch's details and average price
            let totalPrice = 0;
            let totalQuantity = 0;
            let primaryBatch = null;

            for (const usedBatch of usedBatches) {
                const batch = await Inventory.findById(usedBatch.inventoryId);
                if (!primaryBatch) primaryBatch = batch;
                totalPrice += usedBatch.unitPrice * usedBatch.quantityUsed;
                totalQuantity += usedBatch.quantityUsed;
            }

            const averageUnitPrice = totalPrice / totalQuantity;
            const subtotal = totalPrice;

            // Use primary batch details for invoice display
            processedItems.push({
                medicine: medicine,
                inventory: usedBatches[0].inventoryId, // Reference primary batch
                batchNumber: primaryBatch.batchNumber,
                manufacturingDate: primaryBatch.manufacturingDate,
                expiryDate: primaryBatch.expiryDate,
                quantity: quantity,
                unitPrice: averageUnitPrice,
                subtotal: subtotal
            });
        }

        // Calculate totals before creating invoice
        const calculatedSubtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
        const calculatedDiscount = discount || 0;
        const calculatedDiscountPercentage = discountPercentage || 0;
        const vatRate = parseFloat(process.env.VAT_RATE) || 13;
        const amountAfterDiscount = calculatedSubtotal - calculatedDiscount;
        const calculatedVatAmount = (amountAfterDiscount * vatRate) / 100;
        const calculatedTotalAmount = amountAfterDiscount + calculatedVatAmount;
        const amountPaid = saleData.amountPaid || calculatedTotalAmount;
        const amountDue = calculatedTotalAmount - amountPaid;

        // Create invoice with calculated values
        const invoice = new SaleInvoice({
            items: processedItems,
            customerName,
            customerMobile,
            customerAddress,
            paymentMethod,
            prescription,
            discount: calculatedDiscount,
            discountPercentage: calculatedDiscountPercentage,
            subtotal: calculatedSubtotal,
            vatRate: vatRate,
            vatAmount: calculatedVatAmount,
            totalAmount: calculatedTotalAmount,
            cashier: cashierId,
            amountPaid: amountPaid,
            amountDue: amountDue,
            paymentStatus: saleData.paymentStatus || 'paid'
        });

        await invoice.save();
        await invoice.populate('items.medicine cashier');

        // Create or update customer record if customer info is provided
        if (customerMobile || customerName) {
            try {
                let customer = await Customer.findOne({ mobile: customerMobile });
                
                if (customer) {
                    // Update existing customer stats
                    await customer.updateStats();
                } else if (customerMobile) {
                    // Create new customer from sale
                    customer = new Customer({
                        name: customerName || 'Unknown',
                        mobile: customerMobile,
                        address: customerAddress ? {
                            street: customerAddress
                        } : undefined,
                        preferredPaymentMethod: paymentMethod,
                        status: 'active'
                    });
                    await customer.save();
                    await customer.updateStats();
                }
            } catch (customerError) {
                // Log error but don't fail the sale
                logger.error('Error creating/updating customer:', customerError);
            }
        }

        logger.info(`Sale invoice created: ${invoice.invoiceNumber}`);
        return invoice;
    } catch (error) {
        logger.error('Error creating sale invoice:', error);
        throw error;
    }
};

/**
 * Calculate invoice totals (for preview before saving)
 */
const calculateInvoiceTotals = (items, discountPercentage = 0, discount = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    let finalDiscount = discount;
    if (discountPercentage > 0) {
        finalDiscount = (subtotal * discountPercentage) / 100;
    }

    const amountAfterDiscount = subtotal - finalDiscount;
    const vatRate = parseFloat(process.env.VAT_RATE) || 13;
    const vatAmount = (amountAfterDiscount * vatRate) / 100;
    const totalAmount = amountAfterDiscount + vatAmount;

    return {
        subtotal,
        discount: finalDiscount,
        discountPercentage,
        vatRate,
        vatAmount,
        totalAmount
    };
};

/**
 * Process refund
 */
const processRefund = async (invoiceId, refundAmount, refundReason) => {
    try {
        const invoice = await SaleInvoice.findById(invoiceId);

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (invoice.status === 'refunded') {
            throw new Error('Invoice already refunded');
        }

        if (refundAmount > invoice.totalAmount) {
            throw new Error('Refund amount cannot exceed invoice total');
        }

        // Update invoice
        invoice.refundAmount = refundAmount;
        invoice.refundReason = refundReason;
        invoice.refundDate = new Date();

        if (refundAmount === invoice.totalAmount) {
            invoice.status = 'refunded';
            // TODO: Return items to inventory
        } else {
            invoice.status = 'partially-refunded';
        }

        await invoice.save();
        logger.info(`Refund processed for invoice: ${invoice.invoiceNumber}`);
        return invoice;
    } catch (error) {
        logger.error('Error processing refund:', error);
        throw error;
    }
};

module.exports = {
    createSaleInvoice,
    calculateInvoiceTotals,
    processRefund
};
