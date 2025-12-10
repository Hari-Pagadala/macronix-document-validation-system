const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const fieldOfficerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Field officer name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: [true, 'Vendor is required']
    },
    vendorName: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    assignedCases: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Record'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

fieldOfficerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
        return;
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

fieldOfficerSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

fieldOfficerSchema.pre('save', async function(next) {
    if (this.vendor && !this.vendorName) {
        const Vendor = mongoose.model('Vendor');
        const vendorDoc = await Vendor.findById(this.vendor);
        if (vendorDoc) {
            this.vendorName = vendorDoc.company;
        }
    }
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('FieldOfficer', fieldOfficerSchema);