const Medicine = require("../models/Medicine");
const { getAvailableBatches } = require("../services/inventoryService");
const logger = require("../utils/logger");

const searchMedicines = async (req, res, next) => {
  try {
    const { q, barcode } = req.query;

    if (!q && !barcode) {
      return res.status(400).json({
        success: false,
        message: "Search query or barcode is required",
      });
    }

    const filter = { status: "active" };

    if (barcode) {
      filter.barcode = barcode;
    } else if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { genericName: { $regex: q, $options: "i" } },
        { barcode: { $regex: q, $options: "i" } },
      ];
    }

    const medicines = await Medicine.find(filter)
      .select(
        "name genericName manufacturer category dosageForm strength barcode prescriptionRequired"
      )
      .limit(20);

    // For each medicine, check if there's available stock
    const medicinesWithStock = await Promise.all(
      medicines.map(async (medicine) => {
        const batches = await getAvailableBatches(medicine._id);
        const totalStock = batches.reduce(
          (sum, batch) => sum + batch.quantity,
          0
        );

        return {
          ...medicine.toObject(),
          availableStock: totalStock,
          hasStock: totalStock > 0,
          batches: batches.map((batch) => ({
            batchId: batch._id,
            batchNumber: batch.batchNumber,
            manufacturingDate: batch.manufacturingDate,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
            sellingPrice: batch.sellingPrice,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: medicinesWithStock.filter((m) => m.hasStock), // Only return medicines with stock
    });
  } catch (error) {
    logger.error("Error searching medicines for billing:", error);
    next(error);
  }
};

/**
 * @desc    Get available batches for a medicine (for billing)
 * @route   GET /api/billing/medicines/:id/batches
 * @access  Private (Cashier, Pharmacist, Admin)
 */
const getMedicineBatches = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    if (medicine.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Medicine is not active",
      });
    }

    const batches = await getAvailableBatches(medicine._id);

    res.status(200).json({
      success: true,
      data: {
        medicine: {
          id: medicine._id,
          name: medicine.name,
          genericName: medicine.genericName,
          manufacturer: medicine.manufacturer,
          prescriptionRequired: medicine.prescriptionRequired,
        },
        batches: batches.map((batch) => ({
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          manufacturingDate: batch.manufacturingDate,
          expiryDate: batch.expiryDate,
          quantity: batch.quantity,
          sellingPrice: batch.sellingPrice,
          daysUntilExpiry: Math.ceil(
            (batch.expiryDate - new Date()) / (1000 * 60 * 60 * 24)
          ),
        })),
      },
    });
  } catch (error) {
    logger.error("Error fetching medicine batches:", error);
    next(error);
  }
};

module.exports = {
  searchMedicines,
  getMedicineBatches,
};
