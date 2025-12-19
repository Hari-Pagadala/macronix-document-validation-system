const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  console.log('[Auth] Checking token...', { authHeader: authHeader.substring(0, 20) + '...', hasToken: !!token });
  
  if (!token) {
    console.log('[Auth] No token provided');
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log('[Auth] Token decoded, role:', decoded.role);
    if (decoded.role !== 'field_officer') {
      console.log('[Auth] Wrong role:', decoded.role);
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    req.fieldOfficerId = decoded.id;
    console.log('[Auth] Authorization successful, foId:', decoded.id);
    next();
  } catch (err) {
    console.log('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
