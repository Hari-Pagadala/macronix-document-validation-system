const sequelize = require('./config/database');

const migrateStatus = async () => {
    try {
        // Alter the enum type to include 'stopped'
        await sequelize.query(`
            ALTER TYPE enum_records_status ADD VALUE 'stopped';
        `);
        console.log('✅ Successfully added "stopped" status to enum_records_status');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('✅ "stopped" status already exists in enum');
        } else {
            console.error('❌ Error adding status:', error.message);
        }
    } finally {
        await sequelize.close();
    }
};

migrateStatus();
