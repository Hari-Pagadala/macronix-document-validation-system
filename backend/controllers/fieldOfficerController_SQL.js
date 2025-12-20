const FieldOfficer = require('../models/FieldOfficer_SQL');
const Vendor = require('../models/Vendor_SQL');
const Record = require('../models/Record_SQL');
const Verification = require('../models/Verification_SQL');
const { validatePassword } = require('../utils/passwordValidation');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Create field officer
exports.createFieldOfficer = async (req, res) => {
    try {
        const { name, email, phoneNumber, password, vendor } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10}$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }
        if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
        }
        
        // Validate password
        const passwordValidation = validatePassword(password, email);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password validation failed',
                errors: passwordValidation.errors
            });
        }
        
        // Validate vendor exists and is active
        const vendorDoc = await Vendor.findByPk(vendor);
        if (!vendorDoc) {
            return res.status(400).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        if (vendorDoc.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Cannot assign to inactive vendor'
            });
        }
        
        // Check if field officer already exists
        const existingOfficer = await FieldOfficer.findOne({ where: { email } });
        if (existingOfficer) {
            return res.status(400).json({
                success: false,
                message: 'Field officer with this email already exists'
            });
        }
        
        const fieldOfficer = await FieldOfficer.create({
            name,
            email,
            phoneNumber,
            password,
            vendor,
            vendorName: vendorDoc.company
        });
        
        res.status(201).json({
            success: true,
            message: 'Field officer created successfully',
            fieldOfficer: {
                id: fieldOfficer.id,
                name: fieldOfficer.name,
                email: fieldOfficer.email,
                phoneNumber: fieldOfficer.phoneNumber,
                vendor: fieldOfficer.vendor,
                vendorName: fieldOfficer.vendorName,
                status: fieldOfficer.status
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error creating field officer'
        });
    }
};

// Get currently authenticated field officer profile
exports.getMyProfile = async (req, res) => {
    try {
        const foId = req.fieldOfficerId;
        if (!foId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const fieldOfficer = await FieldOfficer.findByPk(foId, {
            attributes: { exclude: ['password'] }
        });

        if (!fieldOfficer) {
            return res.status(404).json({ success: false, message: 'Field officer not found' });
        }

        let vendorName = fieldOfficer.vendorName;
        try {
            const vendorDoc = await Vendor.findByPk(fieldOfficer.vendor);
            if (vendorDoc && vendorDoc.company) {
                vendorName = vendorDoc.company;
            }
        } catch (err) {
            console.error('FO profile vendor lookup failed:', err.message);
        }

        return res.json({
            success: true,
            profile: {
                id: fieldOfficer.id,
                name: fieldOfficer.name,
                email: fieldOfficer.email,
                phoneNumber: fieldOfficer.phoneNumber,
                vendorId: fieldOfficer.vendor,
                vendorName: vendorName || 'Not available',
                role: 'Field Officer'
            }
        });
    } catch (error) {
        console.error('FO profile fetch error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }
};

// Get all field officers
exports.getAllFieldOfficers = async (req, res) => {
    try {
        const { status } = req.query;
        
        const where = {};
        if (status) {
            where.status = status;
        }
        
        const fieldOfficers = await FieldOfficer.findAll({
            where,
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['password'] }
        });
        
        res.json({
            success: true,
            fieldOfficers
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching field officers'
        });
    }
};

// Get field officers by vendor
exports.getFieldOfficersByVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;
        
        const fieldOfficers = await FieldOfficer.findAll({
            where: {
                vendor: vendorId,
                status: 'active'
            },
            attributes: ['id', 'name']
        });
        
        res.json({
            success: true,
            fieldOfficers
        });
        
    } catch (error) {
        console.error('Error fetching field officers by vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching field officers'
        });
    }
};

// Get field officer by ID
exports.getFieldOfficerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const fieldOfficer = await FieldOfficer.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!fieldOfficer) {
            return res.status(404).json({
                success: false,
                message: 'Field officer not found'
            });
        }
        
        res.json({
            success: true,
            fieldOfficer
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching field officer'
        });
    }
};

