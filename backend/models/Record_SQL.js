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
        type: DataTypes.ENUM('pending', 'assigned', 'submitted', 'approved', 'rejected'),
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
}, {
    timestamps: true,
    tableName: 'records'
});

module.exports = Record;
