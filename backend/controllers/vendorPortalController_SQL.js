const Record = require('../models/Record_SQL');
const Vendor = require('../models/Vendor_SQL');
const FieldOfficer = require('../models/FieldOfficer_SQL');
const { createCandidateToken } = require('../utils/candidateTokenUtils');
const { sendCandidateNotification } = require('../utils/notificationUtils');
const { Op } = require('sequelize');

// Get Vendor Dashboard Stats
exports.getVendorDashboardStats = async (req, res) => {
    try {
        const vendorId = req.userId;
        
        const totalAssignedCases = await Record.count({ 
            where: { assignedVendor: vendorId } 
        });
        
        const pendingCases = await Record.count({ 
            where: { 
                assignedVendor: vendorId,
                status: 'pending'
            } 
        });
        
        const vendorAssignedCases = await Record.count({ 
            where: { 
                assignedVendor: vendorId,
                status: 'vendor_assigned'
            } 
        });
        
        const assignedToFieldOfficer = await Record.count({ 
            where: { 
                assignedVendor: vendorId,
                status: 'assigned',
                assignedFieldOfficer: { [Op.ne]: null }
            } 
        });
        
        const submittedCases = await Record.count({ 
            where: { 
                assignedVendor: vendorId,
                status: 'submitted'
            } 
        });
        
        const approvedCases = await Record.count({ 
            where: { 
                assignedVendor: vendorId,
                status: 'approved'
            } 
        });
        
        const rejectedCases = await Record.count({ 
            where: { 
                assignedVendor: vendorId,
                status: 'rejected'
            } 
        });
        
        const insufficientCases = await Record.count({ 
            where: { 
                assignedVendor: vendorId,
                status: 'insufficient'
            } 
        });
        
        const stoppedCases = await Record.count({ 
            where: { 
                assignedVendor: vendorId,
                status: 'stopped'
            } 
        });
        
        const lateSubmissionCases = await Record.count({ 
            where: { 
                assignedVendor: vendorId,
                isLateSubmission: true
            } 
        });
        
        res.json({
            success: true,
            stats: {
                totalAssignedCases,
                pendingCases,
                vendorAssignedCases,
                assignedToFieldOfficer,
                submittedCases,
                approvedCases,
                rejectedCases,
                insufficientCases,
                stoppedCases,
                lateSubmissionCases
            }
        });
    } catch (error) {
        console.error('Error fetching vendor dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching stats: ' + error.message
        });
    }
};

