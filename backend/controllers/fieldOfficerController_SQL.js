const FieldOfficer = require('../models/FieldOfficer_SQL');
const Vendor = require('../models/Vendor_SQL');
const Record = require('../models/Record_SQL');
const Verification = require('../models/Verification_SQL');
const { validatePassword } = require('../utils/passwordValidation');
const { Op } = require('sequelize');

// Create field officer
exports.createFieldOfficer = async (req, res) => {
    try {
        const { name, email, phoneNumber, password, vendor } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10}$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }
        if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
        }
        
        // Validate password
        const passwordValidation = validatePassword(password, email);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password validation failed',
                errors: passwordValidation.errors
            });
        }
        
        // Validate vendor exists and is active
        const vendorDoc = await Vendor.findByPk(vendor);
        if (!vendorDoc) {
            return res.status(400).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        if (vendorDoc.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Cannot assign to inactive vendor'
            });
        }
        
        // Check if field officer already exists
        const existingOfficer = await FieldOfficer.findOne({ where: { email } });
        if (existingOfficer) {
            return res.status(400).json({
                success: false,
                message: 'Field officer with this email already exists'
            });
        }
        
        const fieldOfficer = await FieldOfficer.create({
            name,
            email,
            phoneNumber,
            password,
            vendor,
            vendorName: vendorDoc.company
        });
        
        res.status(201).json({
            success: true,
            message: 'Field officer created successfully',
            fieldOfficer: {
                id: fieldOfficer.id,
                name: fieldOfficer.name,
                email: fieldOfficer.email,
                phoneNumber: fieldOfficer.phoneNumber,
                vendor: fieldOfficer.vendor,
                vendorName: fieldOfficer.vendorName,
                status: fieldOfficer.status
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error creating field officer'
        });
    }
};

// Get all field officers
exports.getAllFieldOfficers = async (req, res) => {
    try {
        const { status } = req.query;
        
        const where = {};
        if (status) {
            where.status = status;
        }
        
        const fieldOfficers = await FieldOfficer.findAll({
            where,
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['password'] }
        });
        
        res.json({
            success: true,
            fieldOfficers
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching field officers'
        });
    }
};

// Get field officers by vendor
exports.getFieldOfficersByVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;
        
        const fieldOfficers = await FieldOfficer.findAll({
            where: {
                vendor: vendorId,
                status: 'active'
            },
            attributes: ['id', 'name']
        });
        
        res.json({
            success: true,
            fieldOfficers
        });
        
    } catch (error) {
        console.error('Error fetching field officers by vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching field officers'
        });
    }
};

// Get field officer by ID
exports.getFieldOfficerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const fieldOfficer = await FieldOfficer.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!fieldOfficer) {
            return res.status(404).json({
                success: false,
                message: 'Field officer not found'
            });
        }
        
        res.json({
            success: true,
            fieldOfficer
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching field officer'
        });
    }
};

// Update field officer
exports.updateFieldOfficer = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const phoneRegex = /^\d{10}$/;
                if (updateData.email && !emailRegex.test(updateData.email)) {
                    return res.status(400).json({ success: false, message: 'Invalid email format' });
                }
                if (updateData.phoneNumber && !phoneRegex.test(updateData.phoneNumber)) {
                    return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
                }
                // If changing email, ensure uniqueness
                if (updateData.email && updateData.email !== fieldOfficer.email) {
                    const dup = await FieldOfficer.findOne({ where: { email: updateData.email } });
                    if (dup) {
                        return res.status(400).json({ success: false, message: 'Another field officer with this email already exists' });
                    }
                }
        
        const fieldOfficer = await FieldOfficer.findByPk(id);
        if (!fieldOfficer) {
            return res.status(404).json({
                success: false,
                message: 'Field officer not found'
            });
        }
        
        // If changing vendor, validate new vendor
        if (updateData.vendor && updateData.vendor !== fieldOfficer.vendor) {
            const vendorDoc = await Vendor.findByPk(updateData.vendor);
            if (!vendorDoc) {
                return res.status(400).json({
                    success: false,
                    message: 'Vendor not found'
                });
            }
            updateData.vendorName = vendorDoc.company;
        }
        
        // If password provided, validate and enforce simple reuse policy
        if (updateData.password) {
            const passwordValidation = validatePassword(updateData.password, updateData.email || fieldOfficer.email);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Password validation failed',
                    errors: passwordValidation.errors
                });
            }
            // Disallow setting the same password as current
            if (updateData.password === fieldOfficer.password) {
                return res.status(400).json({
                    success: false,
                    message: 'New password cannot be the same as current password'
                });
            }
        }

        await fieldOfficer.update(updateData);
        
        res.json({
            success: true,
            message: 'Field officer updated successfully',
            fieldOfficer: {
                id: fieldOfficer.id,
                name: fieldOfficer.name,
                email: fieldOfficer.email,
                phoneNumber: fieldOfficer.phoneNumber,
                vendor: fieldOfficer.vendor,
                vendorName: fieldOfficer.vendorName,
                status: fieldOfficer.status
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error updating field officer'
        });
    }
};

