const jwt = require('jsonwebtoken');
const FieldOfficer = require('../models/FieldOfficer_SQL');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const officer = await FieldOfficer.findOne({ where: { email } });
    if (!officer) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (officer.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account inactive' });
    }

    // Compare hashed password
    const isMatch = await officer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: officer.id, role: 'field_officer' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: officer.id,
        name: officer.name,
        email: officer.email
      }
    });
  } catch (error) {
    console.error('FO login error:', error);
    res.status(500).json({ success: false, message: 'Server error logging in' });
  }
};
