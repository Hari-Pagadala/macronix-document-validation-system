# Candidate Expired Feature - Implementation Summary

## Overview
This feature handles cases where candidates fail to submit their verification within the token expiration timeframe. It provides a dedicated tab for tracking these expired assignments and allows super admins to resend/regenerate new submission links.

## Problem Statement
Previously, when a candidate was assigned a case and failed to submit within the timeframe:
- Cases stayed in `candidate_assigned` status indefinitely
- No easy way to identify expired assignments
- No mechanism to resend links without manual reassignment

## Solution Implemented

### 1. New Tab: "Candidate Expired"
- Added to the Dashboard after the "Candidate Assigned" tab
- Displays only candidate_assigned records with expired tokens
- Status filter: `candidate_expired` (virtual status, records remain as `candidate_assigned` in DB)

### 2. Backend Changes

#### `recordController_SQL.js`
**Modified `getAllRecords` function:**
```javascript
// When status === 'candidate_expired', query candidate_assigned records
// Check each record's token expiration and add candidateTokenExpired flag
// Filter to only return records with expired tokens
```

**New endpoint: `resendCandidateLink`**
- Route: `POST /api/records/:id/resend-candidate-link`
- Marks old tokens as used
- Generates new token with fresh expiry (default 48 hours)
- Sends notifications to candidate (email + SMS)
- Returns new submission link

**Key Fields Added to Record Model:**
- `candidateName` - Stores candidate name for resend
- `candidateEmail` - Stores candidate email for resend
- `candidateMobile` - Stores candidate mobile for resend

#### `recordRoutes.js`
```javascript
router.post('/:id/resend-candidate-link', recordController.resendCandidateLink);
```

### 3. Frontend Changes

#### `Dashboard.js`
**Updated `tabStatusMap`:**
```javascript
['all', 'pending', 'vendor_assigned', 'candidate_assigned', 'candidate_expired', 'assigned', ...]
```

**Added Tab:**
```jsx
<Tab label="Candidate Expired" />
```

#### `RecordsTable.js`
**Updated `statusConfig`:**
```javascript
candidate_expired: { color: 'error', icon: <WarningIcon />, label: 'CANDIDATE EXPIRED' }
```

**New Action: "Resend Link"**
```javascript
// Menu item appears for records with candidateTokenExpired === true
// Calls POST /api/records/:id/resend-candidate-link
// Shows alert with new link and expiry details
```

**candidateTokenExpired Flag:**
- Backend adds this flag to each candidate_assigned record
- Checks if token exists and expiresAt < current time
- Used to enable/disable "Resend Link" action

## User Workflow

### For Super Admin:

1. **Identifying Expired Assignments:**
   - Navigate to "Candidate Expired" tab in Dashboard
   - View all cases where candidates didn't submit in time
   - Each record shows full case details

2. **Resending Link:**
   - Click the action menu (⋮) on expired record
   - Select "Resend Link" option
   - New token is generated automatically
   - Candidate receives new email/SMS with fresh link
   - Alert displays new submission URL and expiry time

3. **Monitoring:**
   - Stats card shows count of expired assignments
   - Records automatically appear/disappear from tab as tokens expire/get used

### For Candidate:

1. Receives new email/SMS with fresh submission link
2. Link valid for 48 hours (default)
3. Can submit verification within new timeframe
4. Previous expired link becomes invalid (marked as used)

## Technical Details

### Token Expiry Logic
```javascript
// In getAllRecords for each candidate_assigned record:
const token = await CandidateToken.findOne({
    where: { recordId: record.id, isUsed: false },
    order: [['createdAt', 'DESC']]
});
recordData.candidateTokenExpired = token && new Date() > new Date(token.expiresAt);
```

### Resend Process
1. Validate record status is `candidate_assigned`
2. Verify candidate info exists in record (name, email, mobile)
3. Mark all old tokens for this record as `isUsed: true`
4. Create new token via `createCandidateToken()` utility
5. Send notification via `sendCandidateNotification()` utility
6. Return new link to admin

### Database Schema
- **records** table: Already has candidateName, candidateEmail, candidateMobile fields
- **candidate_tokens** table: token, recordId, expiresAt, isUsed, candidate details
- No new tables required

## API Reference

### Get Records with Expired Filter
```http
GET /api/records?status=candidate_expired&page=1&limit=10
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "records": [
    {
      "id": "uuid",
      "caseNumber": "REC-2025-00001",
      "status": "candidate_assigned",
      "candidateTokenExpired": true,
      "candidateName": "John Doe",
      "candidateEmail": "john@example.com",
      "candidateMobile": "9876543210",
      ...
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Resend Candidate Link
```http
POST /api/records/{recordId}/resend-candidate-link
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "expiryHours": 48
}
```

**Response:**
```json
{
  "success": true,
  "message": "New candidate link generated and sent successfully",
  "submissionLink": "http://localhost:3000/candidate/submit?token=...",
  "expiresAt": "2025-12-23T17:00:00.000Z",
  "candidateInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210"
  }
}
```

## Testing Checklist

- [ ] Navigate to "Candidate Expired" tab
- [ ] Verify only expired candidate assignments appear
- [ ] Click "Resend Link" on expired record
- [ ] Verify new token is generated
- [ ] Verify notification is sent to candidate
- [ ] Verify old token is marked as used
- [ ] Test new link in browser
- [ ] Verify submission works with new link
- [ ] Verify record moves to appropriate status after submission

## Configuration

### Token Expiry Duration
- Default: 48 hours
- Configurable via `expiryHours` parameter in assign/resend requests
- Can be modified in UI when resending (future enhancement)

### Notification Settings
- Email: Configured via email service in backend
- SMS: Configured via SMS gateway in backend
- Both use `sendCandidateNotification()` utility

## Benefits

1. **Visibility:** Clear separation of active vs expired candidate assignments
2. **Recovery:** Easy way to re-engage candidates without losing case data
3. **Automation:** Token expiry checking is automatic
4. **Audit Trail:** Old tokens marked as used, maintaining history
5. **User Experience:** Candidates get fresh links without admin manual work
6. **Efficiency:** Super admins can bulk identify and handle expired cases

## Future Enhancements

1. **Configurable Expiry:** UI field to set custom expiry hours when resending
2. **Auto-reminder:** Send reminder before token expires (e.g., 6 hours before)
3. **Stats Dashboard:** Card showing count of expired assignments
4. **Batch Resend:** Select multiple expired records and resend all at once
5. **Expiry History:** Show how many times link was resent for a case
6. **Status Change:** Option to change status to 'pending' if candidate unreachable

## Related Files

### Backend:
- `backend/controllers/recordController_SQL.js` - Main logic
- `backend/routes/recordRoutes.js` - Route definition
- `backend/models/Record_SQL.js` - Record model with candidate fields
- `backend/models/CandidateToken_SQL.js` - Token model

### Frontend:
- `frontend/src/pages/Dashboard.js` - Tab navigation
- `frontend/src/components/RecordsTable.js` - Records display & actions
- `frontend/src/config.js` - API base URL configuration

## Notes

- Records stay in `candidate_assigned` status in database
- `candidate_expired` is a virtual status for filtering
- Token expiry is checked in real-time during API calls
- No background job needed for marking expired tokens
- Original candidate info preserved for resending

---

**Last Updated:** December 21, 2025
**Feature Status:** ✅ Implemented and Ready for Testing
