const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Verification = sequelize.define('Verification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recordId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  fieldOfficerId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  respondentName: DataTypes.STRING,
  respondentRelationship: DataTypes.STRING,
  respondentContact: DataTypes.STRING,
  periodOfStay: DataTypes.STRING,
  ownershipType: DataTypes.STRING,
  ownerName: DataTypes.STRING,
  relationWithOwner: DataTypes.STRING,
  address: DataTypes.TEXT,
  city: DataTypes.STRING,
  state: DataTypes.STRING,
  pincode: DataTypes.STRING,
  landmark: DataTypes.STRING,
  verificationNotes: DataTypes.TEXT,
  verificationDate: DataTypes.DATEONLY,
  comments: DataTypes.TEXT,
  insufficientReason: DataTypes.TEXT,
  verifiedBy: DataTypes.STRING,
  status: {
    type: DataTypes.ENUM('submitted', 'insufficient'),
    defaultValue: 'submitted'
  },
  gpsLat: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gpsLng: {
    type: DataTypes.STRING,
    allowNull: false
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  photos: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  selfieWithHousePath: DataTypes.STRING,
  candidateWithRespondentPath: DataTypes.STRING,
  officerSignaturePath: DataTypes.STRING,
  respondentSignaturePath: DataTypes.STRING
}, {
  timestamps: true,
  tableName: 'verifications'
});

module.exports = Verification;
