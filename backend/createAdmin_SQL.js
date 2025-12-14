const sequelize = require('./config/database');
const User = require('./models/User_SQL');
const Counter = require('./models/Counter_SQL');
require('dotenv').config();

async function initialize() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to PostgreSQL');
        
        // Sync all models
        await sequelize.sync({ alter: false });
        console.log('✅ Database tables created/synchronized');
        
        // Create admin user
        const existingAdmin = await User.findOne({ where: { email: 'purna@macronix.com' } });
        
        if (!existingAdmin) {
            const admin = await User.create({
                name: 'Purna Admin',
                email: 'purna@macronix.com',
                password: 'December@2025',
                role: 'super_admin'
            });
            console.log('✅ Super Admin created successfully!');
            console.log('📧 Email: purna@macronix.com');
            console.log('🔑 Password: December@2025');
        } else {
            console.log('⚠️  Admin user already exists');
        }
        
        // Initialize counter
        const counter = await Counter.findOne({ where: { name: 'recordRef' } });
        if (!counter) {
            await Counter.create({ name: 'recordRef', value: 0 });
            console.log('✅ Counter initialized');
        }
        
        console.log('✅ Initialization completed!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

initialize();
