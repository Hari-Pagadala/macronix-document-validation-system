const crypto = require('crypto');
const CandidateToken = require('../models/CandidateToken_SQL');

/**
 * Generate a secure random token
 * @returns {string} 64-character hex token
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create a new candidate token
 * @param {Object} data - Token data
 * @param {string} data.recordId - Case/Record ID
 * @param {string} data.candidateName - Candidate name
 * @param {string} data.candidateEmail - Candidate email
 * @param {string} data.candidateMobile - Candidate mobile (10 digits)
 * @param {number} expiryHours - Hours until expiry (default 48)
 * @returns {Promise<Object>} Created token object
 */
const createCandidateToken = async (data, expiryHours = 48) => {
  const token = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  const candidateToken = await CandidateToken.create({
    token,
    recordId: data.recordId,
    candidateName: data.candidateName,
    candidateEmail: data.candidateEmail,
    candidateMobile: data.candidateMobile,
    expiresAt,
    isUsed: false
  });

  return candidateToken;
};

/**
 * Validate a candidate token
 * @param {string} token - Token string to validate
 * @returns {Promise<Object>} Validation result
 */
const validateCandidateToken = async (token) => {
  if (!token) {
    return { valid: false, error: 'Token is required' };
  }

  const candidateToken = await CandidateToken.findOne({
    where: { token },
    include: [{
      model: require('../models/Record_SQL'),
      as: 'record'
    }]
  });

  if (!candidateToken) {
    return { valid: false, error: 'Invalid token' };
  }

  if (candidateToken.isUsed) {
    return { valid: false, error: 'Token has already been used' };
  }

  if (new Date() > candidateToken.expiresAt) {
    return { valid: false, error: 'Token has expired' };
  }

  return {
    valid: true,
    token: candidateToken,
    recordId: candidateToken.recordId
  };
};

/**
 * Mark token as used
 * @param {string} token - Token string
 * @param {string} ipAddress - IP address of submission
 * @returns {Promise<boolean>} Success status
 */
const markTokenAsUsed = async (token, ipAddress = null) => {
  const candidateToken = await CandidateToken.findOne({ where: { token } });
  
  if (!candidateToken) {
    return false;
  }

  await candidateToken.update({
    isUsed: true,
    usedAt: new Date(),
    ipAddress
  });

  return true;
};

/**
 * Get token details by token string
 * @param {string} token - Token string
 * @returns {Promise<Object|null>} Token object or null
 */
const getTokenDetails = async (token) => {
  return await CandidateToken.findOne({
    where: { token },
    include: [{
      model: require('../models/Record_SQL'),
      as: 'record'
    }]
  });
};

/**
 * Cleanup expired tokens (can be run as cron job)
 * @returns {Promise<number>} Number of deleted tokens
 */
const cleanupExpiredTokens = async () => {
  const { Op } = require('sequelize');
  const result = await CandidateToken.destroy({
    where: {
      expiresAt: {
        [Op.lt]: new Date()
      },
      isUsed: false
    }
  });
  return result;
};

module.exports = {
  generateSecureToken,
  createCandidateToken,
  validateCandidateToken,
  markTokenAsUsed,
  getTokenDetails,
  cleanupExpiredTokens
};