// Update field officer
exports.updateFieldOfficer = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const phoneRegex = /^\d{10}$/;
                if (updateData.email && !emailRegex.test(updateData.email)) {
                    return res.status(400).json({ success: false, message: 'Invalid email format' });
                }
                if (updateData.phoneNumber && !phoneRegex.test(updateData.phoneNumber)) {
                    return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
                }
                // If changing email, ensure uniqueness
                if (updateData.email && updateData.email !== fieldOfficer.email) {
                    const dup = await FieldOfficer.findOne({ where: { email: updateData.email } });
                    if (dup) {
                        return res.status(400).json({ success: false, message: 'Another field officer with this email already exists' });
                    }
                }
        
        const fieldOfficer = await FieldOfficer.findByPk(id);
        if (!fieldOfficer) {
            return res.status(404).json({
                success: false,
                message: 'Field officer not found'
            });
        }
        
        // If changing vendor, validate new vendor
        if (updateData.vendor && updateData.vendor !== fieldOfficer.vendor) {
            const vendorDoc = await Vendor.findByPk(updateData.vendor);
            if (!vendorDoc) {
                return res.status(400).json({
                    success: false,
                    message: 'Vendor not found'
                });
            }
            updateData.vendorName = vendorDoc.company;
        }
        
        // If password provided, validate and enforce simple reuse policy
        if (updateData.password) {
            const passwordValidation = validatePassword(updateData.password, updateData.email || fieldOfficer.email);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Password validation failed',
                    errors: passwordValidation.errors
                });
            }
            // Disallow setting the same password as current
            if (updateData.password === fieldOfficer.password) {
                return res.status(400).json({
                    success: false,
                    message: 'New password cannot be the same as current password'
                });
            }
        }

        await fieldOfficer.update(updateData);
        
        res.json({
            success: true,
            message: 'Field officer updated successfully',
            fieldOfficer: {
                id: fieldOfficer.id,
                name: fieldOfficer.name,
                email: fieldOfficer.email,
                phoneNumber: fieldOfficer.phoneNumber,
                vendor: fieldOfficer.vendor,
                vendorName: fieldOfficer.vendorName,
                status: fieldOfficer.status
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error updating field officer'
        });
    }
};

