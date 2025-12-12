const jwt = require('jsonwebtoken');

// Middleware to check if user is a vendor
const vendorAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No authentication token, access denied' 
            });
        }
        
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        if (verified.role !== 'vendor') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Vendor only.' 
            });
        }
        
        req.userId = verified.userId;
        req.userRole = verified.role;
        req.vendorId = verified.vendorId;
        req.company = verified.company;
        
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Token verification failed' 
        });
    }
};

module.exports = vendorAuth;
