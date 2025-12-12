const FieldOfficer = require('./models/FieldOfficer_SQL');
const sequelize = require('./config/database');

async function test() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');
        
        // Delete if exists
        await FieldOfficer.destroy({
            where: { email: 'ramesh@techsolution.com' }
        });
        console.log('✅ Cleaned up existing record');
        
        const fo = await FieldOfficer.create({
            name: 'Ramesh Kumar',
            email: 'ramesh@techsolution.com',
            phoneNumber: '9876543210',
            password: 'ramesh123',
            vendor: 'eccb34e3-5825-43a9-b869-089c43891b65',  // Yamini's vendor ID
            vendorName: 'Tech Solutions',
            status: 'active'
        });
        
        console.log('✅ Field officer created:', fo.id);
        console.log('   Name:', fo.name);
        console.log('   Email:', fo.email);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.errors) {
            console.error('Validation errors:', error.errors);
        }
        process.exit(1);
    }
}

test();
