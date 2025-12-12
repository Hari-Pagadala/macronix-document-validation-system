const sequelize = require('./config/database');
const Vendor = require('./models/Vendor_SQL');

async function resetVendor() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');
        
        // Delete existing vendor with this email
        const deleted = await Vendor.destroy({
            where: { email: 'yamini@gmail.com' }
        });
        
        console.log(`✅ Deleted ${deleted} existing vendor(s)`);
        
        // Create fresh vendor
        const vendor = await Vendor.create({
            name: 'Yamini',
            company: 'Tech Solutions',
            email: 'yamini@gmail.com',
            phoneNumber: '9876543210',
            password: 'hari',
            status: 'active'
        });
        
        console.log('✅ Vendor created successfully:');
        console.log(`   ID: ${vendor.id}`);
        console.log(`   Email: ${vendor.email}`);
        console.log(`   Company: ${vendor.company}`);
        console.log(`   Name: ${vendor.name}`);
        console.log(`   Status: ${vendor.status}`);
        console.log('\n📝 Login credentials:');
        console.log('   Email: yamini@gmail.com');
        console.log('   Password: hari');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetVendor();
