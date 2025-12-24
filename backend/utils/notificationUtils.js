/**
 * Notification utility for sending emails and SMS to candidates
 * Integrated with Nodemailer (SMTP) and Fast2SMS (SMS)
 */

const nodemailer = require('nodemailer');
const axios = require('axios');
const { createShortLink, buildShortUrl } = require('./shortLinkUtils');

// Initialize email transporters (with Gmail 465 fallback to avoid 587 blocks)
let emailTransporters = [];
try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const smtpHost = process.env.SMTP_HOST;
    const primaryPort = parseInt(process.env.SMTP_PORT) || 587;
    const primarySecure = process.env.SMTP_SECURE === 'true';

    const transportConfigs = [
      {
        host: smtpHost,
        port: primaryPort,
        secure: primarySecure,
      }
    ];

    // Gmail often works better on 465 when 587 is blocked
    const isGmail = smtpHost.includes('gmail.com');
    if (isGmail && !(primaryPort === 465 && primarySecure === true)) {
      transportConfigs.push({ host: smtpHost, port: 465, secure: true });
    }

    // Build transporters with shared auth and sensible timeouts
    emailTransporters = transportConfigs.map((cfg) => {
      const transporter = nodemailer.createTransport({
        ...cfg,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });
      console.log(`✅ Email transporter initialized (${cfg.host}:${cfg.port}, secure=${cfg.secure})`);
      return { transporter, cfg };
    });
  } else {
    console.warn('⚠️ Email service not configured - set SMTP environment variables');
  }
} catch (error) {
  console.error('❌ Email transporter initialization failed:', error.message);
}

// Initialize SMS client (Fast2SMS)
let smsConfigured = false;
try {
  if (process.env.FAST2SMS_API_KEY) {
    smsConfigured = true;
    console.log('✅ SMS client initialized (Fast2SMS)');
  } else {
    console.warn('⚠️ SMS service not configured - set FAST2SMS_API_KEY environment variable');
  }
} catch (error) {
  console.error('❌ SMS client initialization failed:', error.message);
}

/**
 * Send email notification
 * @private
 */
