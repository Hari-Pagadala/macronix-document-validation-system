const sequelize = require('./config/database');
const Vendor = require('./models/Vendor_SQL');

async function createVendor() {
    try {
        // Authenticate and sync
        await sequelize.authenticate();
        console.log('✅ Connected to database');
        
        // Create vendor
        const vendor = await Vendor.create({
            name: 'Yamini',
            company: 'Tech Solutions',
            email: 'yamini@gmail.com',
            phoneNumber: '9876543210',
            password: 'hari',
            status: 'active'
        });
        
        console.log('✅ Vendor created successfully:');
        console.log(`   Email: ${vendor.email}`);
        console.log(`   Company: ${vendor.company}`);
        console.log(`   Name: ${vendor.name}`);
        console.log('   Password: hari');
        console.log('\n📝 You can now login at: http://localhost:3000/vendor/login');
        
        process.exit(0);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.log('⚠️  Vendor with this email already exists');
            console.log('   You can login with:');
            console.log('   Email: yamini@gmail.com');
            console.log('   Password: hari');
        } else {
            console.error('❌ Error creating vendor:', error.message);
        }
        process.exit(1);
    }
}

createVendor();
