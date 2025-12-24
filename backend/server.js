const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment configuration based on NODE_ENV
const { loadEnvironmentConfig, getEnvironmentConfig } = require('./config/environmentConfig');
loadEnvironmentConfig();

const sequelize = require('./config/database');
const envConfig = getEnvironmentConfig();

const app = express();

// Process-level diagnostics to capture unexpected exits
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection:', reason);
});
process.on('exit', (code) => {
    console.log(`👋 Process exiting with code ${code}`);
});
process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT');
});

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
let dbConnected = false;

const initializeDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL Connected Successfully!');
        
        // Enable alter to evolve schema with new manual-entry fields
        await sequelize.sync({ alter: true });
        console.log('✅ Database tables synchronized!');
        
        dbConnected = true;
    } catch (err) {
        console.error('❌ Database Connection Error:', err.message);
        console.error('⚠️  Make sure PostgreSQL is running on localhost:5432');
        console.error('   Try: docker-compose up -d db');
        // Don't exit, let the app continue but routes will fail gracefully
    }
};

initializeDatabase();

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
const shortLinkRoutes = require('./routes/shortLink');

// Database connection check middleware (for API routes that need database)
const requireDatabase = (req, res, next) => {
    if (!dbConnected) {
        return res.status(503).json({
            success: false,
            message: 'Database connection not available. Make sure PostgreSQL is running.',
            status: 'database_unavailable'
        });
    }
    next();
};

app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api/records', requireDatabase, recordRoutes);
app.use('/api/vendors', requireDatabase, vendorRoutes);
app.use('/api/field-officers', requireDatabase, fieldOfficerRoutes);
app.use('/api/vendor-portal', requireDatabase, vendorPortalRoutes);
app.use('/api/fo-portal', requireDatabase, foPortalRoutes);
app.use('/api/reports', requireDatabase, reportRoutes);
app.use('/api/download', requireDatabase, downloadRoutes);
app.use('/api/candidate', requireDatabase, candidateRoutes); // Public routes for candidate submission
app.use('/api/map', mapRoutes); // Static map image service (doesn't need DB)
app.use('/c', requireDatabase, shortLinkRoutes); // Short link redirects

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

const PORT = envConfig.port;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT} (accessible at http://192.168.1.16:${PORT})`);
});