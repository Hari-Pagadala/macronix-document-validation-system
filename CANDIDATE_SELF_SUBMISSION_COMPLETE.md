# Candidate Self-Submission Feature - Complete Implementation

## Overview

The **Candidate Self-Submission** feature allows vendors to assign verification cases directly to candidates (end users) via a secure link. Candidates can then submit their verification data themselves through a public form without needing to login or download any app.

---

## 🎯 Key Benefits

1. **No App Required**: Candidates don't need to install the mobile app
2. **Secure Token System**: One-time use tokens with expiry for security
3. **GPS Auto-Capture**: Automatic location capture for verification
4. **Multiple File Uploads**: Support for selfies, documents, photos, and signatures
5. **User-Friendly**: Simple form interface accessible from any device
6. **Real-time Validation**: Token validation before form submission

---

## 🏗️ Architecture

### Backend Components

#### 1. **Database Model** - `models/CandidateToken_SQL.js`
```javascript
{
  token: STRING(64),          // Unique secure token
  recordId: INTEGER,          // Case reference
  candidateName: STRING,      // Candidate name
  candidateEmail: STRING,     // Candidate email
  candidateMobile: STRING,    // Candidate mobile
  expiresAt: DATE,           // Token expiry
  isUsed: BOOLEAN,           // One-time use flag
  usedAt: DATE,              // Timestamp when used
  ipAddress: STRING          // IP for audit trail
}
```

#### 2. **Token Utilities** - `utils/candidateTokenUtils.js`
- `generateSecureToken()`: Creates 64-character hex token
- `createCandidateToken()`: Stores token with candidate info
- `validateCandidateToken()`: Checks token validity
- `markTokenAsUsed()`: Marks token as consumed

#### 3. **Controllers** - `controllers/candidateSubmissionController.js`
- `validateToken()`: GET endpoint to validate token
- `submitVerification()`: POST endpoint to submit verification

#### 4. **Routes** - `routes/candidateRoutes.js`
```javascript
GET  /api/candidate/validate/:token  // Validate token
POST /api/candidate/submit/:token    // Submit verification
```

#### 5. **Vendor Portal Integration** - `controllers/vendorPortalController_SQL.js`
- `assignToCandidate()`: Creates token and assigns case to candidate

### Frontend Components

#### 1. **Candidate Submission Page** - `pages/CandidateSubmissionPage.js`

**Features:**
- Token validation on page load
- Auto-capture GPS location
- Form fields:
  - Address (required)
  - Ownership Details (Owner/Tenant)
  - GPS Coordinates (auto-filled)
- File uploads:
  - Field Officer Selfie (required)
  - Candidate Photo (required)
  - Documents (optional, multiple)
  - Additional Photos (optional, multiple)
  - Candidate Signature (required)
  - Witness Signature (optional)
- Validation & error handling
- Success state with confirmation

**Route:** `/candidate/submit/:token` (public, no authentication)

#### 2. **Assignment Modal** - `components/AssignToCandidateModal.js`

**Features:**
- Candidate information form
  - Name (required)
  - Email (required, validated)
  - Mobile (required, validated)
  - Expiry hours (default: 48)
- Generates submission link
- Copy-to-clipboard functionality
- Email/SMS notification placeholders

**Integration:** Opens from VendorCasesTable actions menu

#### 3. **Updated Components**

**VendorCasesTable.js:**
- Added "Assign to Candidate" menu option
- Integrated AssignToCandidateModal
- Status badge for candidate_assigned

**Dashboard.js:**
- Added "Candidate Assigned" stats card
- Added "Candidate Assigned" tab
- Updated tabStatusMap

**RecordsTable.js:**
- Added candidate_assigned status config

**VendorDashboard.js:**
- Added "Candidate Assigned" tab
- Updated status mapping

**App.js:**
- Added public route: `/candidate/submit/:token`

---

## 🔐 Security Features

### 1. Token Security
- **Crypto-Random**: Uses Node.js crypto for secure token generation
- **64-Character Hex**: Extremely low collision probability
- **One-Time Use**: Token invalidated after submission
- **Expiry**: Configurable expiry (default 48 hours)
- **IP Tracking**: Records IP address for audit trail

### 2. Validation
- Token validity checked before form access
- Token expiry enforcement
- Token reuse prevention
- Email format validation
- Mobile number format validation (10 digits)
- Required field validation

### 3. File Upload Security
- File size validation (5MB per file)
- ImageKit integration for secure storage
- Multipart form data handling
- File type validation on backend

---

## 📊 Status Flow

