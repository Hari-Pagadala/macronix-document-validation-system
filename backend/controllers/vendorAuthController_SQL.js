const Vendor = require('../models/Vendor_SQL');
const jwt = require('jsonwebtoken');

// Vendor Login
exports.vendorLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const vendor = await Vendor.findOne({ where: { email } });
        if (!vendor) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        const isPasswordValid = await vendor.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        if (vendor.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }
        
        const token = jwt.sign(
            { 
                userId: vendor.id, 
                role: 'vendor',
                vendorId: vendor.id,
                company: vendor.company
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: vendor.id,
                name: vendor.name,
                email: vendor.email,
                company: vendor.company,
                role: 'vendor'
            }
        });
        
    } catch (error) {
        console.error('Vendor login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// Get Vendor Profile
exports.getVendorProfile = async (req, res) => {
    try {
        const vendor = await Vendor.findByPk(req.userId, {
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
        console.error('Get vendor profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update Vendor Profile
exports.updateVendorProfile = async (req, res) => {
    try {
        const { name, phoneNumber } = req.body;
        
        const vendor = await Vendor.findByPk(req.userId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        if (name) vendor.name = name;
        if (phoneNumber) vendor.phoneNumber = phoneNumber;
        
        await vendor.save();
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            vendor: {
                id: vendor.id,
                name: vendor.name,
                company: vendor.company,
                email: vendor.email,
                phoneNumber: vendor.phoneNumber
            }
        });
    } catch (error) {
        console.error('Update vendor profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Change Vendor Password
exports.changeVendorPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const vendor = await Vendor.findByPk(req.userId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        const isPasswordValid = await vendor.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        vendor.password = newPassword;
        await vendor.save();
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change vendor password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
