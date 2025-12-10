const FieldOfficer = require('../models/FieldOfficer');
const Vendor = require('../models/Vendor');

// Create field officer
exports.createFieldOfficer = async (req, res) => {
    try {
        const { name, email, phoneNumber, password, vendor } = req.body;
        
        // Validate vendor exists and is active
        const vendorDoc = await Vendor.findById(vendor);
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
        const existingOfficer = await FieldOfficer.findOne({ email });
        if (existingOfficer) {
            return res.status(400).json({
                success: false,
                message: 'Field officer with this email already exists'
            });
        }
        
        const fieldOfficer = new FieldOfficer({
            name,
            email,
            phoneNumber,
            password,
            vendor,
            vendorName: vendorDoc.company
        });
        
        await fieldOfficer.save();
        
        // Add to vendor's field officers list
        vendorDoc.fieldOfficers.push(fieldOfficer._id);
        await vendorDoc.save();
        
        res.status(201).json({
            success: true,
            message: 'Field officer created successfully',
            fieldOfficer: {
                id: fieldOfficer._id,
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
        const { status, vendor } = req.query;
        
        const query = {};
        if (status) {
            query.status = status;
        }
        if (vendor) {
            query.vendor = vendor;
        }
        
        const fieldOfficers = await FieldOfficer.find(query)
            .populate('vendor', 'name company')
            .sort({ createdAt: -1 })
            .select('-password -__v');
        
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

// Get active field officers by vendor
exports.getFieldOfficersByVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;
        
        const fieldOfficers = await FieldOfficer.find({
            vendor: vendorId,
            status: 'active'
        }).select('_id name');
        
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

// Get field officer by ID
exports.getFieldOfficerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const fieldOfficer = await FieldOfficer.findById(id).select('-password -__v');
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
        
        const fieldOfficer = await FieldOfficer.findById(id);
        if (!fieldOfficer) {
            return res.status(404).json({
                success: false,
                message: 'Field officer not found'
            });
        }
        
        // If changing email, check if new email exists
        if (updateData.email && updateData.email !== fieldOfficer.email) {
            const existingOfficer = await FieldOfficer.findOne({ email: updateData.email });
            if (existingOfficer) {
                return res.status(400).json({
                    success: false,
                    message: 'Another field officer with this email already exists'
                });
            }
        }
        
        // If changing vendor, validate new vendor
        if (updateData.vendor && updateData.vendor !== fieldOfficer.vendor.toString()) {
            const vendorDoc = await Vendor.findById(updateData.vendor);
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
            
            // Remove from old vendor
            const oldVendor = await Vendor.findById(fieldOfficer.vendor);
            if (oldVendor) {
                oldVendor.fieldOfficers.pull(fieldOfficer._id);
                await oldVendor.save();
            }
            
            // Add to new vendor
            vendorDoc.fieldOfficers.push(fieldOfficer._id);
            await vendorDoc.save();
            
            updateData.vendorName = vendorDoc.company;
        }
        
        Object.keys(updateData).forEach(key => {
            if (key !== 'password' || updateData[key]) {
                fieldOfficer[key] = updateData[key];
            }
        });
        
        await fieldOfficer.save();
        
        res.json({
            success: true,
            message: 'Field officer updated successfully',
            fieldOfficer: {
                id: fieldOfficer._id,
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
        
        const fieldOfficer = await FieldOfficer.findById(id);
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
                id: fieldOfficer._id,
                name: fieldOfficer.name,
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