# Candidate Self-Submission - Quick Start Guide

## 🚀 5-Minute Setup

### What You Need
- Backend running on `http://192.168.1.16:5000`
- Frontend running on `http://localhost:3000`
- Vendor account credentials

---

## 📋 For Vendors - How to Assign a Case

### Step 1: Login
```
1. Go to: http://localhost:3000/vendor/login
2. Enter your vendor credentials
3. Click "Login"
```

### Step 2: Find the Case
```
1. Navigate to "Dashboard" or "Cases" tab
2. Search for the case using Case # or Reference #
3. Click the three-dot menu (⋮) on the case row
```

### Step 3: Assign to Candidate
```
1. Select "Assign to Candidate" from menu
2. Fill in the form:
   - Candidate Name: John Doe
   - Email: john@example.com
   - Mobile: 9876543210
   - Expiry: 48 hours (default)
3. Click "Generate Link"
```

### Step 4: Share the Link
```
1. Click "Copy Link" button
2. Share via:
   - Email
   - SMS
   - WhatsApp
   - Any messaging app
```

**Example Link:**
```
http://localhost:3000/candidate/submit/a1b2c3d4e5f6...
```

---

## 📱 For Candidates - How to Submit

### Step 1: Open the Link
```
1. Click the link received from vendor
2. Browser opens automatically
3. No login required!
```

### Step 2: Verify Token
```
- Form loads automatically
- Candidate info pre-filled
- GPS location auto-captured
```

### Step 3: Fill Details
```
Address:
✓ Pre-filled from case data
✓ Can edit if needed

Ownership:
○ Owner
○ Tenant

GPS:
✓ Auto-captured
✓ Can edit manually
```

### Step 4: Upload Files

**Required:**
- ✅ Field Officer Selfie
- ✅ Candidate Photo  
- ✅ Candidate Signature

**Optional:**
- 📄 Documents (multiple)
- 📷 Additional Photos (multiple)
- ✍️ Witness Signature

### Step 5: Submit
```
1. Review all information
2. Click "Submit Verification"
3. Wait for success message
4. Done! ✅
```

---

## 🎯 Common Use Cases

### Scenario 1: Remote Verification
```
Candidate is far away
↓
Vendor assigns case to candidate
↓
Candidate submits from anywhere
↓
No field visit needed!
```

### Scenario 2: Self-Service
```
Customer prefers self-submission
↓
Vendor sends link immediately
↓
Customer completes at convenience
↓
Faster turnaround time
```

### Scenario 3: Field Officer Unavailable
```
FO busy with other cases
↓
Assign to candidate instead
↓
Candidate submits directly
↓
FO reviews later
```

---

## 🔍 How to Track Submissions

### Admin Dashboard
```
1. Login to admin dashboard
2. Go to "Candidate Assigned" tab
3. View all cases assigned to candidates
4. Monitor submission status
```

### Vendor Dashboard
```
1. Login to vendor dashboard
2. Go to "Candidate Assigned" tab
3. See your assigned cases
4. Track completion
```

---

## ✅ Status Flow

```
📝 vendor_assigned
    ↓
👤 candidate_assigned (link sent)
    ↓
📤 submitted (candidate completed)
    ↓
✅ approved (admin verified)
```

---

## 🐛 Troubleshooting

### Problem: Link doesn't work
**Solution:**
- Check if link is complete (very long URL)
- Make sure frontend is running
- Try copying link again

### Problem: GPS not working
**Solution:**
- Allow location permission in browser
- Use Chrome or Safari (better support)
- Enter GPS manually if needed

### Problem: File upload fails
**Solution:**
- Check file size (max 5MB)
- Use JPG/PNG format
- Try one file at a time

### Problem: Token expired
**Solution:**
- Contact vendor for new link
- Default expiry is 48 hours
- Can't extend expired tokens

---

## 📞 API Quick Reference

### Vendor Assigns Case
```javascript
POST /api/vendor-portal/cases/:id/assign-to-candidate
Authorization: Bearer <vendor_token>

{
  "candidateName": "John Doe",
  "candidateEmail": "john@example.com",
  "candidateMobile": "9876543210",
  "expiryHours": 48
}
```

