const Record = require('./models/Record_SQL');

(async () => {
  try {
    // Check all approved cases
    const allApproved = await Record.findAll({
      where: { status: 'approved' },
      attributes: ['id', 'caseNumber', 'assignedVendor', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 15
    });
    
    console.log(`\n✅ Found ${allApproved.length} approved cases:\n`);
    allApproved.forEach(r => {
      console.log(`  ${r.caseNumber} | Vendor: ${r.assignedVendor || 'None'} | Created: ${r.createdAt}`);
    });

    // Check specific vendor
    const vendorId = 'eccb34e3-5825-43a9-b869-089c43891b65';
    const vendorCases = await Record.findAll({
      where: { assignedVendor: vendorId },
      attributes: ['id', 'caseNumber', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`\n\n📊 Cases assigned to vendor ${vendorId}: ${vendorCases.length}\n`);
    vendorCases.forEach(r => {
      console.log(`  ${r.caseNumber} | Status: ${r.status} | Created: ${r.createdAt}`);
    });

    // Check with date filter using updatedAt (approval date)
    const fromDate = new Date('2025-12-18');
    const toDate = new Date('2025-12-20');
    toDate.setHours(23, 59, 59, 999);

    const { Op } = require('sequelize');
    const filteredCases = await Record.findAll({
      where: {
        status: 'approved',
        assignedVendor: vendorId,
        updatedAt: {
          [Op.gte]: fromDate,
          [Op.lte]: toDate
        }
      },
      attributes: ['id', 'caseNumber', 'createdAt', 'updatedAt']
    });

    console.log(`\n\n🔍 Filtered (approved + vendor + updatedAt Dec 18-20): ${filteredCases.length}\n`);
    filteredCases.forEach(r => {
      console.log(`  ${r.caseNumber} | Created: ${r.createdAt.toISOString().split('T')[0]} | Approved: ${r.updatedAt.toISOString().split('T')[0]}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