```
pending 
  ↓
vendor_assigned 
  ↓
candidate_assigned  ← New status
  ↓
assigned (field officer)
  ↓
submitted
  ↓
approved / insufficient / rejected
```

---

## 🚀 Usage Guide

### For Vendors

1. **Navigate to Cases Tab**
   - Go to Vendor Dashboard → Cases

2. **Select a Case**
   - Click the three-dot menu on any case
   - Choose "Assign to Candidate"

3. **Fill Candidate Details**
   - Enter candidate name
   - Enter candidate email
   - Enter candidate mobile (10 digits)
   - Set expiry hours (optional, default 48)

4. **Generate Link**
   - Click "Generate Link"
   - Copy the submission link
   - Share with candidate via email/SMS/WhatsApp

### For Candidates

1. **Receive Link**
   - Vendor sends submission link via email/SMS

2. **Open Link**
   - Click the link (opens in browser)
   - No login required

3. **Fill Form**
   - Address (auto-filled if available)
   - Ownership details (Owner/Tenant)
   - GPS (auto-captured, editable)

4. **Upload Files**
   - Field Officer Selfie (camera/gallery)
   - Candidate Photo (required)
   - Documents (optional)
   - Additional Photos (optional)
   - Signatures (required)

5. **Submit**
   - Review all details
   - Click "Submit Verification"
   - Confirmation shown on success

### For Admins

1. **Monitor Assignments**
   - Dashboard → "Candidate Assigned" tab
   - View all cases assigned to candidates

2. **Track Status**
   - Case moves from "vendor_assigned" → "candidate_assigned" → "submitted"

---

## 📋 API Endpoints

### 1. Validate Token
```http
GET /api/candidate/validate/:token

Response:
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "candidateName": "John Doe",
    "candidateEmail": "john@example.com",
    "candidateMobile": "9876543210",
    "caseNumber": "CASE001",
    "referenceNumber": "REF001"
  }
}
```

### 2. Submit Verification
```http
POST /api/candidate/submit/:token
Content-Type: multipart/form-data

Body:
- address (text)
- ownershipDetails (text)
- gpsLat (text)
- gpsLong (text)
- fieldOfficerSelfie (file)
- candidatePhoto (file)
- documents (files)
- photos (files)
- candidateSignature (file)
- witnessSignature (file)

Response:
{
  "success": true,
  "message": "Verification submitted successfully",
  "recordId": 123
}
```

### 3. Assign to Candidate (Vendor)
```http
POST /api/vendor-portal/cases/:id/assign-to-candidate
Authorization: Bearer <vendor_token>

Body:
{
  "candidateName": "John Doe",
  "candidateEmail": "john@example.com",
  "candidateMobile": "9876543210",
  "expiryHours": 48
}

Response:
{
  "success": true,
  "message": "Case assigned to candidate successfully",
  "submissionLink": "http://localhost:3000/candidate/submit/<token>"
}
```

---

## 🧪 Testing Guide

### 1. Test Token Generation
```bash
# Login as vendor
POST /api/vendor-portal/login

# Assign case to candidate
POST /api/vendor-portal/cases/1/assign-to-candidate
{
  "candidateName": "Test User",
  "candidateEmail": "test@test.com",
  "candidateMobile": "1234567890",
  "expiryHours": 48
}

# Note the submissionLink
```

### 2. Test Token Validation
```bash
# Use token from previous step
GET /api/candidate/validate/<token>

# Should return success with candidate info
```

### 3. Test Form Submission
```bash
# Use Postman or form
POST /api/candidate/submit/<token>
Content-Type: multipart/form-data

# Include all required files and fields
```

### 4. Test Token Expiry
```bash
# Create token with expiryHours: 0.001 (about 3 seconds)
# Wait 5 seconds
# Try to validate token
GET /api/candidate/validate/<token>

# Should return "Token has expired"
```

### 5. Test Token Reuse
```bash
# Submit form once
POST /api/candidate/submit/<token>

# Try to submit again with same token
POST /api/candidate/submit/<token>

# Should return "Token has already been used"
```

---

## 📱 Mobile Responsiveness

The CandidateSubmissionPage is fully responsive:
- **Desktop**: Full-width form with side-by-side layout
- **Tablet**: Adjusted spacing and grid layout
- **Mobile**: Single-column layout, stack file uploads

---

## 🔧 Configuration

### Backend Configuration
File: `backend/server.js`
```javascript
// Ensure candidate routes are registered
const candidateRoutes = require('./routes/candidateRoutes');
app.use('/api/candidate', candidateRoutes);

// Ensure CandidateToken model is imported
const CandidateToken = require('./models/CandidateToken_SQL');
```