### Validate Token
```javascript
GET /api/candidate/validate/:token

// Returns candidate info and case details
```

### Submit Verification
```javascript
POST /api/candidate/submit/:token
Content-Type: multipart/form-data

// Include all files and form fields
```

---

## 🎨 UI Screenshots

### Vendor - Assignment Modal
```
┌─────────────────────────────────┐
│ Assign Case to Candidate        │
├─────────────────────────────────┤
│ Candidate Name: [John Doe    ]  │
│ Email: [john@example.com     ]  │
│ Mobile: [9876543210          ]  │
│ Expiry (hours): [48          ]  │
│                                 │
│ [Cancel]    [Generate Link]    │
└─────────────────────────────────┘
```

### Candidate - Submission Form
```
┌─────────────────────────────────┐
│ Submit Verification             │
├─────────────────────────────────┤
│ Name: John Doe                  │
│ Case: CASE001                   │
│                                 │
│ Address: [                   ]  │
│ Ownership: ○ Owner ○ Tenant     │
│ GPS: [Auto-captured         ]   │
│                                 │
│ Upload Files:                   │
│ [📷 Field Officer Selfie]      │
│ [📷 Candidate Photo]           │
│ [✍️ Candidate Signature]       │
│                                 │
│ [Submit Verification]           │
└─────────────────────────────────┘
```

---

## 🔒 Security Notes

### Token Security
- ✅ Cryptographically secure random tokens
- ✅ 64 characters long
- ✅ One-time use only
- ✅ Expires after 48 hours (configurable)
- ✅ IP address logged

### Data Security
- ✅ Files uploaded to ImageKit (secure CDN)
- ✅ HTTPS recommended for production
- ✅ No sensitive data in URL
- ✅ Token validated before submission

---

## 💡 Pro Tips

1. **Batch Assignment**: Assign multiple cases in succession
2. **Default Expiry**: Keep 48 hours for most cases
3. **Mobile Friendly**: Works on all devices
4. **Copy Link**: Use copy button to avoid errors
5. **Test First**: Try with test case before real use

---

## 📊 Expected Behavior

### ✅ Success Flow
```
1. Vendor generates link → Success message + link
2. Candidate opens link → Form loads with info
3. GPS auto-capture → Coordinates filled
4. Upload files → Progress shown
5. Submit form → Success confirmation
6. Status updates → vendor_assigned → candidate_assigned → submitted
```

### ❌ Error Flows
```
- Invalid token → Error page
- Expired token → "Token expired" message
- Used token → "Already used" message
- Missing files → Validation errors
- Network error → Retry option
```

---

## 📦 What's Included

### Backend
- ✅ Token generation
- ✅ Token validation
- ✅ File upload handling
- ✅ Status management
- ✅ API endpoints

### Frontend
- ✅ Assignment modal
- ✅ Submission form
- ✅ GPS capture
- ✅ File uploads
- ✅ Validation

### Dashboard
- ✅ Candidate Assigned tab
- ✅ Stats card
- ✅ Status badges
- ✅ Filtering

---

## 🎯 Success Metrics

### For Vendors
- Faster case assignments
- No field officer dependency
- Remote verification capability
- Better customer experience

### For Candidates
- No app installation
- Submit from anywhere
- Simple interface
- Quick process

### For Admins
- Complete audit trail
- Status tracking
- Dashboard visibility
- Automated workflow

---

## 📝 Checklist Before Using

- [ ] Backend server running (port 5000)
- [ ] Frontend app running (port 3000)
- [ ] Vendor account created
- [ ] Case data available
- [ ] ImageKit configured
- [ ] Mobile device for candidate testing

---

## 🎉 That's It!

The feature is ready to use. Start by logging in as a vendor and assigning your first case to a candidate!

**Need Help?** Check the complete documentation in `CANDIDATE_SELF_SUBMISSION_COMPLETE.md`

---

**Quick Links:**
- Backend API: `http://192.168.1.16:5000/api/candidate`
- Frontend: `http://localhost:3000`
- Vendor Login: `http://localhost:3000/vendor/login`
- Admin Login: `http://localhost:3000/login`