// Toggle field officer status
exports.toggleFieldOfficerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const fieldOfficer = await FieldOfficer.findByPk(id);
        if (!fieldOfficer) {
            return res.status(404).json({
                success: false,
                message: 'Field officer not found'
            });
        }
        
        fieldOfficer.status = fieldOfficer.status === 'active' ? 'inactive' : 'active';
        await fieldOfficer.save();
        
        res.json({
            success: true,
            message: `Field officer ${fieldOfficer.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            fieldOfficer: {
                id: fieldOfficer.id,
                name: fieldOfficer.name,
                email: fieldOfficer.email,
                status: fieldOfficer.status
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error toggling field officer status'
        });
    }
};

// Public: Get cases assigned to a Field Officer (demo endpoint without auth)
exports.getCasesForFieldOfficerPublic = async (req, res) => {
    try {
        const { foId, status, search, page = 1, limit = 10 } = req.query;
        if (!foId) {
            return res.status(400).json({ success: false, message: 'foId is required' });
        }

        const where = { assignedFieldOfficer: foId };
        if (status && status !== 'all') {
            where.status = status;
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

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await Record.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            records: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching FO cases (public):', error);
        res.status(500).json({ success: false, message: 'Server error fetching cases' });
    }
};

// Protected: Submit verification details for an assigned case
exports.submitVerification = async (req, res) => {
    try {
        const foId = req.fieldOfficerId;
        const { caseId } = req.params;
        const record = await Record.findByPk(caseId);
        if (!record || record.assignedFieldOfficer !== foId) {
            return res.status(404).json({ success: false, message: 'Case not found or not assigned to you' });
        }
        if (record.status !== 'assigned') {
            return res.status(400).json({ success: false, message: 'Only assigned cases can be submitted' });
        }

        const {
            respondentName,
            respondentRelationship,
            respondentContact,
            periodOfStay,
            ownershipType,
            verificationDate,
            comments,
            action,
            submissionGpsLat,
            submissionGpsLng,
            submissionTimestamp,
            // ImageKit URLs (new submission format)
            documents = [],
            photos = [],
            selfieWithHouse = null,
            candidateWithRespondent = null,
            officerSignature = null,
            respondentSignature = null,
            files = {} // Base64 encoded files from JSON submission (legacy)
        } = req.body;

        console.log('[Submit] Received submission with ImageKit URLs or files:', {
          hasDocuments: Array.isArray(documents) && documents.length > 0,
          hasPhotos: Array.isArray(photos) && photos.length > 0,
          hasSelfie: !!selfieWithHouse,
          hasCandidate: !!candidateWithRespondent,
          hasOfficerSig: !!officerSignature,
          hasRespondentSig: !!respondentSignature,
          hasFiles: Object.keys(files).length > 0
        });

        // Prefer submission GPS; fallback to selfie photo GPS; else error
        const resolvedGpsLat = submissionGpsLat;
        const resolvedGpsLng = submissionGpsLng;
        if (!resolvedGpsLat || !resolvedGpsLng) {
            return res.status(400).json({ success: false, message: 'GPS location is required at submission time.' });
        }

        // Check if using ImageKit URLs (new format) or base64/multer files (legacy)
        const isImageKitSubmission = !!selfieWithHouse || !!candidateWithRespondent || !!officerSignature || !!respondentSignature;
        const hasOfficerSignature = isImageKitSubmission ? !!officerSignature : (req.files?.officerSignature?.length > 0 || files.officerSignature);
        const hasRespondentSignature = isImageKitSubmission ? !!respondentSignature : (req.files?.respondentSignature?.length > 0 || files.respondentSignature);
        

        // Validate signatures (mandatory)
        if (!hasOfficerSignature || !hasRespondentSignature) {
            return res.status(400).json({ 
                success: false, 
                message: 'Both officer and respondent signatures are required' 
            });
        }

        // Process base64 files if present
        const uploadDir = path.join(__dirname, '..', 'uploads', 'fo');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const saveBase64File = (base64Data, filename) => {
            try {
                const filepath = path.join(uploadDir, filename);
                
                // Strip data URI prefix if present (e.g., 'data:image/png;base64,')
                let cleanBase64 = base64Data;
                if (typeof base64Data === 'string' && base64Data.includes('base64,')) {
                    cleanBase64 = base64Data.split('base64,')[1];
                }
                
                // Decode base64 to buffer
                const buffer = Buffer.from(cleanBase64, 'base64');
                
                // Validate buffer size (must be at least 69 bytes for smallest valid PNG)
                // Corrupted signatures are typically exactly 68 bytes
                if (buffer.length < 69) {
                    console.error(`[Upload] Image too small (${buffer.length} bytes), likely corrupted: ${filename}`);
                    return null;
                }
                
                // Write to file
                fs.writeFileSync(filepath, buffer);
                console.log(`[Upload] Saved ${filename} (${buffer.length} bytes)`);
                return filename;
            } catch (error) {
                console.error(`[Upload] Failed to save ${filename}:`, error.message);
                return null;
            }
        };

        let officerSignaturePath = null;
        let respondentSignaturePath = null;
        let docUrls = [];
        let photoUrls = [];
        let selfieUrl = null;
        let candidateUrl = null;

        // If ImageKit submission (new format), URLs are already provided
        if (isImageKitSubmission) {
          console.log('[Submit] Processing ImageKit URLs...');
          docUrls = Array.isArray(documents) ? documents.filter(d => typeof d === 'string') : [];
          photoUrls = Array.isArray(photos) ? photos.filter(p => typeof p === 'string') : [];
          selfieUrl = typeof selfieWithHouse === 'string' ? selfieWithHouse : null;
          candidateUrl = typeof candidateWithRespondent === 'string' ? candidateWithRespondent : null;
          officerSignaturePath = typeof officerSignature === 'string' ? officerSignature : null;
          respondentSignaturePath = typeof respondentSignature === 'string' ? respondentSignature : null;
          console.log('[Submit] ImageKit URLs collected:', { docUrls, photoUrls, selfieUrl, candidateUrl });
        } else {
          // Legacy path: base64 or multer files
          console.log('[Submit] Processing legacy files (base64 or multer)...');
          const multerFiles = req.files || {};
          
          // Save base64 files if present
          if (files.officerSignature) {
            const filename = `officer_sig_${Date.now()}.png`;
            officerSignaturePath = saveBase64File(files.officerSignature.data, filename);
            console.log('[Submit] Saved officer signature:', officerSignaturePath);
          } else if (multerFiles.officerSignature?.[0]) {
            officerSignaturePath = multerFiles.officerSignature[0].filename;
          }

          if (files.respondentSignature) {
            const filename = `respondent_sig_${Date.now()}.png`;
            respondentSignaturePath = saveBase64File(files.respondentSignature.data, filename);
            console.log('[Submit] Saved respondent signature:', respondentSignaturePath);
          } else if (multerFiles.respondentSignature?.[0]) {
            respondentSignaturePath = multerFiles.respondentSignature[0].filename;
          }

          // Documents
          docUrls = (multerFiles?.documents || []).map(f => f.filename);
          if (Array.isArray(files.documents)) {
            const savedDocs = files.documents.map((doc, idx) => {
              const ext = doc.type?.includes('png') ? 'png' : 'jpg';
              const filename = `document_${Date.now()}_${idx}.${ext}`;
              return saveBase64File(doc.data, filename);
            });
            docUrls = docUrls.concat(savedDocs);
          }

          // Photos
          photoUrls = (multerFiles?.photos || []).map(f => f.filename);
          if (Array.isArray(files.photos)) {
            const savedPhotos = files.photos.map((ph, idx) => {
              const ext = ph.type?.includes('png') ? 'png' : 'jpg';
              const filename = `photo_${Date.now()}_${idx}.${ext}`;
              return saveBase64File(ph.data, filename);
            });
            photoUrls = photoUrls.concat(savedPhotos);
          }

          // Selfie with house
          selfieUrl = multerFiles?.selfieWithHouse?.[0]?.filename || null;
          if (files.selfieWithHouse) {
            const ext = files.selfieWithHouse.type?.includes('png') ? 'png' : 'jpg';
            const filename = `selfie_${Date.now()}.${ext}`;
            selfieUrl = saveBase64File(files.selfieWithHouse.data, filename);
          }

          // Candidate with respondent
          candidateUrl = multerFiles?.candidateWithRespondent?.[0]?.filename || null;
          if (files.candidateWithRespondent) {
            const ext = files.candidateWithRespondent.type?.includes('png') ? 'png' : 'jpg';
            const filename = `candidate_${Date.now()}.${ext}`;
            candidateUrl = saveBase64File(files.candidateWithRespondent.data, filename);
          }
        }

        // Final validation: ensure signatures were successfully saved
        if (!officerSignaturePath || !respondentSignaturePath) {
            console.error('[Submit] Signature save failed:', { 
                officerSignaturePath, 
                respondentSignaturePath 
            });
            return res.status(400).json({ 
                success: false, 
                message: 'Failed to save signature images. Please ensure images are valid PNG/JPEG format.' 
            });
        }

        const payload = {
            recordId: record.id,
            fieldOfficerId: foId,
            respondentName,
            respondentRelationship,
            respondentContact,
            periodOfStay,
            ownershipType,
            verificationDate: verificationDate ? new Date(verificationDate) : null,
            comments,
            insufficientReason: action === 'insufficient' ? (req.body.insufficientReason || null) : null,
            gpsLat: resolvedGpsLat,
            gpsLng: resolvedGpsLng,
            documents: docUrls,
            photos: photoUrls,
            selfieWithHousePath: selfieUrl,
            candidateWithRespondentPath: candidateUrl,
            officerSignaturePath: officerSignaturePath,
            respondentSignaturePath: respondentSignaturePath,
            status: action === 'insufficient' ? 'insufficient' : 'submitted'
        };

        const existing = await Verification.findOne({ where: { recordId: record.id } });
        if (existing) {
            await existing.update(payload);
        } else {
            await Verification.create(payload);
        }

        if (action === 'insufficient') {
            record.status = 'insufficient';
        } else {
            record.status = 'submitted';
            record.completionDate = new Date();
        }
        await record.save();

        res.json({ success: true, message: 'Verification submitted', record: record.toJSON() });
    } catch (error) {
        console.error('Error submitting verification:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ success: false, message: 'Server error submitting verification', error: error.message });
    }
};
