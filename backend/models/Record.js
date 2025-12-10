const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    // Auto-generated reference number
    referenceNumber: {
        type: String,
        unique: true,
        index: true,
        sparse: true  // Allow null/undefined before it's generated
    },
    
    // Case Number from Excel (REQUIRED)
    caseNumber: {
        type: String,
        required: [true, 'Case number is required'],
        trim: true,
        index: true
    },
    
    // Customer Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    fullName: {
        type: String,
        trim: true
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    
    // Address Information
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
    },
    district: {
        type: String,
        required: [true, 'District is required'],
        trim: true
    },
    pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        trim: true
    },
    
    // Assignment Information
    assignedVendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    },
    assignedVendorName: String,
    
    assignedFieldOfficer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FieldOfficer'
    },
    assignedFieldOfficerName: String,
    
    assignedDate: Date,
    tatDueDate: Date, // 7 days from assignment
    
    // Status Tracking
    status: {
        type: String,
        enum: [
            'pending',      // Just uploaded, not assigned
            'assigned',     // Assigned to vendor
            'in_progress',  // Field officer working
            'submitted',    // Field officer completed
            'approved',     // Admin approved
            'rejected'      // Admin rejected
        ],
        default: 'pending'
    },
    
    // Progress Tracking
    progressPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    
    // Upload Information
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedByName: String,
    uploadedDate: {
        type: Date,
        default: Date.now
    },
    batchId: String,
    source: {
        type: String,
        enum: ['excel', 'manual'],
        default: 'excel'
    },
    
    // SLA Tracking
    isLate: {
        type: Boolean,
        default: false
    },
    daysLate: Number,
    
    // Audit Trail
    history: [{
        action: String,
        performedBy: String,
        performedById: mongoose.Schema.Types.ObjectId,
        performedAt: { type: Date, default: Date.now },
        details: String,
        fromStatus: String,
        toStatus: String
    }],
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-generate MACRONIX reference number
recordSchema.statics.generateReferenceNumber = async function() {
    const Counter = mongoose.model('Counter');
    try {
        const counter = await Counter.findOneAndUpdate(
            { name: 'recordRef' },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
        );
        
        const paddedNumber = String(counter.value).padStart(6, '0');
        return `MACRONIX-${paddedNumber}`;
    } catch (error) {
        // Fallback using timestamp
        const timestamp = Date.now().toString().slice(-6);
        return `MACRONIX-F${timestamp}`;
    }
};

// Middleware
recordSchema.pre('save', async function(next) {
    if (!this.referenceNumber) {
        this.referenceNumber = await mongoose.model('Record').generateReferenceNumber();
    }
    
    // Generate full name
    if (this.firstName && this.lastName) {
        this.fullName = `${this.firstName} ${this.lastName}`.trim();
    }
    
    // Set TAT due date (7 days from assignment)
    if (this.assignedDate && !this.tatDueDate && this.status === 'assigned') {
        const dueDate = new Date(this.assignedDate);
        dueDate.setDate(dueDate.getDate() + 7);
        this.tatDueDate = dueDate;
    }
    
    // Update vendor and field officer names
    if (this.assignedVendor && !this.assignedVendorName) {
        const Vendor = mongoose.model('Vendor');
        const vendor = await Vendor.findById(this.assignedVendor);
        if (vendor) this.assignedVendorName = vendor.company;
    }
    
    if (this.assignedFieldOfficer && !this.assignedFieldOfficerName) {
        const FieldOfficer = mongoose.model('FieldOfficer');
        const officer = await FieldOfficer.findById(this.assignedFieldOfficer);
        if (officer) this.assignedFieldOfficerName = officer.name;
    }
    
    this.updatedAt = new Date();
    next();
});

// Add to history when status changes
recordSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.history.push({
            action: 'status_change',
            performedBy: 'System',
            performedAt: new Date(),
            fromStatus: this._originalStatus || 'new',
            toStatus: this.status
        });
    }
    next();
});

module.exports = mongoose.model('Record', recordSchema);