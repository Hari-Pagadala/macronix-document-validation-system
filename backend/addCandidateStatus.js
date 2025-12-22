const sequelize = require('./config/database');

async function addCandidateAssignedStatus() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Check if candidate_assigned value already exists
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'enum_records_status'
        AND e.enumlabel = 'candidate_assigned'
      ) AS exists;
    `);

    if (results[0].exists) {
      console.log('✅ candidate_assigned status already exists in enum');
    } else {
      console.log('📝 Adding candidate_assigned to enum_records_status...');
      await sequelize.query(`
        ALTER TYPE enum_records_status ADD VALUE 'candidate_assigned' AFTER 'vendor_assigned';
      `);
      console.log('✅ Successfully added candidate_assigned status');
    }

    // Verify the enum values
    const [enumValues] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'enum_records_status'
      ORDER BY e.enumsortorder;
    `);

    console.log('\n📋 Current status enum values:');
    enumValues.forEach(v => console.log(`  - ${v.enumlabel}`));

    // Check if candidate_tokens table exists
    const [tableCheck] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'candidate_tokens'
      ) AS exists;
    `);

    if (tableCheck[0].exists) {
      console.log('\n✅ candidate_tokens table exists');
      
      // Count records
      const [countResult] = await sequelize.query(`
        SELECT COUNT(*) as count FROM candidate_tokens;
      `);
      console.log(`   Found ${countResult[0].count} tokens`);
    } else {
      console.log('\n⚠️  candidate_tokens table does not exist');
      console.log('   Run the server to create the table with sync({ alter: true })');
    }

    // Check if new columns exist in records table
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'records' 
      AND column_name IN ('candidate_name', 'candidate_email', 'candidate_mobile')
      ORDER BY column_name;
    `);

    if (columns.length === 3) {
      console.log('\n✅ All candidate columns exist in records table');
      columns.forEach(c => console.log(`  - ${c.column_name}`));
    } else {
      console.log('\n⚠️  Some candidate columns are missing from records table:');
      const expected = ['candidate_name', 'candidate_email', 'candidate_mobile'];
      const existing = columns.map(c => c.column_name);
      const missing = expected.filter(c => !existing.includes(c));
      missing.forEach(c => console.log(`  - ${c} (missing)`));
      console.log('   Run the server to add these columns with sync({ alter: true })');
    }

    console.log('\n✅ Migration check complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addCandidateAssignedStatus();
