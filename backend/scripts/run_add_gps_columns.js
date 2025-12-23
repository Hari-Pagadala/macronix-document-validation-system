const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
  logging: console.log
});

async function addGPSColumns() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.query(`
      ALTER TABLE records
      ADD COLUMN IF NOT EXISTS "gpsLat" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "gpsLng" VARCHAR(255);
    `);

    await sequelize.query(`
      ALTER TABLE records
      ADD COLUMN IF NOT EXISTS "submittedGpsLat" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "submittedGpsLng" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "gpsDistanceMeters" DOUBLE PRECISION;
    `);

    console.log('✅ GPS columns added successfully (uploaded + submitted + distance)!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addGPSColumns();
