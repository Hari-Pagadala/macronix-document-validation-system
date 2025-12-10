const Vendor = require('../models/Vendor');
const FieldOfficer = require('../models/FieldOfficer');

// Create vendor
exports.createVendor = async (req, res) => {
    try {
        const { name, company, email, phoneNumber, password } = req.body;
        
        // Check if vendor already exists
        const existingVendor = await Vendor.findOne({ email });
        if (existingVendor) {
            return res.status(400).json({
                success: false,
                message: 'Vendor with this email already exists'
            });
        }
        
        const vendor = new Vendor({
            name,
            company,
            email,
            phoneNumber,
            password
        });
        
        await vendor.save();
        
        res.status(201).json({
            success: true,
            message: 'Vendor created successfully',
            vendor: {
                id: vendor._id,
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
        
        const query = {};
        if (status) {
            query.status = status;
        }
        
        const vendors = await Vendor.find(query)
            .sort({ createdAt: -1 })
            .select('-password -__v');
        
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
        const vendors = await Vendor.find({ status: 'active' })
            .select('_id name company');
        
        res.json({
            success: true,
            vendors
        });
        
    } catch (error) {
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
        
        const vendor = await Vendor.findById(id).select('-password -__v');
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
        
        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        // If changing email, check if new email exists
        if (updateData.email && updateData.email !== vendor.email) {
            const existingVendor = await Vendor.findOne({ email: updateData.email });
            if (existingVendor) {
                return res.status(400).json({
                    success: false,
                    message: 'Another vendor with this email already exists'
                });
            }
        }
        
        Object.keys(updateData).forEach(key => {
            if (key !== 'password' || updateData[key]) {
                vendor[key] = updateData[key];
            }
        });
        
        await vendor.save();
        
        res.json({
            success: true,
            message: 'Vendor updated successfully',
            vendor: {
                id: vendor._id,
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
        
        const vendor = await Vendor.findById(id);
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
            await FieldOfficer.updateMany(
                { vendor: vendor._id },
                { status: 'inactive' }
            );
        }
        
        res.json({
            success: true,
            message: `Vendor ${vendor.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            vendor: {
                id: vendor._id,
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