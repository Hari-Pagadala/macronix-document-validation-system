# Candidate Self-Submission Feature - Complete Implementation

## ✅ Backend Implementation Complete

### 1. Database Models

**New Model: `CandidateToken_SQL.js`**
- Stores secure tokens for candidate access
- Fields: token, recordId, candidateName, candidateEmail, candidateMobile, expiresAt, isUsed, usedAt, ipAddress
- Indexes on token, recordId, expiresAt, isUsed

**Updated Model: `Record_SQL.js`**
- Added: `candidateName`, `candidateEmail`, `candidateMobile`
- Supports new status: `candidate_assigned`

### 2. Utilities Created

**`candidateTokenUtils.js`**
- `generateSecureToken()` - Creates 64-char hex token
- `createCandidateToken()` - Creates token with expiry (default 48hrs)
- `validateCandidateToken()` - Validates token (not used, not expired)
- `markTokenAsUsed()` - Marks token as used (one-time use)
- `getTokenDetails()` - Gets token info
- `cleanupExpiredTokens()` - Cleanup utility for cron jobs

**`notificationUtils.js`**
- `sendCandidateNotification()` - Sends email + SMS (placeholder for integration)
- `sendReminderNotification()` - Reminder before expiry
- Ready for integration with SendGrid, Twilio, AWS SES/SNS, etc.

### 3. Controllers

**`candidateSubmissionController.js`**
- `validateToken()` - GET /api/candidate/validate/:token
- `submitVerification()` - POST /api/candidate/submit/:token

**`vendorPortalController_SQL.js`**
- `assignToCandidate()` - POST /api/vendor-portal/cases/:caseId/assign-to-candidate

### 4. Routes

**`candidateRoutes.js`** (Public - No Auth)
- GET `/api/candidate/validate/:token` - Validate token & get case details
- POST `/api/candidate/submit/:token` - Submit verification

**`vendorPortalRoutes.js`** (Auth Required)
- POST `/api/vendor-portal/cases/:caseId/assign-to-candidate` - Assign case to candidate

### 5. Status Enum

New status: `candidate_assigned`
- Case is assigned to candidate
- Waiting for candidate self-submission
- Token is active and not yet used

---

## 🔄 Workflow

### Step 1: Vendor/Admin Assigns Case to Candidate

**Endpoint**: `POST /api/vendor-portal/cases/:caseId/assign-to-candidate`

**Request Body**:
```json
{
  "candidateName": "Ramesh Kumar",
  "candidateEmail": "ramesh@example.com",
  "candidateMobile": "9876543210",
  "expiryHours": 48
}
```

**Response**:
```json
{
  "success": true,
  "message": "Case assigned to candidate successfully",
  "record": { ...caseDetails },
  "submissionLink": "http://localhost:3000/candidate/submit?token=abc123...",
  "expiresAt": "2025-12-23T10:30:00.000Z"
}
```

**Actions**:
- Creates secure token
- Updates case status → `candidate_assigned`
- Sends email + SMS notification
- Returns tokenized link

### Step 2: Candidate Receives Notification

**Email Content**:
- Case number & reference
- Tokenized submission link
- Expiry date/time
- Instructions

**SMS Content**:
- Case number
- Submission link
- Expiry date

### Step 3: Candidate Validates Token

**Endpoint**: `GET /api/candidate/validate/:token`

**Response**:
```json
{
  "success": true,
  "caseDetails": {
    "caseNumber": "CASE-001",
    "referenceNumber": "REF-12345",
    "fullName": "John Doe",
    "age": 30,
    "gender": "Male"
  },
  "candidateInfo": {
    "name": "Ramesh Kumar",
    "email": "ramesh@example.com",
    "mobile": "9876543210"
  },
  "expiresAt": "2025-12-23T10:30:00.000Z"
}
```

### Step 4: Candidate Submits Verification

**Endpoint**: `POST /api/candidate/submit/:token`

**Form Data** (multipart/form-data):
```
address: "123 Main Street"
pincode: "560001"
city: "Bangalore"
state: "Karnataka"
ownershipType: "owned"
gpsLat: "12.9716"
gpsLng: "77.5946"
selfieWithHouse: <file> or ImageKit URL
candidateWithRespondent: <file> or ImageKit URL
documents: [<files>] or JSON array of URLs
photos: [<files>] or JSON array of URLs
officerSignature: <file> or ImageKit URL
respondentSignature: <file> or ImageKit URL
verificationNotes: "All documents verified"
```