### Frontend Configuration
File: `frontend/src/App.js`
```javascript
// Public route (no authentication)
<Route path="/candidate/submit/:token" element={<CandidateSubmissionPage />} />
```

### Environment Variables
```env
# Backend
PORT=5000
DATABASE_URL=<postgres_connection_string>
IMAGEKIT_PUBLIC_KEY=<your_imagekit_public_key>
IMAGEKIT_PRIVATE_KEY=<your_imagekit_private_key>
IMAGEKIT_URL_ENDPOINT=<your_imagekit_url_endpoint>

# Frontend
REACT_APP_API_BASE_URL=http://192.168.1.16:5000
```

---

## 📁 File Structure

```
backend/
├── models/
│   └── CandidateToken_SQL.js          # Token model
├── controllers/
│   ├── candidateSubmissionController.js  # Candidate endpoints
│   └── vendorPortalController_SQL.js     # Assignment endpoint
├── routes/
│   ├── candidateRoutes.js              # Public routes
│   └── vendorPortalRoutes.js           # Vendor routes
└── utils/
    └── candidateTokenUtils.js          # Token utilities

frontend/
├── src/
│   ├── pages/
│   │   ├── CandidateSubmissionPage.js   # Public submission form
│   │   ├── Dashboard.js                 # Admin dashboard (updated)
│   │   └── VendorDashboard.js           # Vendor dashboard (updated)
│   ├── components/
│   │   ├── AssignToCandidateModal.js    # Assignment modal
│   │   ├── VendorCasesTable.js          # Cases table (updated)
│   │   └── RecordsTable.js              # Records table (updated)
│   └── App.js                            # Routes (updated)
```

---

## 🐛 Troubleshooting

### Issue: Token validation fails
**Solution:** 
- Check if token exists in database
- Verify token hasn't expired
- Ensure token hasn't been used

### Issue: File upload fails
**Solution:**
- Check file size (max 5MB)
- Verify ImageKit credentials
- Check network connection

### Issue: GPS not captured
**Solution:**
- Browser must have location permission
- HTTPS required for geolocation API
- Use localhost or deployed HTTPS site

### Issue: Link doesn't open
**Solution:**
- Check if frontend is running
- Verify token in URL is correct
- Check frontend route configuration

### Issue: Assignment button disabled
**Solution:**
- Case status must be vendor_assigned or assigned
- Can't assign submitted/approved/rejected cases

---

## ✅ Feature Checklist

### Backend
- [x] CandidateToken model created
- [x] Token generation utilities
- [x] Validate token endpoint
- [x] Submit verification endpoint
- [x] Assign to candidate endpoint
- [x] File upload handling (ImageKit)
- [x] Status update to candidate_assigned
- [x] Dashboard stats updated

### Frontend
- [x] CandidateSubmissionPage created
- [x] AssignToCandidateModal created
- [x] VendorCasesTable updated
- [x] Dashboard updated (tab & stats)
- [x] VendorDashboard updated
- [x] RecordsTable status updated
- [x] App.js route added
- [x] Mobile responsive design

### Security
- [x] Secure token generation
- [x] Token expiry
- [x] One-time use enforcement
- [x] Email validation
- [x] Mobile validation
- [x] IP address tracking

### UX
- [x] GPS auto-capture
- [x] File preview
- [x] Upload progress
- [x] Success confirmation
- [x] Error handling
- [x] Loading states
- [x] Copy to clipboard

---

## 🎉 Completion Status

**Feature Status:** ✅ **COMPLETE**

All components implemented, tested, and integrated. The candidate self-submission feature is ready for production use.

---

## 📞 Next Steps

1. **Test in Production Environment**
   - Deploy backend and frontend
   - Test with real candidates
   - Verify email/SMS notifications

2. **Optional Enhancements**
   - Email/SMS integration for automatic notifications
   - WhatsApp link sharing
   - QR code generation for easy sharing
   - Multi-language support
   - Signature pad integration

3. **Documentation**
   - User manual for vendors
   - User manual for candidates
   - Video tutorial

---

## 📝 Notes

- Token length: 64 characters (cryptographically secure)
- Default expiry: 48 hours (configurable)
- Max file size: 5MB per file
- Supported file types: JPG, PNG, PDF
- GPS accuracy: Device-dependent
- Browser compatibility: Modern browsers (Chrome, Firefox, Safari, Edge)

---

**Created:** 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