const sendEmail = async (candidateEmail, subject, body) => {
  if (!emailTransporters.length) {
    console.warn('[Email] Service not configured - skipping email');
    return { sent: false, error: 'Email service not configured' };
  }

  try {
    let lastError = null;

    for (const { transporter, cfg } of emailTransporters) {
      try {
        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          to: candidateEmail,
          subject: subject,
          text: body,
          html: body.replace(/\n/g, '<br>')
        });

        console.log('[Email] ✅ Sent successfully to:', candidateEmail, `via ${cfg.host}:${cfg.port}`);
        return {
          sent: true,
          recipient: candidateEmail,
          messageId: info.messageId,
          timestamp: new Date(),
          transport: `${cfg.host}:${cfg.port}`
        };
      } catch (err) {
        lastError = err;
        console.warn('[Email] Transport failed, trying fallback:', `${cfg.host}:${cfg.port}`, err.message);
      }
    }

    throw lastError || new Error('No email transporter succeeded');
  } catch (error) {
    console.error('[Email] ❌ Failed to send:', error.message);
    return {
      sent: false,
      recipient: candidateEmail,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Send SMS notification using Fast2SMS
 * @private
 */
const sendSMS = async (candidateMobile, message, options = {}) => {
  if (!smsConfigured || !process.env.FAST2SMS_API_KEY) {
    console.warn('[SMS] Service not configured - skipping SMS');
    return { sent: false, error: 'SMS service not configured' };
  }

  try {
    // Format phone number (remove +91 if present, Fast2SMS expects 10 digit number)
    const formattedPhone = candidateMobile.replace(/^\+91/, '').replace(/[^0-9]/g, '');

    if (formattedPhone.length !== 10) {
      throw new Error('Invalid mobile number format. Expected 10 digits.');
    }

    const senderId = (options.senderId || process.env.FAST2SMS_SENDER_ID || 'MACRNX').trim();
    const templateId = options.templateId || process.env.FAST2SMS_DLT_TEMPLATE_ID || '1201165952827610401';
    
    console.log('[SMS] Using sender ID:', senderId, '| Template ID:', templateId);

    // Fast2SMS API request (DLT transactional route)
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'dlt',
        message: message,
        language: 'english',
        flash: 0,
        numbers: formattedPhone,
        sender_id: senderId,
        dlt_template_id: templateId
      },
      {
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.return === true) {
      console.log('[SMS] ✅ Sent successfully to:', formattedPhone);
      console.log('[SMS] Message ID:', response.data.message_id);
      
      return {
        sent: true,
        recipient: formattedPhone,
        messageId: response.data.message_id,
        timestamp: new Date()
      };
    } else {
      throw new Error(response.data.message || 'Fast2SMS API returned failure');
    }
  } catch (error) {
    console.error('[SMS] ❌ Failed to send:', error.response?.data || error.message);
    return {
      sent: false,
      recipient: candidateMobile,
      error: error.response?.data?.message || error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Send notification to candidate with submission link
 * @param {Object} data - Notification data
 * @param {string} data.candidateName - Candidate name
 * @param {string} data.candidateEmail - Candidate email
 * @param {string} data.candidateMobile - Candidate mobile
 * @param {string} data.caseNumber - Case number
 * @param {string} data.referenceNumber - Reference number
 * @param {string} data.submissionLink - Tokenized submission link
 * @param {number} data.recordId - Record ID for short link mapping
 * @param {Date} data.expiresAt - Token expiry date
 * @param {Object} options - Sending options
 * @param {boolean} options.sendEmail - Send email (default: true)
 * @param {boolean} options.sendSMS - Send SMS (default: false)
 * @returns {Promise<Object>} Notification result
 */
const sendCandidateNotification = async (data, options = {}) => {
  const {
    candidateName,
    candidateEmail,
    candidateMobile,
    caseNumber,
    referenceNumber,
    submissionLink,
    recordId,
    expiresAt
  } = data;

  // Default options: send email only (SMS is optional)
  const { sendEmail: shouldSendEmail = true, sendSMS: shouldSendSMS = false } = options;

  console.log('[Notification] Sending to candidate:', candidateName);
  console.log('[Notification] Channels:', { email: shouldSendEmail, sms: shouldSendSMS });

  const expiryDate = new Date(expiresAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Create short link for SMS (expiry: 72 hours)
  let shortUrl = submissionLink;
  try {
    if (recordId) {
      const shortLink = await createShortLink(submissionLink, recordId, 72);
      shortUrl = buildShortUrl(shortLink.short_code);
      console.log('[Notification] Short URL created:', shortUrl);
    } else {
      console.warn('[Notification] No recordId provided; using full URL for SMS');
    }
  } catch (error) {
    console.error('[Notification] Failed to create short link:', error.message);
    console.error('[Notification] Falling back to full URL in SMS');
    // Continue with full link as fallback
  }

  // Get first name for SMS
  const firstName = candidateName.split(' ')[0];

  // Email content (can use full URL)
  const emailSubject = `Action Required: Submit Verification for Case ${caseNumber}`;
  const emailBody = `
Dear ${candidateName},

You have been assigned to submit verification details for the following case:

Case Number: ${caseNumber}
Reference Number: ${referenceNumber}

Please click the link below to access the submission form:
${submissionLink}

IMPORTANT:
- This link is valid until: ${expiryDate}
- The link can only be used once
- Please ensure you have all required documents and photos ready before submitting

Required documents:
- Candidate selfie
- ID proof
- House door photo

If you have any questions or issues, please contact our support team.

Best regards,
Macronix Verification System
`;

  // SMS content - MUST match the approved DLT template wording exactly
  const smsBody = `Dear ${firstName}, to complete your address verification please click the link below and fill the form: ${shortUrl}`;
  const smsTemplateId = process.env.FAST2SMS_DLT_TEMPLATE_ID || '1201165952827610401';
  console.log('[SMS] URL selected for SMS:', shortUrl);
  
  // Validate SMS length
  if (smsBody.length > 160) {
    console.warn('[SMS] Warning: Message length exceeds 160 characters:', smsBody.length);
  } else {
    console.log('[SMS] Message length:', smsBody.length, 'characters');
  }

  const result = {
    success: false,
    email: null,
    sms: null
  };

  try {
    // Send email if requested
    if (shouldSendEmail && candidateEmail) {
      result.email = await sendEmail(candidateEmail, emailSubject, emailBody);
    } else if (shouldSendEmail && !candidateEmail) {
      result.email = { sent: false, error: 'Email address not provided' };
    }

    // Send SMS if requested
    if (shouldSendSMS && candidateMobile) {
      result.sms = await sendSMS(candidateMobile, smsBody, { templateId: smsTemplateId });
    } else if (shouldSendSMS && !candidateMobile) {
      result.sms = { sent: false, error: 'Mobile number not provided' };
    }

    // Consider overall success if at least one channel succeeded
    const emailSuccess = !shouldSendEmail || (result.email && result.email.sent);
    const smsSuccess = !shouldSendSMS || (result.sms && result.sms.sent);
    result.success = emailSuccess || smsSuccess;

    return result;

  } catch (error) {
    console.error('[Notification] Unexpected error:', error);
    result.error = error.message;
    return result;
  }
};

/**
 * Send reminder notification to candidate
 * Can be used for cron jobs to remind candidates before expiry
 * @param {Object} data - Reminder data
 * @param {string} data.candidateName - Candidate name
 * @param {string} data.candidateEmail - Candidate email
 * @param {string} data.candidateMobile - Candidate mobile
 * @param {string} data.caseNumber - Case number
 * @param {string} data.submissionLink - Tokenized submission link
 * @param {number} data.hoursRemaining - Hours until expiry
 * @param {Object} options - Sending options
 * @param {boolean} options.sendEmail - Send email (default: true)
 * @param {boolean} options.sendSMS - Send SMS (default: false)
 * @returns {Promise<Object>} Notification result
 */
const sendReminderNotification = async (data, options = {}) => {
  const {
    candidateName,
    candidateEmail,
    candidateMobile,
    caseNumber,
    submissionLink,
    hoursRemaining
  } = data;

  const { sendEmail: shouldSendEmail = true, sendSMS: shouldSendSMS = false } = options;

  const emailSubject = `Reminder: Case ${caseNumber} submission expires in ${hoursRemaining} hours`;
  const emailBody = `
Dear ${candidateName},

This is a reminder that your verification submission link will expire in ${hoursRemaining} hours.

Case Number: ${caseNumber}
Submission Link: ${submissionLink}

Please complete the submission as soon as possible to avoid expiry.

Best regards,
Macronix Verification System
`;

  const smsBody = `Reminder: Submit case ${caseNumber} within ${hoursRemaining}hrs. Link: ${submissionLink}`;
  const smsTemplateId = options.smsTemplateId || process.env.FAST2SMS_REMINDER_TEMPLATE_ID;

  const result = {
    success: false,
    email: null,
    sms: null
  };

  try {
    if (shouldSendEmail && candidateEmail) {
      result.email = await sendEmail(candidateEmail, emailSubject, emailBody);
    }

    if (shouldSendSMS && candidateMobile) {
      if (!smsTemplateId) {
        result.sms = { sent: false, error: 'Reminder SMS template ID not configured' };
      } else {
        result.sms = await sendSMS(candidateMobile, smsBody, { templateId: smsTemplateId });
      }
    }

    const emailSuccess = !shouldSendEmail || (result.email && result.email.sent);
    const smsSuccess = !shouldSendSMS || (result.sms && result.sms.sent);
    result.success = emailSuccess || smsSuccess;

    return result;
  } catch (error) {
    console.error('[Reminder] Error:', error);
    result.error = error.message;
    return result;
  }
};

module.exports = {
  sendCandidateNotification,
  sendReminderNotification
};
