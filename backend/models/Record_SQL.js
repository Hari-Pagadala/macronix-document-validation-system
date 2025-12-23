const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Record = sequelize.define('Record', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    caseNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    referenceNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    documentType: {
        type: DataTypes.STRING
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fullName: {
        type: DataTypes.STRING
    },
    vendorName: {
        type: DataTypes.STRING
    },
    fieldOfficerName: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.ENUM('pending', 'vendor_assigned', 'candidate_assigned', 'assigned', 'submitted', 'approved', 'insufficient', 'rejected', 'stopped'),
        defaultValue: 'pending'
    },
    remarks: {
        type: DataTypes.TEXT
    },
    assignedVendor: {
        type: DataTypes.UUID
    },
    assignedVendorName: {
        type: DataTypes.STRING
    },
    assignedFieldOfficer: {
        type: DataTypes.UUID
    },
    assignedFieldOfficerName: {
        type: DataTypes.STRING
    },
    candidateName: {
        type: DataTypes.STRING,
        comment: 'Candidate name for self-submission'
    },
    candidateEmail: {
        type: DataTypes.STRING,
        comment: 'Candidate email for self-submission'
    },
    candidateMobile: {
        type: DataTypes.STRING,
        comment: 'Candidate mobile for self-submission'
    },
    assignedDate: {
        type: DataTypes.DATE
    },
    tatDueDate: {
        type: DataTypes.DATE
    },
    completionDate: {
        type: DataTypes.DATE
    },
    uploadedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    history: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    fileUrl: {
        type: DataTypes.STRING
    },
    contactNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    state: {
        type: DataTypes.STRING,
        allowNull: false
    },
    district: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pincode: {
        type: DataTypes.STRING,
        allowNull: false
    }
    ,
    gpsLat: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gpsLng: {
        type: DataTypes.STRING,
        allowNull: true
    },
    submittedGpsLat: {
        type: DataTypes.STRING,
        allowNull: true
    },
    submittedGpsLng: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gpsDistanceMeters: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    foVerification: {
        type: DataTypes.JSON,
        comment: 'Field Officer submission payload including respondent details, ownership, dates, comments, gps, signatures, file paths'
    }
}, {
    timestamps: true,
    tableName: 'records'
});

module.exports = Record;
