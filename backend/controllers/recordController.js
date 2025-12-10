const Record = require('../models/Record');
const Vendor = require('../models/Vendor');
const FieldOfficer = require('../models/FieldOfficer');

// Bulk upload from Excel
exports.bulkUpload = async (req, res) => {
    try {
        const { records, fileName } = req.body;
        const uploadedBy = req.userId;
        
        if (!records || !Array.isArray(records)) {
            return res.status(400).json({
                success: false,
                message: 'No records provided'
            });
        }
        
        const successfulRecords = [];
        const failedRecords = [];
        const batchId = `BATCH-${Date.now()}`;
        
        for (let i = 0; i < records.length; i++) {
            const recordData = records[i];
            
            try {
                // Validate required fields
                if (!recordData.caseNumber) {
                    throw new Error('Case Number is required');
                }
                if (!recordData.firstName || !recordData.lastName || !recordData.contactNumber) {
                    throw new Error('Missing required customer fields');
                }
                
                // Check if case number already exists
                const existingCase = await Record.findOne({ caseNumber: recordData.caseNumber });
                if (existingCase) {
                    throw new Error(`Case number ${recordData.caseNumber} already exists`);
                }
                
                const record = new Record({
                    ...recordData,
                    uploadedBy: uploadedBy,
                    batchId: batchId,
                    source: 'excel'
                });
                
                await record.save();
                
                successfulRecords.push({
                    caseNumber: record.caseNumber,
                    referenceNumber: record.referenceNumber,
                    row: i + 1
                });
                
            } catch (error) {
                failedRecords.push({
                    row: i + 1,
                    caseNumber: recordData.caseNumber || 'N/A',
                    error: error.message
                });
            }
        }
        
        res.status(201).json({
            success: true,
            message: `Upload completed: ${successfulRecords.length} successful, ${failedRecords.length} failed`,
            batchId,
            total: records.length,
            successful: successfulRecords.length,
            failed: failedRecords.length,
            referenceNumbers: successfulRecords.map(r => r.referenceNumber),
            failedRecords: failedRecords
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during bulk upload'
        });
    }
};

// Create manual entry
exports.createManualRecord = async (req, res) => {
    try {
        const recordData = req.body;
        const uploadedBy = req.userId;
        
        // Validate required fields
        if (!recordData.caseNumber) {
            return res.status(400).json({
                success: false,
                message: 'Case Number is required'
            });
        }
        
        // Check if case number already exists
        const existingCase = await Record.findOne({ caseNumber: recordData.caseNumber });
        if (existingCase) {
            return res.status(400).json({
                success: false,
                message: `Case number ${recordData.caseNumber} already exists`
            });
        }
        
        const record = new Record({
            ...recordData,
            uploadedBy: uploadedBy,
            source: 'manual'
        });
        
        await record.save();
        
        res.status(201).json({
            success: true,
            message: 'Record created successfully',
            record
        });
        
    } catch (error) {
        console.error('Error creating manual record:', error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
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

// Get all records with filters
exports.getAllRecords = async (req, res) => {
    try {
        const { 
            status, 
            search, 
            page = 1, 
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        
        const query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { referenceNumber: { $regex: search, $options: 'i' } },
                { caseNumber: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { contactNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Record.countDocuments(query);
        
        const records = await Record.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('assignedVendor', 'name company')
            .populate('assignedFieldOfficer', 'name')
            .select('-__v');
        
        res.json({
            success: true,
            records,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching records'
        });
    }
};

// Get single record
exports.getRecordById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const record = await Record.findById(id)
            .populate('assignedVendor', 'name company email phoneNumber')
            .populate('assignedFieldOfficer', 'name email phoneNumber')
            .populate('uploadedBy', 'name email');
        
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }
        
        // Extract vendor company name and field officer name
        const recordData = record.toObject();
        if (record.assignedVendor) {
            recordData.assignedVendorCompanyName = record.assignedVendor.company;
            recordData.assignedVendorName = record.assignedVendor.name;
        }
        if (record.assignedFieldOfficer) {
            recordData.assignedFieldOfficerName = record.assignedFieldOfficer.name;
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
        
        const record = await Record.findById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }
        
        // If vendor is changed, clear field officer
        if (updateData.assignedVendor && updateData.assignedVendor !== record.assignedVendor?.toString()) {
            updateData.assignedFieldOfficer = null;
        }
        
        // If assigning vendor, update status and date
        if (updateData.assignedVendor && !record.assignedVendor) {
            updateData.status = 'assigned';
            updateData.assignedDate = new Date();
        }
        
        Object.keys(updateData).forEach(key => {
            record[key] = updateData[key];
        });
        
        await record.save();
        
        // Populate and extract names for response
        await record.populate('assignedVendor', 'name company email phoneNumber');
        await record.populate('assignedFieldOfficer', 'name email phoneNumber');
        
        const recordData = record.toObject();
        if (record.assignedVendor) {
            recordData.assignedVendorCompanyName = record.assignedVendor.company;
            recordData.assignedVendorName = record.assignedVendor.name;
        }
        if (record.assignedFieldOfficer) {
            recordData.assignedFieldOfficerName = record.assignedFieldOfficer.name;
        }
        
        res.json({
            success: true,
            message: 'Record updated successfully',
            record: recordData
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error updating record'
        });
    }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalRecords,
            pendingRecords,
            assignedRecords,
            inProgressRecords,
            submittedRecords,
            approvedRecords,
            vendorsCount,
            fieldOfficersCount
        ] = await Promise.all([
            Record.countDocuments(),
            Record.countDocuments({ status: 'pending' }),
            Record.countDocuments({ status: 'assigned' }),
            Record.countDocuments({ status: 'in_progress' }),
            Record.countDocuments({ status: 'submitted' }),
            Record.countDocuments({ status: 'approved' }),
            Vendor.countDocuments({ status: 'active' }),
            FieldOfficer.countDocuments({ status: 'active' })
        ]);
        
        res.json({
            success: true,
            stats: {
                totalRecords,
                pendingRecords,
                assignedRecords,
                inProgressRecords,
                submittedRecords,
                approvedRecords,
                vendorsCount,
                fieldOfficersCount
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching dashboard stats'
        });
    }
};