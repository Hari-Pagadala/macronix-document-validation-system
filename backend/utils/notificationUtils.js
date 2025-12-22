/**
 * Notification utility for sending emails and SMS to candidates
 * This is a placeholder - integrate with your actual email/SMS service
 */

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
 * @returns {Promise<Object>} Notification result
 */
const sendCandidateNotification = async (data) => {
  const {
    candidateName,
    candidateEmail,
    candidateMobile,
    caseNumber,
    referenceNumber,
    submissionLink,
    expiresAt
  } = data;

  console.log('[Notification] Sending to candidate:', candidateName);

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
- Address proof documents
- Property photos
- Candidate photo with respondent
- Selfie at the address
- Signatures (field officer and respondent)

If you have any questions or issues, please contact our support team.

Best regards,
Macronix Verification System
`;

  // SMS content (keep it short)
  const smsBody = `Macronix: Submit verification for case ${caseNumber}. Link: ${submissionLink} (Valid until ${expiryDate})`;

  try {
    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    console.log('[Email] To:', candidateEmail);
    console.log('[Email] Subject:', emailSubject);
    console.log('[Email] Body:', emailBody);

    // TODO: Integrate with actual SMS service (Twilio, AWS SNS, etc.)
    console.log('[SMS] To:', candidateMobile);
    console.log('[SMS] Body:', smsBody);

    // For now, just log - replace with actual service calls
    // Example with nodemailer:
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: candidateEmail,
      subject: emailSubject,
      text: emailBody
    });
    */

    // Example with Twilio:
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    
    await client.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE,
      to: `+91${candidateMobile}`
    });
    */

    return {
      success: true,
      email: {
        sent: true, // Set to false until integrated
        recipient: candidateEmail,
        placeholder: true
      },
      sms: {
        sent: true, // Set to false until integrated
        recipient: candidateMobile,
        placeholder: true
      }
    };

  } catch (error) {
    console.error('[Notification] Error:', error);
    throw error;
  }
};

/**
 * Send reminder notification to candidate
 * Can be used for cron jobs to remind candidates before expiry
 */
const sendReminderNotification = async (data) => {
  const {
    candidateName,
    candidateEmail,
    candidateMobile,
    caseNumber,
    submissionLink,
    hoursRemaining
  } = data;

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

  const smsBody = `Reminder: Submit verification for case ${caseNumber} within ${hoursRemaining} hours. Link: ${submissionLink}`;

  console.log('[Reminder Email]:', emailSubject);
  console.log('[Reminder SMS]:', smsBody);

  // TODO: Implement actual sending logic
  return { success: true, placeholder: true };
};

module.exports = {
  sendCandidateNotification,
  sendReminderNotification
};