// Get Vendor Cases (only cases assigned to this vendor)
exports.getVendorCases = async (req, res) => {
    try {
        const vendorId = req.userId;
        const { status, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        const where = {
            assignedVendor: vendorId
        };
        
        if (status && status !== 'all') {
            if (status === 'late_submission') {
                where.isLateSubmission = true;
            } else {
                where.status = status;
            }
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
        
        // Fetch field officer details for each record
        const recordsWithDetails = await Promise.all(rows.map(async (record) => {
            const recordData = record.toJSON();
            
            if (record.assignedFieldOfficer) {
                const officer = await FieldOfficer.findByPk(record.assignedFieldOfficer);
                if (officer) {
                    recordData.assignedFieldOfficerName = officer.name;
                    recordData.fieldOfficerPhone = officer.phoneNumber;
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
        console.error('Error fetching vendor cases:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching cases: ' + error.message
        });
    }
};

// Get Single Case (only if assigned to vendor)
exports.getVendorCase = async (req, res) => {
    try {
        const vendorId = req.userId;
        const { id } = req.params;
        
        const record = await Record.findOne({
            where: { 
                id,
                assignedVendor: vendorId
            }
        });
        
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Case not found or not assigned to you'
            });
        }
        
        const recordData = record.toJSON();
        
        // Add field officer details
        if (record.assignedFieldOfficer) {
            const officer = await FieldOfficer.findByPk(record.assignedFieldOfficer);
            if (officer) {
                recordData.fieldOfficer = {
                    id: officer.id,
                    name: officer.name,
                    phoneNumber: officer.phoneNumber,
                    email: officer.email
                };
            }
        }
        
        res.json({
            success: true,
            record: recordData
        });
    } catch (error) {
        console.error('Error fetching case:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching case'
        });
    }
};

// Assign Field Officer to Case
exports.assignFieldOfficer = async (req, res) => {
    try {
        const vendorId = req.userId;
        const { caseId } = req.params;
        const { fieldOfficerId } = req.body;
        
        // Check if case belongs to this vendor
        const record = await Record.findOne({
            where: { 
                id: caseId,
                assignedVendor: vendorId
            }
        });
        
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Case not found or not assigned to you'
            });
        }
        
        // Check if field officer belongs to this vendor
        const fieldOfficer = await FieldOfficer.findOne({
            where: { 
                id: fieldOfficerId,
                vendor: vendorId,
                status: 'active'
            }
        });
        
        if (!fieldOfficer) {
            return res.status(404).json({
                success: false,
                message: 'Field officer not found or not assigned to your company'
            });
        }
        
        // Update record
        record.assignedFieldOfficer = fieldOfficerId;
        record.assignedFieldOfficerName = fieldOfficer.name;
        
        // Update status to assigned if currently pending or vendor_assigned
        if (record.status === 'pending' || record.status === 'vendor_assigned') {
            record.status = 'assigned';
            record.assignedDate = new Date();
            
            // Calculate TAT due date (7 days from assignment)
            const tatDueDate = new Date();
            tatDueDate.setDate(tatDueDate.getDate() + 7);
            record.tatDueDate = tatDueDate;
        }
        
        await record.save();
        
        res.json({
            success: true,
            message: 'Field officer assigned successfully',
            record: record.toJSON()
        });
    } catch (error) {
        console.error('Error assigning field officer:', error);
        res.status(500).json({
            success: false,
            message: 'Server error assigning field officer'
        });
    }
};

// Update Case Status (limited actions for vendor)
exports.updateCaseStatus = async (req, res) => {
    try {
        const vendorId = req.userId;
        const { caseId } = req.params;
        const { status, remarks } = req.body;
        
        // Allowed status updates for vendors
        const allowedStatuses = ['submitted', 'insufficient'];
        
        if (!allowedStatuses.includes(status)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to set this status'
            });
        }
        
        // Check if case belongs to this vendor
        const record = await Record.findOne({
            where: { 
                id: caseId,
                assignedVendor: vendorId
            }
        });
        
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Case not found or not assigned to you'
            });
        }
        
        record.status = status;
        if (remarks) {
            record.remarks = remarks;
        }
        
        await record.save();
        
        res.json({
            success: true,
            message: 'Case status updated successfully',
            record: record.toJSON()
        });
    } catch (error) {
        console.error('Error updating case status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating case status'
        });
    }
};

// Assign Case to Candidate (Self-Submission)
exports.assignToCandidate = async (req, res) => {
    try {
        const vendorId = req.userId;
        const { caseId } = req.params;
        const { 
            candidateName, 
            candidateEmail, 
            candidateMobile, 
            expiryHours = 48,
            sendEmail = true,
            sendSMS = false 
        } = req.body;

        console.log('[Assign to Candidate] Request:', { 
            caseId, candidateName, candidateEmail, candidateMobile, sendEmail, sendSMS 
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

        // Check if case belongs to this vendor
        const record = await Record.findOne({
            where: { 
                id: caseId,
                assignedVendor: vendorId
            }
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Case not found or not assigned to you'
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
            
            console.log('[Assign to Candidate] Notification result:', {
                email: notificationResult.email?.sent ? 'SENT' : 'FAILED',
                sms: notificationResult.sms?.sent ? 'SENT' : 'FAILED'
            });
        } catch (notifError) {
            console.error('[Assign to Candidate] Notification error:', notifError);
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
