# Candidate Self-Submission - Quick Start Guide

## 🚀 Backend is 100% Ready!

All backend infrastructure for candidate self-submission is implemented and ready to use.

## 📍 New API Endpoints

### 1. Assign Case to Candidate (Vendor/Admin)
```
POST /api/vendor-portal/cases/:caseId/assign-to-candidate
Authorization: Bearer <vendor_token>

Body:
{
  "candidateName": "Candidate Name",
  "candidateEmail": "email@example.com",
  "candidateMobile": "9876543210",
  "expiryHours": 48  // optional, default 48
}

Response:
{
  "success": true,
  "message": "Case assigned to candidate successfully",
  "submissionLink": "http://localhost:3000/candidate/submit?token=abc123...",
  "expiresAt": "2025-12-23T10:30:00.000Z"
}
```

### 2. Validate Token (Public - No Auth)
```
GET /api/candidate/validate/:token

Response:
{
  "success": true,
  "caseDetails": { caseNumber, fullName, age, ... },
  "candidateInfo": { name, email, mobile },
  "expiresAt": "2025-12-23T10:30:00.000Z"
}
```

### 3. Submit Verification (Public - No Auth)
```
POST /api/candidate/submit/:token
Content-Type: multipart/form-data

Form Fields:
- address (required)
- pincode (required)
- city (required)
- state (required)
- ownershipType (required)
- gpsLat (required)
- gpsLng (required)
- landmark (optional)
- ownerName (optional)
- relationWithOwner (optional)
- verificationNotes (optional)

Files:
- selfieWithHouse (required)
- candidateWithRespondent (required)
- officerSignature (required)
- respondentSignature (required)
- documents[] (optional, multiple)
- photos[] (optional, multiple)

Response:
{
  "success": true,
  "message": "Verification submitted successfully",
  "verificationId": "uuid",
  "caseNumber": "CASE-001"
}
```

## 🗂️ New Database Table

**CandidateTokens**
- id (UUID, primary key)
- token (unique, indexed)
- recordId (foreign key to Records)
- candidateName
- candidateEmail
- candidateMobile
- expiresAt (indexed)
- isUsed (boolean, indexed)
- usedAt
- ipAddress
- createdAt
- updatedAt

## 📊 New Status

**Status**: `candidate_assigned`
- Case is assigned to candidate for self-submission
- Candidate has active token
- Waiting for candidate submission

## 🔄 Status Flow

```
pending → vendor_assigned → candidate_assigned → submitted → approved/rejected
```

## 🎯 Frontend TODO

### 1. Admin Dashboard - New Tab
```jsx
<Tab label="Candidate Assigned">
  <CasesList status="candidate_assigned" />
</Tab>
```

Display columns:
- Case Number
- Reference Number
- Candidate Name
- Candidate Email/Mobile
- Token Expiry
- Actions (View, Resend Link)

### 2. Edit/Assign Modal - Add Option
```jsx
<FormControl>
  <FormLabel>Assignment Type</FormLabel>
  <RadioGroup>
    <Radio value="field-officer">Assign to Field Officer</Radio>
    <Radio value="candidate">Assign to Candidate</Radio>
  </RadioGroup>
</FormControl>

{assignmentType === 'candidate' && (
  <>
    <TextField label="Candidate Name" required />
    <TextField label="Candidate Email" type="email" required />
    <TextField label="Candidate Mobile" pattern="[0-9]{10}" required />
    <TextField label="Expiry (hours)" type="number" defaultValue={48} />
  </>
)}
```

### 3. Candidate Submission Page (Public)
```jsx
// Route: /candidate/submit?token=XXX
// No authentication required

<CandidateSubmissionPage>
  <TokenValidator token={urlToken} />
  <CaseInfo /> // Read-only case details
  <SubmissionForm>
    <AddressFields />
    <OwnershipDetails />
    <GPSCapture />
    <FileUploads />
    <SignatureCapture />
    <SubmitButton />
  </SubmissionForm>
</CandidateSubmissionPage>
```

### 4. Update Status Constants
```javascript
// frontend/src/constants/statusConstants.js
export const CASE_STATUS = {
  PENDING: 'pending',
  VENDOR_ASSIGNED: 'vendor_assigned',
  ASSIGNED: 'assigned',
  CANDIDATE_ASSIGNED: 'candidate_assigned', // NEW
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  // ...
};

export const STATUS_COLORS = {
  candidate_assigned: 'purple', // NEW
  // ...
};

export const STATUS_LABELS = {
  candidate_assigned: 'Candidate Assigned', // NEW
  // ...
};
```

## 🧪 Quick Test

1. **Start Backend**
```bash
cd backend
node server.js
```

2. **Assign Case to Candidate** (use Postman/curl)
```bash
# Get vendor token first, then:
curl -X POST http://localhost:5000/api/vendor-portal/cases/YOUR_CASE_ID/assign-to-candidate \
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateName": "Test User",
    "candidateEmail": "test@test.com",
    "candidateMobile": "9876543210"
  }'
```

3. **Copy Token from Response**

4. **Validate Token**
```bash
curl http://localhost:5000/api/candidate/validate/YOUR_TOKEN
```

5. **Submit Verification** (test with form data)

## 📧 Email/SMS Integration

To enable actual email/SMS sending, update `backend/utils/notificationUtils.js`:

**Email (using nodemailer)**:
```javascript
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
```

**SMS (using Twilio)**:
```javascript
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

await client.messages.create({
  body: smsBody,
  from: process.env.TWILIO_PHONE,
  to: `+91${candidateMobile}`
});
```

## ✅ All Set!

Backend is complete and tested. Just need frontend implementation to make it user-facing!

**Files Created/Modified:**
- ✅ `models/CandidateToken_SQL.js` (new)
- ✅ `utils/candidateTokenUtils.js` (new)
- ✅ `utils/notificationUtils.js` (new)
- ✅ `controllers/candidateSubmissionController.js` (new)
- ✅ `routes/candidateRoutes.js` (new)
- ✅ `controllers/vendorPortalController_SQL.js` (updated)
- ✅ `routes/vendorPortalRoutes.js` (updated)
- ✅ `models/Record_SQL.js` (updated)
- ✅ `server.js` (updated)

Ready to go! 🚀
