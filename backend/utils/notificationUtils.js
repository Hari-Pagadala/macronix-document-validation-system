/**
 * Notification utility for sending emails and SMS to candidates
 * Integrated with Nodemailer (SMTP) and Twilio (SMS)
 */

const nodemailer = require('nodemailer');

// Initialize email transporter (SMTP)
let emailTransporter = null;
try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });
    console.log('✅ Email transporter initialized');
  } else {
    console.warn('⚠️ Email service not configured - set SMTP environment variables');
  }
} catch (error) {
  console.error('❌ Email transporter initialization failed:', error.message);
}

// Initialize SMS client (Twilio)
let smsClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    smsClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ SMS client initialized');
  } else {
    console.warn('⚠️ SMS service not configured - set TWILIO environment variables');
  }
} catch (error) {
  console.error('❌ SMS client initialization failed:', error.message);
}

/**
 * Send email notification
 * @private
 */
const sendEmail = async (candidateEmail, subject, body) => {
  if (!emailTransporter) {
    console.warn('[Email] Service not configured - skipping email');
    return { sent: false, error: 'Email service not configured' };
  }

  try {
    const info = await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: candidateEmail,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    });

    console.log('[Email] ✅ Sent successfully to:', candidateEmail);
    console.log('[Email] Message ID:', info.messageId);
    
    return {
      sent: true,
      recipient: candidateEmail,
      messageId: info.messageId,
      timestamp: new Date()
    };
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
 * Send SMS notification
 * @private
 */
const sendSMS = async (candidateMobile, message) => {
  if (!smsClient) {
    console.warn('[SMS] Service not configured - skipping SMS');
    return { sent: false, error: 'SMS service not configured' };
  }

  try {
    // Format phone number for Twilio (add +91 country code for India)
    const formattedPhone = candidateMobile.startsWith('+') 
      ? candidateMobile 
      : `+91${candidateMobile}`;

    const smsFrom = process.env.TWILIO_SENDER_ID || process.env.TWILIO_PHONE_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    if (!messagingServiceSid && !smsFrom) {
      throw new Error('Twilio configuration missing: set TWILIO_SENDER_ID or TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID');
    }

    const payload = {
      body: message,
      to: formattedPhone
    };

    if (messagingServiceSid) {
      payload.messagingServiceSid = messagingServiceSid;
    } else {
      payload.from = smsFrom;
    }

    const result = await smsClient.messages.create(payload);

    console.log('[SMS] ✅ Sent successfully to:', formattedPhone);
    console.log('[SMS] Message SID:', result.sid);
    
    return {
      sent: true,
      recipient: formattedPhone,
      messageSid: result.sid,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('[SMS] ❌ Failed to send:', error.message);
    return {
      sent: false,
      recipient: candidateMobile,
      error: error.message,
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

  // Email content
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

  // SMS content (keep it short - 160 characters ideal)
  const smsBody = `Macronix: Submit case ${caseNumber} by ${expiryDate}. Link: ${submissionLink}`;

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
      result.sms = await sendSMS(candidateMobile, smsBody);
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
      result.sms = await sendSMS(candidateMobile, smsBody);
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
