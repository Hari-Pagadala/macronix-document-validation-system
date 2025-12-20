const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres', 'postgres', 'PostGreDb', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // Check approved cases
    const [approved] = await sequelize.query(`
      SELECT id, "caseNumber", "referenceNumber", status, "assignedVendor", "createdAt"::text as created
      FROM records_sql 
      WHERE status = 'approved' 
      ORDER BY "createdAt" DESC 
      LIMIT 10
    `);
    
    console.log(`Found ${approved.length} approved cases:`);
    approved.forEach(r => {
      console.log(`  - ${r.caseNumber} | Vendor: ${r.assignedVendor} | Date: ${r.created}`);
    });

    console.log('\n--- Checking specific vendor ---');
    const vendorId = 'eccb34e3-5825-43a9-b869-089c43891b65';
    const [vendorCases] = await sequelize.query(`
      SELECT id, "caseNumber", status, "createdAt"::text as created
      FROM records_sql 
      WHERE "assignedVendor" = :vendorId
      ORDER BY "createdAt" DESC
    `, { replacements: { vendorId } });
    
    console.log(`Cases for vendor ${vendorId}: ${vendorCases.length}`);
    vendorCases.forEach(r => {
      console.log(`  - ${r.caseNumber} | Status: ${r.status} | Date: ${r.created}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
