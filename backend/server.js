const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const sequelize = require('./config/database');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database models
const User = require('./models/User_SQL');
const Vendor = require('./models/Vendor_SQL');
const FieldOfficer = require('./models/FieldOfficer_SQL');
const Record = require('./models/Record_SQL');
const Counter = require('./models/Counter_SQL');
const Verification = require('./models/Verification_SQL');

// Database connection and sync
sequelize.authenticate()
    .then(() => {
        console.log('✅ PostgreSQL Connected Successfully!');
        // Enable alter to evolve schema with new manual-entry fields
        return sequelize.sync({ alter: true });
    })
    .then(() => {
        console.log('✅ Database tables synchronized!');
    })
    .catch(err => {
        console.error('❌ Database Connection Error:', err.message);
    });

// Routes
const authRoutes = require('./routes/authRoutes');
const recordRoutes = require('./routes/recordRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const fieldOfficerRoutes = require('./routes/fieldOfficerRoutes');
const vendorPortalRoutes = require('./routes/vendorPortalRoutes');
const foPortalRoutes = require('./routes/foPortalRoutes');
const reportRoutes = require('./routes/reportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/field-officers', fieldOfficerRoutes);
app.use('/api/vendor-portal', vendorPortalRoutes);
app.use('/api/fo-portal', foPortalRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'Document Validation API is running!',
        status: 'active',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});