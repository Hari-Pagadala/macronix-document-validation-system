const Record = require('./models/Record_SQL');
const { Op } = require('sequelize');

(async () => {
  try {
    console.log('\n=== Testing ZIP Download Query Logic ===\n');
    
    const vendor = 'eccb34e3-5825-43a9-b869-089c43891b65';
    const fromDate = '2025-12-19';
    const toDate = '2025-12-20';
    
    console.log('Test Parameters:');
    console.log(`  Vendor: ${vendor}`);
    console.log(`  Date Range: ${fromDate} to ${toDate}`);
    console.log();
    
    // OLD METHOD (using createdAt) - WRONG
    console.log('❌ OLD METHOD (filtering by createdAt):');
    const whereClauseOld = { status: 'approved' };
    if (vendor && vendor !== 'all' && vendor !== '') {
      whereClauseOld.assignedVendor = vendor;
    }
    if (fromDate || toDate) {
      whereClauseOld.createdAt = {};
      if (fromDate) {
        whereClauseOld.createdAt[Op.gte] = new Date(fromDate);
      }
      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999);
        whereClauseOld.createdAt[Op.lte] = toDateObj;
      }
    }
    
    const recordsOld = await Record.findAll({
      where: whereClauseOld,
      attributes: ['id', 'caseNumber', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`   Found ${recordsOld.length} cases`);
    if (recordsOld.length > 0) {
      recordsOld.forEach(r => {
        console.log(`   - ${r.caseNumber} (Created: ${r.createdAt.toISOString().split('T')[0]}, Updated: ${r.updatedAt.toISOString().split('T')[0]})`);
      });
    }
    console.log();
    
    // NEW METHOD (using updatedAt) - CORRECT
    console.log('✅ NEW METHOD (filtering by updatedAt - approval date):');
    const whereClauseNew = { status: 'approved' };
    if (vendor && vendor !== 'all' && vendor !== '') {
      whereClauseNew.assignedVendor = vendor;
    }
    if (fromDate || toDate) {
      whereClauseNew.updatedAt = {};
      if (fromDate) {
        whereClauseNew.updatedAt[Op.gte] = new Date(fromDate);
      }
      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999);
        whereClauseNew.updatedAt[Op.lte] = toDateObj;
      }
    }
    
    const recordsNew = await Record.findAll({
      where: whereClauseNew,
      attributes: ['id', 'caseNumber', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`   Found ${recordsNew.length} cases`);
    if (recordsNew.length > 0) {
      recordsNew.forEach(r => {
        console.log(`   - ${r.caseNumber} (Created: ${r.createdAt.toISOString().split('T')[0]}, Approved: ${r.updatedAt.toISOString().split('T')[0]})`);
      });
    }
    console.log();
    
    console.log('=== Summary ===');
    console.log(`Old method (createdAt): ${recordsOld.length} cases ❌`);
    console.log(`New method (updatedAt): ${recordsNew.length} cases ✅`);
    console.log();
    
    if (recordsNew.length > recordsOld.length) {
      console.log('✅ FIX SUCCESSFUL! The new method correctly finds cases approved within the date range.');
    } else {
      console.log('⚠️  Both methods return the same results. The issue might be elsewhere.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
