const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No authentication token, access denied' 
            });
        }
        
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = verified.userId;
        req.userRole = verified.role;
        
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Token verification failed' 
        });
    }
};

module.exports = auth;