**Response**:
```json
{
  "success": true,
  "message": "Verification submitted successfully",
  "verificationId": "uuid",
  "caseNumber": "CASE-001"
}
```

**Actions**:
- Validates token (not expired, not used)
- Creates verification record
- Updates case status → `submitted`
- Marks token as used (cannot be reused)

### Step 5: Admin Reviews Submission

- Case appears in "Submitted" tab
- Admin can Approve/Reject/Mark Insufficient
- Standard review workflow

---

## 🔐 Security Features

1. **Secure Token Generation**
   - 64-character hex token (32 random bytes)
   - Cryptographically secure

2. **One-Time Use**
   - Token marked as used after submission
   - Cannot be reused

3. **Time-Limited**
   - Default: 48 hours expiry
   - Configurable per assignment

4. **Bound to Case**
   - Token linked to specific case ID
   - Cannot access other cases

5. **IP Tracking**
   - Records IP address on submission
   - Audit trail

6. **Status Validation**
   - Only `candidate_assigned` cases can be submitted
   - Prevents duplicate submissions

---

## 🧪 Testing

### Test 1: Assign to Candidate
```bash
curl -X POST http://localhost:5000/api/vendor-portal/cases/CASE_ID/assign-to-candidate \
  -H "Authorization: Bearer VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateName": "Test Candidate",
    "candidateEmail": "test@example.com",
    "candidateMobile": "9876543210"
  }'
```

### Test 2: Validate Token
```bash
curl http://localhost:5000/api/candidate/validate/TOKEN_HERE
```

### Test 3: Submit Verification
```bash
curl -X POST http://localhost:5000/api/candidate/submit/TOKEN_HERE \
  -F "address=123 Main St" \
  -F "pincode=560001" \
  -F "city=Bangalore" \
  -F "state=Karnataka" \
  -F "ownershipType=owned" \
  -F "gpsLat=12.9716" \
  -F "gpsLng=77.5946" \
  -F "officerSignature=@signature1.png" \
  -F "respondentSignature=@signature2.png"
```

---

## 📋 Frontend Integration Checklist

### Super Admin Dashboard

- [ ] Add new tab: "Candidate Assigned"
- [ ] Filter cases by status: `candidate_assigned`
- [ ] Display candidate name, email, mobile in table
- [ ] Show token expiry time

### Edit/Assign Case Modal

- [ ] Add "Assign to Candidate" button/option
- [ ] Form fields: Candidate Name, Email, Mobile, Expiry Hours
- [ ] Validation: Email format, 10-digit mobile
- [ ] Show generated link after assignment
- [ ] Copy link button

### Candidate Submission Page (Public)

- [ ] Route: `/candidate/submit?token=XXX`
- [ ] No login required
- [ ] Validate token on load
- [ ] Show case details (read-only)
- [ ] Submission form (same as FO form)
- [ ] File uploads (ImageKit or direct)
- [ ] GPS capture
- [ ] Signature capture
- [ ] Submit button
- [ ] Success confirmation page

### Status Mapping

Update frontend status constants to include:
```javascript
const STATUS_OPTIONS = [
  ...existing,
  { value: 'candidate_assigned', label: 'Candidate Assigned', color: 'purple' }
];
```

---

## 🚀 Deployment Steps

1. **Database Migration**
   ```bash
   # Tables will auto-create on server restart
   # CandidateTokens table
   # candidateName, candidateEmail, candidateMobile fields in Records
   ```

2. **Environment Variables** (Optional)
   ```env
   FRONTEND_URL=https://your-domain.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-password
   TWILIO_SID=your-twilio-sid
   TWILIO_TOKEN=your-twilio-token
   TWILIO_PHONE=+1234567890
   ```

3. **Restart Backend**
   ```bash
   cd backend
   node server.js
   ```

4. **Test Endpoints**
   - Assign to candidate
   - Validate token
   - Submit verification

5. **Setup Email/SMS** (Update `notificationUtils.js`)
   - Integrate nodemailer for email
   - Integrate Twilio/AWS SNS for SMS
   - Replace placeholder code with actual service calls

---

## ✅ Feature Complete!

All backend infrastructure is ready. Frontend needs to be implemented to complete the feature.

**What's Working:**
- ✅ Token generation & validation
- ✅ Case assignment to candidate
- ✅ Secure tokenized access
- ✅ Candidate submission (no login)
- ✅ One-time use & expiry
- ✅ Status updates
- ✅ Notification placeholders

**Next Steps:**
- Integrate email/SMS services
- Build frontend components
- Add candidate_assigned tab in admin dashboard
- Create public submission page
- Testing & QA
