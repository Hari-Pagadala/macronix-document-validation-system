const Record = require('../models/Record_SQL');
const Vendor = require('../models/Vendor_SQL');
const FieldOfficer = require('../models/FieldOfficer_SQL');
const xlsx = require('xlsx');
const { Op } = require('sequelize');

// Download Cases Report (Excel) with filters
exports.downloadCasesReport = async (req, res) => {
    try {
        const { vendor, status, fromDate, toDate } = req.query;
        
        // Build where clause based on filters
        const where = {};
        
        // Vendor filter
        if (vendor && vendor !== 'all') {
            where.assignedVendor = vendor;
        }
        
        // Status filter
        if (status && status !== 'all') {
            where.status = status;
        }
        
        // Date range filter (using createdAt)
        if (fromDate || toDate) {
            where.createdAt = {};
            if (fromDate) {
                where.createdAt[Op.gte] = new Date(fromDate);
            }
            if (toDate) {
                // Add 1 day to include the entire toDate
                const endDate = new Date(toDate);
                endDate.setDate(endDate.getDate() + 1);
                where.createdAt[Op.lt] = endDate;
            }
        }
        
        // Fetch records with filters
        const records = await Record.findAll({
            where,
            order: [['createdAt', 'DESC']],
            raw: true
        });
        
        if (records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No cases found for the selected filters'
            });
        }
        
        // Fetch vendor and field officer details
        const vendorIds = [...new Set(records.map(r => r.assignedVendor).filter(Boolean))];
        const foIds = [...new Set(records.map(r => r.assignedFieldOfficer).filter(Boolean))];
        
        const vendors = await Vendor.findAll({
            where: { id: { [Op.in]: vendorIds } },
            attributes: ['id', 'company'],
            raw: true
        });
        
        const fieldOfficers = await FieldOfficer.findAll({
            where: { id: { [Op.in]: foIds } },
            attributes: ['id', 'name'],
            raw: true
        });
        
        // Create lookup maps
        const vendorMap = {};
        vendors.forEach(v => { vendorMap[v.id] = v.company; });
        
        const foMap = {};
        fieldOfficers.forEach(fo => { foMap[fo.id] = fo.name; });
        
        // Format data for Excel
        const excelData = records.map(record => ({
            'Case Number': record.caseNumber || 'N/A',
            'MACRONIX Reference': record.referenceNumber || 'N/A',
            'Customer Name': record.fullName || 'N/A',
            'Vendor Name': vendorMap[record.assignedVendor] || record.assignedVendorName || 'N/A',
            'Field Officer': foMap[record.assignedFieldOfficer] || record.assignedFieldOfficerName || 'N/A',
            'Contact': record.contactNumber || 'N/A',
            'Location': record.address || 'N/A',
            'Status': record.status || 'N/A',
            'Case Created Date': record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-GB') : 'N/A',
            'Case Completed Date': record.completionDate ? new Date(record.completionDate).toLocaleDateString('en-GB') : 'N/A'
        }));
        
        // Create workbook and worksheet
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(excelData);
        
        // Set column widths
        worksheet['!cols'] = [
            { wch: 15 }, // Case Number
            { wch: 20 }, // MACRONIX Reference
            { wch: 25 }, // Customer Name
            { wch: 25 }, // Vendor Name
            { wch: 20 }, // Field Officer
            { wch: 15 }, // Contact
            { wch: 35 }, // Location
            { wch: 12 }, // Status
            { wch: 18 }, // Case Created Date
            { wch: 18 }  // Case Completed Date
        ];
        
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Cases Report');
        
        // Generate buffer
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `Cases_Report_${timestamp}.xlsx`;
        
        // Set headers and send file
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
        
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({
            success: false,
            message: 'Server error generating report'
        });
    }
};

// Download Vendor Cases Report (for Vendor Dashboard)
exports.downloadVendorCasesReport = async (req, res) => {
    try {
        const vendorId = req.userId; // From vendor auth middleware
        const { status, fromDate, toDate } = req.query;
        
        console.log('Vendor Download Request:', { vendorId, status, fromDate, toDate });
        
        // Build where clause
        const where = { assignedVendor: vendorId };
        
        // Status filter
        if (status && status !== 'all') {
            where.status = status;
        }
        
        // Date range filter
        if (fromDate || toDate) {
            where.createdAt = {};
            if (fromDate) {
                where.createdAt[Op.gte] = new Date(fromDate);
            }
            if (toDate) {
                const endDate = new Date(toDate);
                endDate.setDate(endDate.getDate() + 1);
                where.createdAt[Op.lt] = endDate;
            }
        }
        
        console.log('Query where clause:', JSON.stringify(where, null, 2));
        
        // Fetch records
        const records = await Record.findAll({
            where,
            order: [['createdAt', 'DESC']],
            raw: true
        });
        
        console.log(`Found ${records.length} records for vendor ${vendorId}`);
        
        if (records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No cases found for the selected filters. Try adjusting the date range or status filter.'
            });
        }
        
        // Fetch vendor and field officer details
        const vendor = await Vendor.findByPk(vendorId, { attributes: ['company'], raw: true });
        const foIds = [...new Set(records.map(r => r.assignedFieldOfficer).filter(Boolean))];
        
        const fieldOfficers = await FieldOfficer.findAll({
            where: { id: { [Op.in]: foIds } },
            attributes: ['id', 'name'],
            raw: true
        });
        
        const foMap = {};
        fieldOfficers.forEach(fo => { foMap[fo.id] = fo.name; });
        
        // Format data for Excel
        const excelData = records.map(record => ({
            'Case Number': record.caseNumber || 'N/A',
            'MACRONIX Reference': record.referenceNumber || 'N/A',
            'Customer Name': record.fullName || 'N/A',
            'Vendor Name': vendor?.company || 'N/A',
            'Field Officer': foMap[record.assignedFieldOfficer] || 'N/A',
            'Contact': record.contactNumber || 'N/A',
            'Location': record.address || 'N/A',
            'Status': record.status || 'N/A',
            'Case Created Date': record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-GB') : 'N/A',
            'Case Completed Date': record.completionDate ? new Date(record.completionDate).toLocaleDateString('en-GB') : 'N/A'
        }));
        
        // Create workbook
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(excelData);
        
        worksheet['!cols'] = [
            { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 20 },
            { wch: 15 }, { wch: 35 }, { wch: 12 }, { wch: 18 }, { wch: 18 }
        ];
        
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Vendor Cases');
        
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `Vendor_Cases_${timestamp}.xlsx`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
        
    } catch (error) {
        console.error('Error generating vendor report:', error);
        res.status(500).json({
            success: false,
            message: 'Server error generating report'
        });
    }
};
