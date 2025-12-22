const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * CandidateToken Model
 * Stores secure tokens for candidate self-submission
 */
const CandidateToken = sequelize.define('CandidateToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  token: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: 'Secure unique token for candidate access'
  },
  recordId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'records',
      key: 'id'
    },
    comment: 'Associated case/record ID'
  },
  candidateName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Candidate full name'
  },
  candidateEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    },
    comment: 'Candidate email for notification'
  },
  candidateMobile: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[0-9]{10}$/
    },
    comment: 'Candidate mobile number (10 digits)'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Token expiry timestamp'
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether token has been used (single-use)'
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when token was used'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'IP address used for submission'
  }
}, {
  tableName: 'candidate_tokens',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['token']
    },
    {
      fields: ['recordId']
    },
    {
      fields: ['expiresAt']
    },
    {
      fields: ['isUsed']
    }
  ]
});

module.exports = CandidateToken;
