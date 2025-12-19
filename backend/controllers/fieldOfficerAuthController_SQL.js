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

    // Fetch vendor name if available (defensive: vendor may be missing)
    let vendorName = officer.vendorName;
    try {
      const Vendor = require('../models/Vendor_SQL');
      const vendorDoc = await Vendor.findByPk(officer.vendor);
      if (vendorDoc && vendorDoc.company) {
        vendorName = vendorDoc.company;
      }
    } catch (vendorErr) {
      console.error('FO login vendor lookup failed:', vendorErr.message);
    }

    const token = jwt.sign({ id: officer.id, role: 'field_officer' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const profile = {
      id: officer.id,
      name: officer.name,
      email: officer.email,
      phoneNumber: officer.phoneNumber,
      vendorId: officer.vendor,
      vendorName: vendorName || 'Not available',
      role: 'Field Officer',
    };

    res.json({
      success: true,
      token,
      user: {
        id: officer.id,
        name: officer.name,
        email: officer.email
      },
      fieldOfficer: profile
    });
  } catch (error) {
    console.error('FO login error:', error);
    res.status(500).json({ success: false, message: 'Server error logging in' });
  }
};
