/**
 * Migration: Alter short_links.record_id to TEXT to support UUID record IDs
 */
const sequelize = require('../config/database');

async function up() {
  await sequelize.query("ALTER TABLE short_links ALTER COLUMN record_id TYPE TEXT USING record_id::TEXT;");
  console.log('✅ short_links.record_id altered to TEXT');
}

async function down() {
  await sequelize.query("ALTER TABLE short_links ALTER COLUMN record_id TYPE INTEGER USING record_id::INTEGER;");
  console.log('✅ short_links.record_id reverted to INTEGER');
}

// Execute if run directly
if (require.main === module) {
  up().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { up, down };
