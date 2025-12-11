const Record = require('../models/Record_SQL');
const Counter = require('../models/Counter_SQL');
const Vendor = require('../models/Vendor_SQL');
const FieldOfficer = require('../models/FieldOfficer_SQL');
const { Op } = require('sequelize');

// Generate reference number
const generateReferenceNumber = async () => {
    let counter = await Counter.findOne({ where: { name: 'recordRef' } });
    if (!counter) {
        counter = await Counter.create({ name: 'recordRef', value: 0 });
    }
    counter.value += 1;
    await counter.save();
    return `REC-${new Date().getFullYear()}-${String(counter.value).padStart(5, '0')}`;
};

// Create manual record
exports.createManualRecord = async (req, res) => {
    try {
        const {
            caseNumber,
            firstName,
            lastName,
            contactNumber,
            email,
            address,
            state,
            district,
            pincode,
            remarks
        } = req.body;

        if (!caseNumber) {
            return res.status(400).json({
                success: false,
                message: 'Case Number is required'
            });
        }

        const existingCase = await Record.findOne({ where: { caseNumber } });
        if (existingCase) {
            return res.status(400).json({
                success: false,
                message: 'Case Number already exists'
            });
        }
        
        const referenceNumber = await generateReferenceNumber(); // Macronix reference
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        
        const record = await Record.create({
            caseNumber,
            referenceNumber,
            firstName,
            lastName,
            fullName,
            contactNumber,
            email,
            address,
            state,
            district,
            pincode,
            status: 'pending',
            remarks
        });
        
        res.status(201).json({
            success: true,
            message: 'Record created successfully',
            record
        });
    } catch (error) {
        console.error('Error creating manual record:', error);
        
        // Handle validation errors
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Server error creating record'
        });
    }
};

// Bulk upload
exports.bulkUpload = async (req, res) => {
    try {
        const { records } = req.body;

        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No records provided'
            });
        }

        const results = {
            success: [],
            failed: [],
            totalRecords: records.length
        };

        // Process each record
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            try {
                // Validate required field
                if (!record.caseNumber || record.caseNumber.toString().trim() === '') {
                    results.failed.push({
                        rowNumber: i + 2, // Row number in Excel (1-indexed + header)
                        caseNumber: record.caseNumber,
                        error: 'Case Number is required'
                    });
                    continue;
                }

                // Check if case number already exists
                const existingCase = await Record.findOne({
                    where: { caseNumber: record.caseNumber.toString().trim() }
                });

                if (existingCase) {
                    results.failed.push({
                        rowNumber: i + 2,
                        caseNumber: record.caseNumber,
                        error: 'Case Number already exists'
                    });
                    continue;
                }

                // Generate reference number
                const referenceNumber = await generateReferenceNumber();

                // Create full name
                const firstName = (record.firstName || '').toString().trim();
                const lastName = (record.lastName || '').toString().trim();
                const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

                // Create the record
                const newRecord = await Record.create({
                    caseNumber: record.caseNumber.toString().trim(),
                    referenceNumber,
                    firstName,
                    lastName,
                    fullName: fullName || 'N/A',
                    contactNumber: (record.contactNumber || '').toString().trim(),
                    email: (record.email || '').toString().trim(),
                    address: (record.address || '').toString().trim(),
                    state: (record.state || '').toString().trim(),
                    district: (record.district || '').toString().trim(),
                    pincode: (record.pincode || '').toString().trim(),
                    status: 'pending',
                    uploadedDate: new Date()
                });

                results.success.push({
                    rowNumber: i + 2,
                    caseNumber: record.caseNumber,
                    referenceNumber,
                    message: 'Record created successfully'
                });

            } catch (error) {
                console.error(`Error processing row ${i + 2}:`, error);
                results.failed.push({
                    rowNumber: i + 2,
                    caseNumber: record.caseNumber,
                    error: error.message || 'Unknown error'
                });
            }
        }

        res.json({
            success: results.failed.length === 0,
            message: `Upload completed: ${results.success.length} succeeded, ${results.failed.length} failed`,
            results
        });

    } catch (error) {
        console.error('Error in bulk upload:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// Get all records
exports.getAllRecords = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        const where = {};
        if (status && status !== '') {
            where.status = status;
        }
        if (search) {
            where[Op.or] = [
                { referenceNumber: { [Op.like]: `%${search}%` } },
                { caseNumber: { [Op.like]: `%${search}%` } },
                { fullName: { [Op.like]: `%${search}%` } },
                { contactNumber: { [Op.like]: `%${search}%` } }
            ];
        }
        
        const { count, rows } = await Record.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        // Fetch vendor and field officer details for each record
        const recordsWithDetails = await Promise.all(rows.map(async (record) => {
            const recordData = record.toJSON();
            
            if (record.assignedVendor) {
                const vendor = await Vendor.findByPk(record.assignedVendor);
                if (vendor) {
                    recordData.assignedVendorCompanyName = vendor.company;
                    recordData.assignedVendorName = vendor.name;
                }
            }
            
            if (record.assignedFieldOfficer) {
                const officer = await FieldOfficer.findByPk(record.assignedFieldOfficer);
                if (officer) {
                    recordData.assignedFieldOfficerName = officer.name;
                }
            }
            
            return recordData;
        }));
        
        res.json({
            success: true,
            records: recordsWithDetails,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching records'
        });
    }
};

