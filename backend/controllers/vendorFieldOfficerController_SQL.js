const FieldOfficer = require('../models/FieldOfficer_SQL');
const { Op } = require('sequelize');

// Get Vendor's Field Officers
exports.getVendorFieldOfficers = async (req, res) => {
    try {
        const vendorId = req.userId;
        const { search, status } = req.query;
        
        const where = { vendor: vendorId };
        
        if (status) {
            where.status = status;
        }
        
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phoneNumber: { [Op.like]: `%${search}%` } }
            ];
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
        console.error('Error fetching field officers:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching field officers'
        });
    }
};

// Get Single Field Officer
exports.getVendorFieldOfficer = async (req, res) => {
    try {
        const vendorId = req.userId;
        const { id } = req.params;
        
        const fieldOfficer = await FieldOfficer.findOne({
            where: { 
                id,
                vendor: vendorId
            }
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
        console.error('Error fetching field officer:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching field officer'
        });
    }
};

// Create Field Officer
exports.createFieldOfficer = async (req, res) => {
    try {
        const vendorId = req.userId;
        const vendorCompany = req.company;
        const { name, email, phoneNumber, password } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10}$/;
        
        // Validate required fields
        if (!name || !email || !phoneNumber || !password) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email, phone number, and password are required'
            });
        }
        
        // Validate email and phone
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }
        if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
        }
        // Check if email already exists
        const existingOfficer = await FieldOfficer.findOne({ where: { email } });
        if (existingOfficer) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Password validation
        const { validatePassword } = require('../utils/passwordValidation');
        const result = validatePassword(password, email || '');
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid password',
                errors: result.errors
            });
        }
        
        const fieldOfficer = await FieldOfficer.create({
            name,
            email,
            phoneNumber,
            password,
            vendor: vendorId,
            vendorName: vendorCompany,
            status: 'active'
        });
        
        res.status(201).json({
            success: true,
            message: 'Field officer created successfully',
            fieldOfficer: {
                id: fieldOfficer.id,
                name: fieldOfficer.name,
                email: fieldOfficer.email,
                phoneNumber: fieldOfficer.phoneNumber,
                status: fieldOfficer.status
            }
        });
    } catch (error) {
        console.error('Error creating field officer:', error.message || error);
        if (error.errors) {
            console.error('Validation errors:', error.errors.map(e => e.message));
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Server error creating field officer',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update Field Officer
exports.updateFieldOfficer = async (req, res) => {
    try {
        const vendorId = req.userId;
        const { id } = req.params;
        const { name, phoneNumber, password } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10}$/;
        
        const fieldOfficer = await FieldOfficer.findOne({
            where: { 
                id,
                vendor: vendorId
            }
        });
        
        if (!fieldOfficer) {
            return res.status(404).json({
                success: false,
                message: 'Field officer not found'
            });
        }
        
        if (name) fieldOfficer.name = name;
        if (phoneNumber) {
            if (!phoneRegex.test(phoneNumber)) {
                return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
            }
            fieldOfficer.phoneNumber = phoneNumber;
        }
        if (password) {
            const { validatePassword } = require('../utils/passwordValidation');
            const result = validatePassword(password, fieldOfficer.email || '');
            if (!result.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid password',
                    errors: result.errors
                });
            }
            fieldOfficer.password = password;
        }
        
        await fieldOfficer.save();
        
        res.json({
            success: true,
            message: 'Field officer updated successfully',
            fieldOfficer: {
                id: fieldOfficer.id,
                name: fieldOfficer.name,
                email: fieldOfficer.email,
                phoneNumber: fieldOfficer.phoneNumber,
                status: fieldOfficer.status
            }
        });
    } catch (error) {
        console.error('Error updating field officer:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating field officer'
        });
    }
};

// Toggle Field Officer Status
exports.toggleFieldOfficerStatus = async (req, res) => {
    try {
        const vendorId = req.userId;
        const { id } = req.params;
        
        const fieldOfficer = await FieldOfficer.findOne({
            where: { 
                id,
                vendor: vendorId
            }
        });
        
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
            fieldOfficer
        });
    } catch (error) {
        console.error('Error toggling field officer status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error toggling field officer status'
        });
    }
};

// Delete Field Officer
exports.deleteFieldOfficer = async (req, res) => {
    try {
        const vendorId = req.userId;
        const { id } = req.params;
        
        const fieldOfficer = await FieldOfficer.findOne({
            where: { 
                id,
                vendor: vendorId
            }
        });
        
        if (!fieldOfficer) {
            return res.status(404).json({
                success: false,
                message: 'Field officer not found'
            });
        }
        
        await fieldOfficer.destroy();
        
        res.json({
            success: true,
            message: 'Field officer deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting field officer:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting field officer'
        });
    }
};
