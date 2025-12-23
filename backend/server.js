const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const sequelize = require('./config/database');

dotenv.config();

const app = express();

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url} from ${req.ip}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Headers:', req.headers);
    }
    next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database models
const User = require('./models/User_SQL');
const Vendor = require('./models/Vendor_SQL');
const FieldOfficer = require('./models/FieldOfficer_SQL');
const Record = require('./models/Record_SQL');
const Counter = require('./models/Counter_SQL');
const Verification = require('./models/Verification_SQL');
const CandidateToken = require('./models/CandidateToken_SQL');

// Set up model associations
CandidateToken.belongsTo(Record, { as: 'record', foreignKey: 'recordId' });
Record.hasMany(CandidateToken, { as: 'candidateTokens', foreignKey: 'recordId' });

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
const downloadRoutes = require('./routes/downloadRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const mapRoutes = require('./routes/mapRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/field-officers', fieldOfficerRoutes);
app.use('/api/vendor-portal', vendorPortalRoutes);
app.use('/api/fo-portal', foPortalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/candidate', candidateRoutes); // Public routes for candidate submission
app.use('/api/map', mapRoutes); // Static map image service

// Health check endpoints
app.get('/', (req, res) => {
    res.json({ 
        message: 'Document Validation API is running!',
        status: 'active',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        host: req.hostname,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        time: new Date().toISOString()
    });
});

// Test POST endpoint (no files)
app.post('/api/test-post', (req, res) => {
    console.log('[Test POST] Received test POST request');
    console.log('[Test POST] Body:', req.body);
    res.json({
        ok: true,
        message: 'Test POST successful',
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT} (accessible at http://192.168.1.16:${PORT})`);
});