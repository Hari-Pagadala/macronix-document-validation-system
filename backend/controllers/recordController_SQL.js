const Record = require('../models/Record_SQL');
const Counter = require('../models/Counter_SQL');
const Vendor = require('../models/Vendor_SQL');
const FieldOfficer = require('../models/FieldOfficer_SQL');
const Verification = require('../models/Verification_SQL');
const { geocodeAddress } = require('../utils/geocode');
const { createCandidateToken } = require('../utils/candidateTokenUtils');
const { sendCandidateNotification } = require('../utils/notificationUtils');
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

        // Geocode address to lat/lng (non-blocking on failure)
        const { lat: gpsLat = null, lng: gpsLng = null, error: geoError } = await geocodeAddress({
            address,
            district,
            state,
            pincode
        });
        if (geoError) {
            console.warn('[Geocode] Manual record geocoding failed:', geoError, { caseNumber });
        }
        
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
            gpsLat,
            gpsLng,
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

        // Validation helpers
        const norm = (v) => v === undefined || v === null ? '' : v.toString().replace(/\s+/g, ' ').trim();
        const isAlphaName = (v) => /^[A-Za-z\s'\-]+$/.test(v || '');
        const seenCaseNumbers = new Set();

        // First pass: validate all rows without creating any records
        for (let i = 0; i < records.length; i++) {
            const rowNum = i + 2;
            const r = records[i] || {};

            const caseNumber = norm(r.caseNumber);
            const firstName = norm(r.firstName);
            const lastName = norm(r.lastName);
            const contactNumberRaw = (r.contactNumber || '').toString();
            const contactNumber = contactNumberRaw.replace(/[^0-9]/g, '');
            const email = norm(r.email);
            const address = norm(r.address);
            const state = norm(r.state);
            const district = norm(r.district);
            const pincodeRaw = (r.pincode || r.pin || '').toString();
            const pincode = pincodeRaw.replace(/[^0-9]/g, '');

            // Mandatory fields check
            if (!caseNumber) {
                results.failed.push({ rowNumber: rowNum, caseNumber: caseNumber || null, error: 'Case Number is required' });
                continue;
            }
            if (!firstName) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'First Name is required' });
                continue;
            }
            if (!lastName) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'Last Name is required' });
                continue;
            }
            if (!contactNumber) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'Contact Number is required' });
                continue;
            }
            if (!address) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'Address is required' });
                continue;
            }
            if (!state) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'State is required' });
                continue;
            }
            if (!district) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'District is required' });
                continue;
            }
            if (!pincode) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'Pincode is required' });
                continue;
            }

            // Phone validation
            if (!/^[0-9]{10}$/.test(contactNumber)) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'Contact Number must be numeric and exactly 10 digits' });
                continue;
            }

            // Pincode validation (6 digits)
            if (!/^[0-9]{6}$/.test(pincode)) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'Pincode must be numeric and exactly 6 digits' });
                continue;
            }

            // Name/state/district character restrictions
            if (!isAlphaName(firstName)) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'First Name contains invalid characters' });
                continue;
            }
            if (!isAlphaName(lastName)) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'Last Name contains invalid characters' });
                continue;
            }
            if (!isAlphaName(state)) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'State contains invalid characters' });
                continue;
            }
            if (!isAlphaName(district)) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'District contains invalid characters' });
                continue;
            }

            // Duplicate within file
            if (seenCaseNumbers.has(caseNumber)) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'Duplicate Case Number in uploaded file' });
                continue;
            }
            seenCaseNumbers.add(caseNumber);

            // Check DB for existing case number
            const existingCase = await Record.findOne({ where: { caseNumber } });
            if (existingCase) {
                results.failed.push({ rowNumber: rowNum, caseNumber, error: 'Case Number already exists in system' });
                continue;
            }

            // If passed validation, push a normalized version for creation later
            results.success.push({
                rowNumber: rowNum,
                data: {
                    caseNumber,
                    firstName,
                    lastName,
                    contactNumber,
                    email,
                    address,
                    state,
                    district,
                    pincode
                }
            });
        }

        // If any validation failures, abort and return detailed report (no partial uploads)
        if (results.failed.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Validation failed: ${results.failed.length} rows invalid`,
                results
            });
        }

        // All rows validated — create records in a transaction
        const transaction = await Record.sequelize.transaction();
        try {
            const created = [];
            for (const item of results.success) {
                const r = item.data;
                const referenceNumber = await generateReferenceNumber();
                const fullName = [r.firstName, r.lastName].filter(Boolean).join(' ').trim() || 'N/A';

                const { lat: gpsLat = null, lng: gpsLng = null, error: geoError } = await geocodeAddress({
                    address: r.address,
                    district: r.district,
                    state: r.state,
                    pincode: r.pincode
                });
                if (geoError) {
                    console.warn('[Geocode] Bulk upload geocoding failed:', geoError, { caseNumber: r.caseNumber, row: item.rowNumber });
                }

                const newRecord = await Record.create({
                    caseNumber: r.caseNumber,
                    referenceNumber,
                    firstName: r.firstName,
                    lastName: r.lastName,
                    fullName,
                    contactNumber: r.contactNumber,
                    email: r.email,
                    address: r.address,
                    state: r.state,
                    district: r.district,
                    pincode: r.pincode,
                    gpsLat,
                    gpsLng,
                    status: 'pending',
                    uploadedDate: new Date()
                }, { transaction });

                created.push({ rowNumber: item.rowNumber, caseNumber: r.caseNumber, referenceNumber });
            }

            await transaction.commit();

            res.json({
                success: true,
                message: `Upload completed: ${created.length} records created`,
                results: {
                    success: created,
                    failed: [],
                    totalRecords: records.length
                }
            });
        } catch (err) {
            await transaction.rollback();
            console.error('Error creating records in bulk upload:', err);
            return res.status(500).json({ success: false, message: 'Server error while creating records' });
        }

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
            // For candidate_overdue, we look for candidate_assigned records with expired tokens
            if (status === 'candidate_overdue') {
                where.status = 'candidate_assigned';
            } else if (status === 'late_submission') {
                where.isLateSubmission = true;
            } else {
                where.status = status;
            }
        }
        if (search) {
            const term = `%${search}%`;
            where[Op.or] = [
                { referenceNumber: { [Op.iLike]: term } },
                { caseNumber: { [Op.iLike]: term } },
                { fullName: { [Op.iLike]: term } },
                { contactNumber: { [Op.iLike]: term } }
            ];
        }
        
        const { count, rows } = await Record.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        // Fetch vendor and field officer details for each record
        let recordsWithDetails = await Promise.all(rows.map(async (record) => {
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
            
            // Check if candidate token is expired
            if (record.status === 'candidate_assigned') {
                const CandidateToken = require('../models/CandidateToken_SQL');
                const token = await CandidateToken.findOne({
                    where: { recordId: record.id, isUsed: false },
                    order: [['createdAt', 'DESC']]
                });
                recordData.candidateTokenExpired = token && new Date() > new Date(token.expiresAt);
            }
            
            return recordData;
        }));
        
        // Filter for candidate_overdue if requested
        if (status === 'candidate_overdue') {
            recordsWithDetails = recordsWithDetails.filter(r => r.candidateTokenExpired);
        }
        
        res.json({
            success: true,
            records: recordsWithDetails,
            pagination: {
                total: status === 'candidate_overdue' ? recordsWithDetails.length : count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil((status === 'candidate_overdue' ? recordsWithDetails.length : count) / limit)
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

// Get verification details for a record
exports.getRecordVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const verification = await Verification.findOne({ where: { recordId: id } });
        if (!verification) {
            return res.status(404).json({ success: false, message: 'Verification not found' });
        }
        res.json({ success: true, verification });
    } catch (error) {
        console.error('Error fetching verification:', error);
        res.status(500).json({ success: false, message: 'Server error fetching verification' });
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
        
        // Update fullName if firstName or lastName is being updated
        if (safeUpdateData.firstName || safeUpdateData.lastName) {
            const firstName = safeUpdateData.firstName || record.firstName || '';
            const lastName = safeUpdateData.lastName || record.lastName || '';
            safeUpdateData.fullName = `${firstName} ${lastName}`.trim();
        }
        
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
        
        // If address-related fields changed, re-geocode to update gpsLat/gpsLng
        const addressChanged = (
            safeUpdateData.address !== undefined ||
            safeUpdateData.district !== undefined ||
            safeUpdateData.state !== undefined ||
            safeUpdateData.pincode !== undefined
        );

        if (addressChanged) {
            const newAddress = safeUpdateData.address !== undefined ? safeUpdateData.address : record.address;
            const newDistrict = safeUpdateData.district !== undefined ? safeUpdateData.district : record.district;
            const newState = safeUpdateData.state !== undefined ? safeUpdateData.state : record.state;
            const newPincode = safeUpdateData.pincode !== undefined ? safeUpdateData.pincode : record.pincode;

            const { lat: gpsLat = null, lng: gpsLng = null, error: geoError } = await geocodeAddress({
                address: newAddress,
                district: newDistrict,
                state: newState,
                pincode: newPincode
            });
            if (geoError) {
                console.warn('[Geocode] Update record geocoding failed:', geoError, { id });
            }
            safeUpdateData.gpsLat = gpsLat;
            safeUpdateData.gpsLng = gpsLng;
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

// Force re-geocode of a record's address to refresh gpsLat/gpsLng
exports.reGeocodeRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await Record.findByPk(id);
        if (!record) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }

        const { lat: gpsLat = null, lng: gpsLng = null, error: geoError } = await geocodeAddress({
            address: record.address,
            district: record.district,
            state: record.state,
            pincode: record.pincode
        });
        if (geoError) {
            console.warn('[Geocode] Re-geocode failed:', geoError, { id });
        }

        await record.update({ gpsLat, gpsLng });

        res.json({ success: true, message: 'Record geocoded', record });
    } catch (error) {
        console.error('Error re-geocoding record:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error re-geocoding record' });
    }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalRecords = await Record.count();
        const pendingRecords = await Record.count({ where: { status: 'pending' } });
        const vendorAssignedRecords = await Record.count({ where: { status: 'vendor_assigned' } });
        const candidateAssignedRecords = await Record.count({ where: { status: 'candidate_assigned' } });
        const assignedRecords = await Record.count({ where: { status: 'assigned' } });
        const submittedRecords = await Record.count({ where: { status: 'submitted' } });
        const approvedRecords = await Record.count({ where: { status: 'approved' } });
        const insufficientRecords = await Record.count({ where: { status: 'insufficient' } });
        const rejectedRecords = await Record.count({ where: { status: 'rejected' } });
        const stoppedRecords = await Record.count({ where: { status: 'stopped' } });
        const lateSubmissionRecords = await Record.count({ where: { isLateSubmission: true } });
        
        // Count expired candidate assignments
        const candidateAssignedRecordsList = await Record.findAll({ 
            where: { status: 'candidate_assigned' },
            attributes: ['id']
        });
        
        const CandidateToken = require('../models/CandidateToken_SQL');
        let candidateOverdueRecords = 0;
        
        for (const record of candidateAssignedRecordsList) {
            const token = await CandidateToken.findOne({
                where: { recordId: record.id, isUsed: false },
                order: [['createdAt', 'DESC']]
            });
            
            if (token && new Date() > new Date(token.expiresAt)) {
                candidateOverdueRecords++;
            }
        }
        
        console.log('Dashboard Stats:', {
            totalRecords,
            pendingRecords,
            vendorAssignedRecords,
            candidateAssignedRecords,
            candidateOverdueRecords,
            assignedRecords,
            submittedRecords,
            lateSubmissionRecords,
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
                candidateAssignedRecords,
                candidateOverdueRecords,
                assignedRecords,
                submittedRecords,
                lateSubmissionRecords,
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

// Approve a submitted case
exports.approveRecord = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await Record.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        if (record.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Only submitted cases can be approved'
            });
        }

        // Update record status to approved and set completion date
        await record.update({
            status: 'approved',
            completionDate: new Date()
        });

        res.json({
            success: true,
            message: 'Case approved successfully',
            record
        });
    } catch (error) {
        console.error('Error approving record:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving case: ' + error.message
        });
    }
};

// Reject a submitted case
exports.rejectRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const record = await Record.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        if (record.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Only submitted cases can be rejected'
            });
        }

        // Update record status to rejected and store reason
        // Field Officer must re-verify and resubmit
        await record.update({
            status: 'rejected',
            remarks: reason
        });

        res.json({
            success: true,
            message: 'Case rejected successfully',
            record
        });
    } catch (error) {
        console.error('Error rejecting record:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting case: ' + error.message
        });
    }
};

// Re-initiate a rejected case back to pending
exports.reinitiateRecord = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await Record.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        if (record.status !== 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Only rejected cases can be re-initiated'
            });
        }

        // Update record status back to pending and clear all assignments
        // This allows Super Admin to assign the case to another vendor
        await record.update({
            status: 'pending',
            // Clear all assignments for fresh processing
            assignedVendor: null,
            assignedVendorName: null,
            assignedVendorCompanyName: null,
            assignedFieldOfficer: null,
            assignedFieldOfficerName: null,
            assignedDate: null,
            tatDueDate: null,
            completionDate: null
        });

        res.json({
            success: true,
            message: 'Case re-initiated and moved to Pending successfully',
            record
        });
    } catch (error) {
        console.error('Error re-initiating record:', error);
        res.status(500).json({
            success: false,
            message: 'Error re-initiating case: ' + error.message
        });
    }
};

// Send insufficient case back to the same Field Officer
exports.sendBackToFieldOfficer = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await Record.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        if (record.status !== 'insufficient') {
            return res.status(400).json({
                success: false,
                message: 'Only insufficient cases can be sent back to Field Officer'
            });
        }

        if (!record.assignedFieldOfficer) {
            return res.status(400).json({
                success: false,
                message: 'No Field Officer assigned to this case'
            });
        }

        // Send back to assigned status - same Field Officer will get it
        // TAT due date remains unchanged as per requirement
        await record.update({
            status: 'assigned'
        });

        res.json({
            success: true,
            message: 'Case sent back to Field Officer for re-verification',
            record
        });
    } catch (error) {
        console.error('Error sending case back to Field Officer:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending case back: ' + error.message
        });
    }
};

// Assign case to candidate (Admin only)
exports.assignToCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            candidateName, 
            candidateEmail, 
            candidateMobile, 
            expiryHours = 48,
            sendEmail = true,
            sendSMS = false 
        } = req.body;

        console.log('[Admin - Assign to Candidate] Request:', { 
            id, candidateName, candidateEmail, candidateMobile, sendEmail, sendSMS 
        });

        // Validate required fields
        if (!candidateName || !candidateEmail || !candidateMobile) {
            return res.status(400).json({
                success: false,
                message: 'Candidate name, email, and mobile number are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(candidateEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate mobile number (10 digits)
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(candidateMobile)) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number must be exactly 10 digits'
            });
        }

        // Find the case (admin can access any case)
        const record = await Record.findByPk(id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Case not found'
            });
        }

        // Check if case is in a valid status for assignment
        if (['submitted', 'approved', 'rejected', 'stopped'].includes(record.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot assign case with status: ${record.status}`
            });
        }

        // Create candidate token
        const candidateToken = await createCandidateToken({
            recordId: record.id,
            candidateName,
            candidateEmail,
            candidateMobile
        }, expiryHours);

        // Update record status and store candidate info
        record.status = 'candidate_assigned';
        record.assignedFieldOfficer = null; // Clear FO assignment
        record.assignedFieldOfficerName = null;
        record.candidateName = candidateName;
        record.candidateEmail = candidateEmail;
        record.candidateMobile = candidateMobile;
        record.assignedDate = new Date();

        await record.save();

        // Generate submission link
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const submissionLink = `${baseUrl}/candidate/submit?token=${candidateToken.token}`;

        // Send notification (email and/or SMS based on options)
        let notificationResult = { success: false };
        try {
            notificationResult = await sendCandidateNotification({
                candidateName,
                candidateEmail,
                candidateMobile,
                caseNumber: record.caseNumber,
                referenceNumber: record.referenceNumber,
                submissionLink,
                recordId: record.id,
                expiresAt: candidateToken.expiresAt
            }, {
                sendEmail,
                sendSMS
            });
            
            // Update notification status in token
            const { updateNotificationStatus } = require('../utils/candidateTokenUtils');
            await updateNotificationStatus(candidateToken.id, notificationResult);
            
            console.log('[Admin - Assign to Candidate] Notification result:', {
                email: notificationResult.email?.sent ? 'SENT' : 'FAILED',
                sms: notificationResult.sms?.sent ? 'SENT' : 'FAILED'
            });
        } catch (notifError) {
            console.error('[Admin - Assign to Candidate] Notification error:', notifError);
            // Continue even if notification fails
        }

        res.json({
            success: true,
            message: 'Case assigned to candidate successfully',
            record: record.toJSON(),
            submissionLink,
            expiresAt: candidateToken.expiresAt,
            notificationStatus: {
                email: notificationResult.email || { sent: false, error: 'Not requested' },
                sms: notificationResult.sms || { sent: false, error: 'Not requested' }
            }
        });

    } catch (error) {
        console.error('Error assigning to candidate:', error);
        res.status(500).json({
            success: false,
            message: 'Server error assigning to candidate',
            error: error.message
        });
    }
};

