# Email and SMS Notification Configuration Guide

## Overview

The system now supports sending verification links to candidates via both Email and SMS. This guide explains how to configure and use these features.

## Features

✅ **Email Sending** via SMTP (Nodemailer)  
✅ **SMS Sending** via Twilio  
✅ **Independent failure handling** (Email failure doesn't block SMS and vice versa)  
✅ **Selective sending** - Choose Email, SMS, or both  
✅ **Status tracking** - Track delivery status in database  
✅ **Time-bound tokens** - Links expire after configured hours (default: 48hrs)  

---

## Environment Configuration

### 1. Email Configuration (SMTP)

Add these environment variables to your `.env` file in the `backend` folder:

```env
# SMTP Configuration for Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Macronix Verification <noreply@macronix.com>
```

#### Gmail Setup Instructions:
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an "App Password":
   - Go to Security → 2-Step Verification → App passwords
   - Create a password for "Mail"
   - Copy the 16-character password
4. Use this password as `SMTP_PASS` in your `.env` file

#### Other SMTP Providers:

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-access-key-id
SMTP_PASS=your-secret-access-key
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

---

### 2. SMS Configuration (Twilio)

Add these environment variables to your `.env` file:

```env
# Twilio Configuration for SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Twilio Setup Instructions:
1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase a phone number or use the trial number
4. Add these credentials to your `.env` file

**Important Notes:**
- Trial accounts can only send SMS to verified phone numbers
- Add country code (+91 for India)
- Production accounts require payment setup

---

### 3. Frontend URL Configuration

```env
FRONTEND_URL=http://localhost:3000
```

Change this to your production URL when deploying:
```env
FRONTEND_URL=https://your-domain.com
```

---

## Database Schema Updates

The system automatically adds these fields to the `candidate_tokens` table:

```sql
ALTER TABLE candidate_tokens 
ADD COLUMN email_status VARCHAR(20) DEFAULT 'NOT_SENT',
ADD COLUMN email_sent_at TIMESTAMP,
ADD COLUMN email_error TEXT,
ADD COLUMN sms_status VARCHAR(20) DEFAULT 'NOT_SENT',
ADD COLUMN sms_sent_at TIMESTAMP,
ADD COLUMN sms_error TEXT;
```

**Status Values:**
- `SENT` - Successfully delivered
- `FAILED` - Delivery failed
- `NOT_SENT` - Channel not used

---

## How to Use

### For Admins/Vendors - Assigning Cases

#### Option 1: Email Only (Default)
1. Click "Assign to Candidate" button
2. ✅ Keep "Send Email" checked
3. ❌ Keep "Send SMS" unchecked
4. Click "Send Link"

#### Option 2: SMS Only
1. Click "Assign to Candidate" button
2. ❌ Uncheck "Send Email"
3. ✅ Check "Send SMS"
4. Click "Send Link"

#### Option 3: Both Email and SMS
1. Click "Assign to Candidate" button
2. ✅ Check "Send Email"
3. ✅ Check "Send SMS"
4. Click "Send Link"

**Note:** At least one notification method must be selected.

---

## API Usage

### Assign to Candidate (Admin/Vendor)

```http
POST /api/records/:id/assign-to-candidate
Authorization: Bearer <token>
Content-Type: application/json

{
  "candidateName": "John Doe",
  "candidateEmail": "john@example.com",
  "candidateMobile": "9876543210",
  "expiryHours": 48,
  "sendEmail": true,
  "sendSMS": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Case assigned to candidate successfully",
  "submissionLink": "http://localhost:3000/candidate/submit?token=abc123...",
  "expiresAt": "2025-12-25T10:30:00.000Z",
  "notificationStatus": {
    "email": {
      "sent": true,
      "recipient": "john@example.com",
      "messageId": "<msg-id>",
      "timestamp": "2025-12-23T10:30:00.000Z"
    },
    "sms": {
      "sent": false,
      "error": "Not requested"
    }
  }
}
```

---

### Resend Link

```http
POST /api/records/:id/resend-candidate-link
Authorization: Bearer <token>
Content-Type: application/json

{
  "expiryHours": 48,
  "sendEmail": true,
  "sendSMS": true
}
```

---

## Email Template

**Subject:** Action Required: Submit Verification for Case {caseNumber}

**Body:**
```
Dear {candidateName},

You have been assigned to submit verification details for the following case:

Case Number: {caseNumber}
Reference Number: {referenceNumber}

Please click the link below to access the submission form:
{submissionLink}

IMPORTANT:
- This link is valid until: {expiryDate}
- The link can only be used once
- Please ensure you have all required documents and photos ready before submitting

Required documents:
- Candidate selfie
- ID proof
- House door photo

If you have any questions or issues, please contact our support team.

Best regards,
Macronix Verification System
```

---

## SMS Template

```
Macronix: Submit case {caseNumber} by {expiryDate}. Link: {submissionLink}
```

**Character count:** ~100-150 characters (within SMS limit)

---

## Troubleshooting

### Email Not Sending

**Issue:** Email status shows "FAILED"

**Solutions:**
1. Check SMTP credentials in `.env` file
2. Verify SMTP host and port are correct
3. For Gmail, ensure you're using an App Password, not your account password
4. Check if "Less secure app access" is enabled (for non-app passwords)
5. Verify EMAIL_FROM format: `"Name <email@domain.com>"`
6. Check backend logs for detailed error messages

### SMS Not Sending

**Issue:** SMS status shows "FAILED"

**Solutions:**
1. Verify Twilio Account SID and Auth Token
2. Check if Twilio phone number is correct
3. For trial accounts, verify the recipient number is verified in Twilio
4. Ensure phone number includes country code (+91)
5. Check Twilio account balance
6. Review Twilio dashboard for blocked/failed messages

### Notification Status: "NOT_SENT"

This is normal if:
- The channel was not requested (e.g., SMS not checked)
- The service is not configured (missing environment variables)

---

## Testing

### Test Email Locally

1. Use a test SMTP service like Mailtrap:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

2. All emails will be captured in Mailtrap inbox for testing

### Test SMS with Twilio Trial

1. Sign up for Twilio trial account
2. Verify your phone number in Twilio console
3. Use trial credentials:
```env
TWILIO_ACCOUNT_SID=AC...trial-sid...
TWILIO_AUTH_TOKEN=your-trial-token
TWILIO_PHONE_NUMBER=+15005550006 (Twilio test number)
```

4. SMS will only be sent to verified numbers

---

## Production Deployment Checklist

- [ ] Update `FRONTEND_URL` to production domain
- [ ] Use production SMTP credentials (not trial/test accounts)
- [ ] Upgrade Twilio to paid account for unrestricted SMS
- [ ] Test email delivery to multiple email providers (Gmail, Outlook, etc.)
- [ ] Test SMS delivery to real phone numbers
- [ ] Monitor email/SMS delivery rates in backend logs
- [ ] Set up email bounce and complaint handling
- [ ] Configure Twilio webhook for SMS delivery status
- [ ] Review and optimize email templates for mobile devices
- [ ] Set up monitoring alerts for failed notifications

---

## Cost Estimation

### Email (Gmail/AWS SES)
- Gmail: FREE (with account limits)
- AWS SES: $0.10 per 1,000 emails
- SendGrid: Free tier (100 emails/day), paid plans start at $19.95/month

### SMS (Twilio)
- India: ~₹0.50-1.00 per SMS
- US: ~$0.0079 per SMS
- International rates vary by country

---

## Security Best Practices

1. **Never commit `.env` file** to git
2. Use environment variables for all secrets
3. Rotate credentials periodically
4. Use App Passwords for Gmail (not account password)
5. Enable Twilio account security features
6. Monitor unusual activity in email/SMS logs
7. Implement rate limiting for notification sending
8. Validate email and phone numbers before sending

---

## Support

For issues or questions:
- Email: support@macronix.com
- Documentation: See README.md
- Backend logs: Check terminal output for detailed errors

---

**Last Updated:** December 23, 2025  
**Version:** 1.0
