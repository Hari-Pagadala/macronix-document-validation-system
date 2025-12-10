const sequelize = require('./config/database');
const dotenv = require('dotenv');

dotenv.config();

async function addManualEntryFields() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // Add missing fields for manual entry
        const fieldsToAdd = [
            { name: 'contactNumber', type: 'VARCHAR(255)' },
            { name: 'email', type: 'VARCHAR(255)' },
            { name: 'address', type: 'TEXT' },
            { name: 'state', type: 'VARCHAR(255)' },
            { name: 'district', type: 'VARCHAR(255)' },
            { name: 'pincode', type: 'VARCHAR(20)' }
        ];

        for (const field of fieldsToAdd) {
            try {
                await sequelize.query(`
                    ALTER TABLE records 
                    ADD COLUMN IF NOT EXISTS "${field.name}" ${field.type};
                `);
                console.log(`✅ Added ${field.name} column`);
            } catch (error) {
                console.log(`⚠️ Column ${field.name} might already exist or error:`, error.message);
            }
        }

        console.log('✅ All manual entry fields added successfully');

        await sequelize.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

addManualEntryFields();