// Get candidate submission link for a record
exports.getCandidateLink = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await Record.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        // Only show link if status is candidate_assigned
        if (record.status !== 'candidate_assigned') {
            return res.json({
                success: true,
                link: null,
                message: 'No active candidate link for this record'
            });
        }

        // Find the active token for this record
        const CandidateToken = require('../models/CandidateToken_SQL');
        const token = await CandidateToken.findOne({
            where: {
                recordId: id,
                isUsed: false
            },
            order: [['createdAt', 'DESC']]
        });

        if (!token) {
            return res.json({
                success: true,
                link: null,
                message: 'No active token found'
            });
        }

        // Check if token is expired
        if (new Date() > new Date(token.expiresAt)) {
            return res.json({
                success: true,
                link: null,
                message: 'Token has expired'
            });
        }

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const submissionLink = `${baseUrl}/candidate/submit?token=${token.token}`;

        res.json({
            success: true,
            link: submissionLink,
            expiresAt: token.expiresAt
        });

    } catch (error) {
        console.error('Error fetching candidate link:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching candidate link',
            error: error.message
        });
    }
};

// Resend/regenerate candidate link for expired assignments
exports.resendCandidateLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            expiryHours = 48,
            sendEmail = true,
            sendSMS = false 
        } = req.body;

        console.log('[Admin - Resend Candidate Link] Request:', { 
            id, expiryHours, sendEmail, sendSMS 
        });

        // Find the case (admin can access any case)
        const record = await Record.findByPk(id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Case not found'
            });
        }

        // Check if case is in candidate_assigned status
        if (record.status !== 'candidate_assigned') {
            return res.status(400).json({
                success: false,
                message: `Cannot resend link for case with status: ${record.status}`
            });
        }

        // Check if we have candidate info stored
        if (!record.candidateName || !record.candidateEmail || !record.candidateMobile) {
            return res.status(400).json({
                success: false,
                message: 'Candidate information not found in record. Please reassign to candidate.'
            });
        }

        // Mark old tokens as used
        const CandidateToken = require('../models/CandidateToken_SQL');
        await CandidateToken.update(
            { isUsed: true },
            { where: { recordId: record.id, isUsed: false } }
        );

        // Create new candidate token
        const candidateToken = await createCandidateToken({
            recordId: record.id,
            candidateName: record.candidateName,
            candidateEmail: record.candidateEmail,
            candidateMobile: record.candidateMobile
        }, expiryHours);

        // Generate submission link
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const submissionLink = `${baseUrl}/candidate/submit?token=${candidateToken.token}`;

        // Send notification (email and/or SMS based on options)
        let notificationResult = { success: false };
        try {
            notificationResult = await sendCandidateNotification({
                candidateName: record.candidateName,
                candidateEmail: record.candidateEmail,
                candidateMobile: record.candidateMobile,
                caseNumber: record.caseNumber,
                referenceNumber: record.referenceNumber,
                submissionLink,
                recordId: record.id,
                expiresAt: candidateToken.expiresAt
            }, {
                sendEmail,
                sendSMS
            });
            
            // Update notification status in token
            const { updateNotificationStatus } = require('../utils/candidateTokenUtils');
            await updateNotificationStatus(candidateToken.id, notificationResult);
            
            console.log('[Admin - Resend Candidate Link] Notification result:', {
                email: notificationResult.email?.sent ? 'SENT' : 'FAILED',
                sms: notificationResult.sms?.sent ? 'SENT' : 'FAILED'
            });
        } catch (notifError) {
            console.error('[Admin - Resend Candidate Link] Notification error:', notifError);
            // Continue even if notification fails
        }

        res.json({
            success: true,
            message: 'New candidate link generated and sent successfully',
            submissionLink,
            expiresAt: candidateToken.expiresAt,
            candidateInfo: {
                name: record.candidateName,
                email: record.candidateEmail,
                mobile: record.candidateMobile
            },
            notificationStatus: {
                email: notificationResult.email || { sent: false, error: 'Not requested' },
                sms: notificationResult.sms || { sent: false, error: 'Not requested' }
            }
        });

    } catch (error) {
        console.error('Error resending candidate link:', error);
        res.status(500).json({
            success: false,
            message: 'Server error resending candidate link',
            error: error.message
        });
    }
};
