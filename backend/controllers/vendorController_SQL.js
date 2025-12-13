const Vendor = require('../models/Vendor_SQL');
const FieldOfficer = require('../models/FieldOfficer_SQL');
const { validatePassword } = require('../utils/passwordValidation');

// Create vendor
exports.createVendor = async (req, res) => {
    try {
        const { name, company, email, phoneNumber, password } = req.body;
        
        // Validate password
        const passwordValidation = validatePassword(password, email);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password validation failed',
                errors: passwordValidation.errors
            });
        }
        
        // Check if vendor already exists
        const existingVendor = await Vendor.findOne({ where: { email } });
        if (existingVendor) {
            return res.status(400).json({
                success: false,
                message: 'Vendor with this email already exists'
            });
        }
        
        const vendor = await Vendor.create({
            name,
            company,
            email,
            phoneNumber,
            password
        });
        
        res.status(201).json({
            success: true,
            message: 'Vendor created successfully',
            vendor: {
                id: vendor.id,
                name: vendor.name,
                company: vendor.company,
                email: vendor.email,
                phoneNumber: vendor.phoneNumber,
                status: vendor.status
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error creating vendor'
        });
    }
};

// Get all vendors
exports.getAllVendors = async (req, res) => {
    try {
        const { status } = req.query;
        
        const where = {};
        if (status) {
            where.status = status;
        }
        
        const vendors = await Vendor.findAll({
            where,
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['password'] }
        });
        
        res.json({
            success: true,
            vendors
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching vendors'
        });
    }
};

// Get active vendors (for dropdowns)
exports.getActiveVendors = async (req, res) => {
    try {
        const vendors = await Vendor.findAll({
            where: { status: 'active' },
            attributes: ['id', 'name', 'company']
        });
        
        res.json({
            success: true,
            vendors
        });
        
    } catch (error) {
        console.error('Error fetching active vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching active vendors'
        });
    }
};

// Get vendor by ID
exports.getVendorById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const vendor = await Vendor.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        res.json({
            success: true,
            vendor
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching vendor'
        });
    }
};

// Update vendor
exports.updateVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const vendor = await Vendor.findByPk(id);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        // If changing email, check if new email exists
        if (updateData.email && updateData.email !== vendor.email) {
            const existingVendor = await Vendor.findOne({ where: { email: updateData.email } });
            if (existingVendor) {
                return res.status(400).json({
                    success: false,
                    message: 'Another vendor with this email already exists'
                });
            }
        }
        
        // If password provided, validate and enforce simple reuse policy
        if (updateData.password) {
            const passwordValidation = validatePassword(updateData.password, updateData.email || vendor.email);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Password validation failed',
                    errors: passwordValidation.errors
                });
            }
            // Disallow setting the same password as current
            if (updateData.password === vendor.password) {
                return res.status(400).json({
                    success: false,
                    message: 'New password cannot be the same as current password'
                });
            }
        }

        await vendor.update(updateData);
        
        res.json({
            success: true,
            message: 'Vendor updated successfully',
            vendor: {
                id: vendor.id,
                name: vendor.name,
                company: vendor.company,
                email: vendor.email,
                phoneNumber: vendor.phoneNumber,
                status: vendor.status
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error updating vendor'
        });
    }
};

// Toggle vendor status
exports.toggleVendorStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const vendor = await Vendor.findByPk(id);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        vendor.status = vendor.status === 'active' ? 'inactive' : 'active';
        await vendor.save();
        
        // If vendor is deactivated, also deactivate all field officers
        if (vendor.status === 'inactive') {
            await FieldOfficer.update(
                { status: 'inactive' },
                { where: { vendor: vendor.id } }
            );
        }
        
        res.json({
            success: true,
            message: `Vendor ${vendor.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            vendor: {
                id: vendor.id,
                name: vendor.name,
                company: vendor.company,
                status: vendor.status
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error toggling vendor status'
        });
    }
};
