const Prescription = require('../models/Prescription');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'prescriptions');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'prescription-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (JPEG, JPG, PNG) and PDF files are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
    },
    fileFilter: fileFilter
});

/**
 * @desc    Upload prescription
 * @route   POST /api/prescriptions
 * @access  Private
 */
const uploadPrescription = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a prescription file'
            });
        }

        const {
            patientName,
            patientAge,
            patientGender,
            patientMobile,
            patientAddress,
            doctorName,
            doctorRegistrationNumber,
            doctorSpecialization,
            prescriptionDate,
            validUntil,
            medicines,
            notes
        } = req.body;

        const prescription = new Prescription({
            patientName,
            patientAge,
            patientGender,
            patientMobile,
            patientAddress,
            doctorName,
            doctorRegistrationNumber,
            doctorSpecialization,
            prescriptionDate: prescriptionDate || Date.now(),
            validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            medicines: medicines ? JSON.parse(medicines) : [],
            prescriptionFile: {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size,
                uploadedAt: Date.now()
            },
            notes,
            createdBy: req.user._id
        });

        await prescription.save();
        await prescription.populate('medicines.medicine createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Prescription uploaded successfully',
            data: prescription
        });
    } catch (error) {
        // Delete uploaded file if prescription creation fails
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
};

/**
 * @desc    Get all prescriptions
 * @route   GET /api/prescriptions
 * @access  Private
 */
const getPrescriptions = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, patientMobile } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (patientMobile) filter.patientMobile = patientMobile;

        const prescriptions = await Prescription.find(filter)
            .populate('medicines.medicine')
            .populate('dispensedBy', 'name email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ prescriptionDate: -1 });

        const count = await Prescription.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: prescriptions,
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
 * @desc    Get single prescription
 * @route   GET /api/prescriptions/:id
 * @access  Private
 */
const getPrescription = async (req, res, next) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('medicines.medicine')
            .populate('dispensedBy createdBy', 'name email');

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        res.status(200).json({
            success: true,
            data: prescription
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Validate prescription
 * @route   GET /api/prescriptions/:id/validate
 * @access  Private
 */
const validatePrescription = async (req, res, next) => {
    try {
        const prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        const isValid = prescription.isValid();

        res.status(200).json({
            success: true,
            data: {
                isValid,
                prescription: {
                    id: prescription._id,
                    prescriptionNumber: prescription.prescriptionNumber,
                    validUntil: prescription.validUntil,
                    status: prescription.status
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark prescription as dispensed
 * @route   PUT /api/prescriptions/:id/dispense
 * @access  Private (Pharmacist)
 */
const dispensePrescription = async (req, res, next) => {
    try {
        const prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        if (!prescription.isValid()) {
            return res.status(400).json({
                success: false,
                message: 'Prescription is expired or invalid'
            });
        }

        prescription.status = 'fully-dispensed';
        prescription.dispensedBy = req.user._id;
        prescription.dispensedDate = Date.now();

        await prescription.save();

        res.status(200).json({
            success: true,
            message: 'Prescription marked as dispensed',
            data: prescription
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    upload,
    uploadPrescription,
    getPrescriptions,
    getPrescription,
    validatePrescription,
    dispensePrescription
};