// Get record by ID
exports.getRecordById = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await Record.findByPk(id);
        
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }
        
        const recordData = record.toJSON();
        
        // Fetch and include vendor details
        if (record.assignedVendor) {
            const vendor = await Vendor.findByPk(record.assignedVendor);
            if (vendor) {
                recordData.assignedVendorCompanyName = vendor.company;
                recordData.assignedVendorName = vendor.name;
            }
        }
        
        // Fetch and include field officer details
        if (record.assignedFieldOfficer) {
            const officer = await FieldOfficer.findByPk(record.assignedFieldOfficer);
            if (officer) {
                recordData.assignedFieldOfficerName = officer.name;
            }
        }
        
        res.json({
            success: true,
            record: recordData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching record'
        });
    }
};

// Update record
exports.updateRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const record = await Record.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }
        
        // Remove fields that shouldn't be updated directly
        const { createdAt, updatedAt, referenceNumber, ...safeUpdateData } = updateData;
        
        // Convert empty strings to null for UUID fields
        if (safeUpdateData.assignedVendor === '' || safeUpdateData.assignedVendor === null) {
            safeUpdateData.assignedVendor = null;
        }
        if (safeUpdateData.assignedFieldOfficer === '' || safeUpdateData.assignedFieldOfficer === null) {
            safeUpdateData.assignedFieldOfficer = null;
        }
        
        // Fetch vendor name if vendor ID is provided
        if (safeUpdateData.assignedVendor) {
            const vendor = await Vendor.findByPk(safeUpdateData.assignedVendor);
            if (vendor) {
                safeUpdateData.assignedVendorName = vendor.name;
            }
        } else {
            safeUpdateData.assignedVendorName = null;
        }
        
        // Fetch field officer name if officer ID is provided
        if (safeUpdateData.assignedFieldOfficer) {
            const officer = await FieldOfficer.findByPk(safeUpdateData.assignedFieldOfficer);
            if (officer) {
                safeUpdateData.assignedFieldOfficerName = officer.name;
            }
        } else {
            safeUpdateData.assignedFieldOfficerName = null;
        }
        
        // Auto-update status based on assignments
        if (safeUpdateData.assignedVendor) {
            // If only vendor is assigned
            if (!safeUpdateData.assignedFieldOfficer) {
                if (record.status === 'pending') {
                    safeUpdateData.status = 'vendor_assigned';
                }
            } else {
                // If both vendor and field officer are assigned
                if (record.status === 'pending' || record.status === 'vendor_assigned') {
                    safeUpdateData.status = 'assigned';
                }
                
                // Set assignment date to now if not already set
                if (!safeUpdateData.assignedDate) {
                    safeUpdateData.assignedDate = new Date();
                }
                
                // Calculate TAT due date (7 days from assignment date)
                const assignmentDate = safeUpdateData.assignedDate ? new Date(safeUpdateData.assignedDate) : new Date();
                const tatDueDate = new Date(assignmentDate);
                tatDueDate.setDate(tatDueDate.getDate() + 7);
                safeUpdateData.tatDueDate = tatDueDate;
            }
        } else if (!safeUpdateData.assignedVendor && record.assignedVendor) {
            // If vendor is being removed, revert to pending
            safeUpdateData.status = 'pending';
        }
        
        await record.update(safeUpdateData);
        
        // Fetch updated record with vendor and officer details
        const updatedRecord = await Record.findByPk(id);
        const recordData = updatedRecord.toJSON();
        
        // Add vendor company name
        if (updatedRecord.assignedVendor) {
            const vendor = await Vendor.findByPk(updatedRecord.assignedVendor);
            if (vendor) {
                recordData.assignedVendorCompanyName = vendor.company;
            }
        }
        
        res.json({
            success: true,
            message: 'Record updated successfully',
            record: recordData
        });
    } catch (error) {
        console.error('Error updating record:', error);
        
        // Handle validation errors
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Server error updating record'
        });
    }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalRecords = await Record.count();
        const pendingRecords = await Record.count({ where: { status: 'pending' } });
        const vendorAssignedRecords = await Record.count({ where: { status: 'vendor_assigned' } });
        const assignedRecords = await Record.count({ where: { status: 'assigned' } });
        const submittedRecords = await Record.count({ where: { status: 'submitted' } });
        const approvedRecords = await Record.count({ where: { status: 'approved' } });
        const insufficientRecords = await Record.count({ where: { status: 'insufficient' } });
        const rejectedRecords = await Record.count({ where: { status: 'rejected' } });
        const stoppedRecords = await Record.count({ where: { status: 'stopped' } });
        
        console.log('Dashboard Stats:', {
            totalRecords,
            pendingRecords,
            vendorAssignedRecords,
            assignedRecords,
            submittedRecords,
            approvedRecords,
            insufficientRecords,
            rejectedRecords,
            stoppedRecords
        });
        
        res.json({
            success: true,
            stats: {
                totalRecords,
                pendingRecords,
                vendorAssignedRecords,
                assignedRecords,
                submittedRecords,
                approvedRecords,
                insufficientRecords,
                rejectedRecords,
                stoppedRecords
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching stats: ' + error.message
        });
    }
};

// Stop a record
exports.stopRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const record = await Record.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        // Update record status to stopped
        await record.update({
            status: 'stopped',
            remarks: reason || record.remarks
        });

        res.json({
            success: true,
            message: 'Case stopped successfully',
            record
        });
    } catch (error) {
        console.error('Error stopping record:', error);
        res.status(500).json({
            success: false,
            message: 'Error stopping case: ' + error.message
        });
    }
};

// Revert a stopped record back to pending
exports.revertRecord = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await Record.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        if (record.status !== 'stopped') {
            return res.status(400).json({
                success: false,
                message: 'Only stopped cases can be reverted'
            });
        }

        // Update record status back to pending
        await record.update({
            status: 'pending',
            // Clear assignment when reverting
            assignedVendor: null,
            assignedVendorName: null,
            assignedFieldOfficer: null,
            assignedFieldOfficerName: null,
            assignedDate: null,
            tatDueDate: null
        });

        res.json({
            success: true,
            message: 'Case reverted to Pending successfully',
            record
        });
    } catch (error) {
        console.error('Error reverting record:', error);
        res.status(500).json({
            success: false,
            message: 'Error reverting case: ' + error.message
        });
    }
};