// Toggle field officer status
exports.toggleFieldOfficerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const fieldOfficer = await FieldOfficer.findByPk(id);
        if (!fieldOfficer) {
            return res.status(404).json({
                success: false,
                message: 'Field officer not found'
            });
        }
        
        fieldOfficer.status = fieldOfficer.status === 'active' ? 'inactive' : 'active';
        await fieldOfficer.save();
        
        res.json({
            success: true,
            message: `Field officer ${fieldOfficer.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            fieldOfficer: {
                id: fieldOfficer.id,
                name: fieldOfficer.name,
                email: fieldOfficer.email,
                status: fieldOfficer.status
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error toggling field officer status'
        });
    }
};

// Public: Get cases assigned to a Field Officer (demo endpoint without auth)
exports.getCasesForFieldOfficerPublic = async (req, res) => {
    try {
        const { foId, status, search, page = 1, limit = 10 } = req.query;
        if (!foId) {
            return res.status(400).json({ success: false, message: 'foId is required' });
        }

        const where = { assignedFieldOfficer: foId };
        if (status && status !== 'all') {
            where.status = status;
        }
        if (search) {
            where[Op.or] = [
                { referenceNumber: { [Op.like]: `%${search}%` } },
                { caseNumber: { [Op.like]: `%${search}%` } },
                { fullName: { [Op.like]: `%${search}%` } },
                { contactNumber: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await Record.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            records: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching FO cases (public):', error);
        res.status(500).json({ success: false, message: 'Server error fetching cases' });
    }
};

// Protected: Submit verification details for an assigned case
exports.submitVerification = async (req, res) => {
    try {
        const foId = req.fieldOfficerId;
        const { caseId } = req.params;
        const record = await Record.findByPk(caseId);
        if (!record || record.assignedFieldOfficer !== foId) {
            return res.status(404).json({ success: false, message: 'Case not found or not assigned to you' });
        }
        if (record.status !== 'assigned') {
            return res.status(400).json({ success: false, message: 'Only assigned cases can be submitted' });
        }

        const {
            respondentName,
            respondentRelationship,
            respondentContact,
            periodOfStay,
            ownershipType,
            verificationDate,
            comments,
            gpsLat,
            gpsLng,
            officerSignature,
            respondentSignature,
            action
        } = req.body;

        if (!gpsLat || !gpsLng) {
            return res.status(400).json({ success: false, message: 'GPS location is required. Please enable location services.' });
        }

        // Validate required photo uploads
        if (!req.files?.selfieWithHouse || req.files.selfieWithHouse.length === 0) {
            return res.status(400).json({ success: false, message: 'Selfie Photo with House is required' });
        }
        if (!req.files?.candidateWithRespondent || req.files.candidateWithRespondent.length === 0) {
            return res.status(400).json({ success: false, message: 'Candidate with Respondent Photo is required' });
        }

        // Files uploaded via multer
        const documents = (req.files?.documents || []).map(f => f.filename);
        const photos = (req.files?.photos || []).map(f => f.filename);
        const selfieWithHouse = req.files?.selfieWithHouse?.[0]?.filename || null;
        const candidateWithRespondent = req.files?.candidateWithRespondent?.[0]?.filename || null;
        const payload = {
            recordId: record.id,
            fieldOfficerId: foId,
            respondentName,
            respondentRelationship,
            respondentContact,
            periodOfStay,
            ownershipType,
            verificationDate: verificationDate ? new Date(verificationDate) : null,
            comments,
            gpsLat,
            gpsLng,
            documents,
            photos,
            selfieWithHousePath: selfieWithHouse,
            candidateWithRespondentPath: candidateWithRespondent,
            officerSignaturePath: req.files?.officerSignature?.[0]?.filename || null,
            respondentSignaturePath: req.files?.respondentSignature?.[0]?.filename || null,
            status: action === 'insufficient' ? 'insufficient' : 'submitted'
        };

        const existing = await Verification.findOne({ where: { recordId: record.id } });
        if (existing) {
            await existing.update(payload);
        } else {
            await Verification.create(payload);
        }

        if (action === 'insufficient') {
            record.status = 'insufficient';
        } else {
            record.status = 'submitted';
            record.completionDate = new Date();
        }
        await record.save();

        res.json({ success: true, message: 'Verification submitted', record: record.toJSON() });
    } catch (error) {
        console.error('Error submitting verification:', error);
        res.status(500).json({ success: false, message: 'Server error submitting verification' });
    }
};
