const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Counter = require('./models/Counter');

async function initialize() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Create admin user
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        
        if (!existingAdmin) {
            const admin = new User({
                name: 'Super Admin',
                email: 'admin@example.com',
                password: 'admin123',
                role: 'super_admin'
            });
            
            await admin.save();
            console.log('✅ Super Admin created successfully!');
            console.log('📧 Email: admin@example.com');
            console.log('🔑 Password: admin123');
        } else {
            console.log('⚠️  Admin user already exists');
        }
        
        // Initialize counter
        await Counter.findOneAndUpdate(
            { name: 'recordRef' },
            { $setOnInsert: { value: 0 } },
            { upsert: true }
        );
        console.log('✅ Counter initialized');
        
        mongoose.disconnect();
        console.log('✅ Initialization completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

initialize();