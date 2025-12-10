const sequelize = require('./config/database');
const dotenv = require('dotenv');

dotenv.config();

async function fixNullValues() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // Remove NOT NULL constraints first
        await sequelize.query(`
            ALTER TABLE records 
            ALTER COLUMN "firstName" DROP NOT NULL;
        `).catch(() => console.log('⚠️ firstName constraint already dropped or not applied'));

        await sequelize.query(`
            ALTER TABLE records 
            ALTER COLUMN "lastName" DROP NOT NULL;
        `).catch(() => console.log('⚠️ lastName constraint already dropped or not applied'));

        await sequelize.query(`
            ALTER TABLE records 
            ALTER COLUMN "contactNumber" DROP NOT NULL;
        `).catch(() => console.log('⚠️ contactNumber constraint already dropped or not applied'));

        await sequelize.query(`
            ALTER TABLE records 
            ALTER COLUMN "address" DROP NOT NULL;
        `).catch(() => console.log('⚠️ address constraint already dropped or not applied'));

        await sequelize.query(`
            ALTER TABLE records 
            ALTER COLUMN "state" DROP NOT NULL;
        `).catch(() => console.log('⚠️ state constraint already dropped or not applied'));

        await sequelize.query(`
            ALTER TABLE records 
            ALTER COLUMN "district" DROP NOT NULL;
        `).catch(() => console.log('⚠️ district constraint already dropped or not applied'));

        await sequelize.query(`
            ALTER TABLE records 
            ALTER COLUMN "pincode" DROP NOT NULL;
        `).catch(() => console.log('⚠️ pincode constraint already dropped or not applied'));

        console.log('✅ Removed NOT NULL constraints temporarily');

        // Update null values with default values
        await sequelize.query(`
            UPDATE records 
            SET "firstName" = 'N/A' 
            WHERE "firstName" IS NULL;
        `);

        await sequelize.query(`
            UPDATE records 
            SET "lastName" = 'N/A' 
            WHERE "lastName" IS NULL;
        `);

        await sequelize.query(`
            UPDATE records 
            SET "contactNumber" = '0000000000' 
            WHERE "contactNumber" IS NULL;
        `);

        await sequelize.query(`
            UPDATE records 
            SET "address" = 'Not provided' 
            WHERE "address" IS NULL;
        `);

        await sequelize.query(`
            UPDATE records 
            SET "state" = 'Not provided' 
            WHERE "state" IS NULL;
        `);

        await sequelize.query(`
            UPDATE records 
            SET "district" = 'Not provided' 
            WHERE "district" IS NULL;
        `);

        await sequelize.query(`
            UPDATE records 
            SET "pincode" = '000000' 
            WHERE "pincode" IS NULL;
        `);

        console.log('✅ Updated records with null values');

        await sequelize.close();
        console.log('✅ Database connection closed');
        console.log('✅ Migration complete! You can now restart the server.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

fixNullValues();
