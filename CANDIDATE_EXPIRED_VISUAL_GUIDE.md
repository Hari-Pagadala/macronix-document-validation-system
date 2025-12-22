# Candidate Expired Feature - Visual Guide

## Dashboard View

### Navigation Tabs
The Dashboard now includes 11 tabs in the following order:
```
┌────────────────────────────────────────────────────────────────┐
│ All | Pending | Vendor Assigned | Candidate Assigned |        │
│ Candidate Expired | Assigned | Submitted | Approved |         │
│ Insufficient | Rejected | Stopped                             │
└────────────────────────────────────────────────────────────────┘
```

### Stats Cards Layout
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   Total: 28     │   Pending: 4    │ Vendor Asgn: 3  │ Candidate: 1    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  🔴 Expired: 2  │  Assigned: 5    │  Submitted: 0   │  Approved: 15   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

┌─────────────────┬─────────────────┬─────────────────┐
│ Insufficient: 0 │  Rejected: 0    │  Stopped: 0     │
└─────────────────┴─────────────────┴─────────────────┘
```

**New Card:** "Candidate Expired" displays count in red (error.main color)

## Candidate Expired Tab

### What Records Appear Here?
- Records with status: `candidate_assigned`
- Token `expiresAt` date/time is in the past
- Token `isUsed` = false (not yet submitted)

### Records Table Columns
```
┌──────────────┬───────────────┬──────────────┬─────────┬──────────┬────────────┬─────────┐
│ Case Number  │  Reference    │  Full Name   │ Contact │  Status  │ Candidate  │ Actions │
├──────────────┼───────────────┼──────────────┼─────────┼──────────┼────────────┼─────────┤
│ REC-2025-015 │ REF-2025-015  │  John Doe    │ 9876... │ 🟡 CAND. │ John Doe   │   ⋮     │
│              │               │              │         │ ASSIGNED │ john@e...  │         │
└──────────────┴───────────────┴──────────────┴─────────┴──────────┴────────────┴─────────┘
```

**Note:** Status chip shows "CANDIDATE ASSIGNED" (yellow) but internally filtered by expired token.

## Action Menu (⋮)

### Menu Options
```
┌─────────────────────────────────┐
│ 👁  View Details                │
├─────────────────────────────────┤
│ ✏  Edit / Assign                │
├─────────────────────────────────┤
│ 👤  Assign to Candidate (❌)    │  ← Disabled (not pending)
├─────────────────────────────────┤
│ 👤  Resend Link (✅)            │  ← ENABLED for expired
└─────────────────────────────────┘
```

### When "Resend Link" is Enabled
- Record must have `candidateTokenExpired: true`
- Shows for all records in "Candidate Expired" tab
- Also shows in "Candidate Assigned" tab if token expired

## Resend Link Workflow

### Step 1: Click Resend Link
```
User clicks "Resend Link" in action menu
     ↓
Alert dialog appears with message
```

### Step 2: Alert Message
```
┌──────────────────────────────────────────────────────────────┐
│  New link generated and sent to John Doe                     │
│                                                               │
│  Link: http://localhost:3000/candidate/submit?token=abc123...│
│                                                               │
│  Expires at: 12/23/2025, 5:00:00 PM                          │
│                                                               │
│                        [ OK ]                                 │
└──────────────────────────────────────────────────────────────┘
```

### Step 3: Backend Actions
1. ✅ Old token marked as `isUsed: true`
2. ✅ New token generated (64 char random string)
3. ✅ New token saved with fresh `expiresAt` (48 hours from now)
4. ✅ Email sent to candidate with new link
5. ✅ SMS sent to candidate with new link

### Step 4: Record Disappears
```
After successful resend, record:
- Still has status: candidate_assigned
- Has new active token (not expired)
- Disappears from "Candidate Expired" tab
- Appears in "Candidate Assigned" tab
```

## Status Badge Colors

```
┌──────────────────┬──────────┬─────────────────────────────┐
│ Status           │  Color   │  When It Appears            │
├──────────────────┼──────────┼─────────────────────────────┤
│ PENDING          │  🟡 Yellow │ Newly uploaded cases       │
│ VENDOR ASSIGNED  │  🔵 Blue   │ Assigned to vendor         │
│ CANDIDATE ASGN.  │  🟣 Purple │ Active candidate token     │
│ CANDIDATE EXPIRED│  🔴 Red    │ Expired candidate token    │
│ ASSIGNED         │  🔵 Blue   │ Assigned to field officer  │
│ SUBMITTED        │  🟣 Purple │ FO submitted verification  │
│ APPROVED         │  🟢 Green  │ Admin approved             │
│ INSUFFICIENT     │  🟡 Yellow │ More info needed           │
│ REJECTED         │  🔴 Red    │ Admin rejected             │
│ STOPPED          │  🔴 Red    │ Case stopped by admin      │
└──────────────────┴──────────┴─────────────────────────────┘
```

## View Details Modal

### Candidate Link Section (if status = candidate_assigned)
```
┌───────────────────────────────────────────────────────────┐
│  Candidate Submission Link                                │
│  ───────────────────────────────────────────────────────  │
│                                                            │
│  http://localhost:3000/candidate/submit?token=abc123...   │
│                                                            │
│  [ 📋 Copy Link ]                                          │
│                                                            │
│  ⚠️ If expired, use "Resend Link" from actions menu       │
└───────────────────────────────────────────────────────────┘
```

**Background:** Light yellow (#fff9c4) to indicate important info

## Candidate Submission Page

### Valid Link (Not Expired)
```
┌────────────────────────────────────────────────────────────┐
│            Candidate Submission Form                        │
│                                                             │
│  Case Number: REC-2025-00015 (disabled)                    │
│  Reference: REF-2025-00015 (disabled)                      │
│  Full Name: John Doe (disabled)                            │
│  Mobile: 9876543210 (disabled)                             │
│                                                             │
│  Address: 123 Main St (disabled)                           │
│  City: Mumbai (disabled)                                   │
│  State: Maharashtra (disabled)                             │
│  Pincode: 400001 (disabled)                                │
│                                                             │
│  Landmark: [_______________] *                             │
│  Verification Notes: [_______________] *                   │
│  Ownership Type: [Select ▼] *                             │
│                                                             │
│  Upload Files: (all required *)                            │
│  - Selfie                                                  │
│  - Candidate-Respondent Photo                              │
│  - Supporting Documents                                    │
│  - Property/Location Photos                                │
│  - Signatures                                              │
│                                                             │
│              [ Submit Verification ]                        │
└────────────────────────────────────────────────────────────┘
```

### Expired Link
```
┌────────────────────────────────────────────────────────────┐
│              ⚠️ Link Expired                                │
│                                                             │
│  This submission link has expired.                         │
│  Please contact the administrator for a new link.          │
│                                                             │
│              [ Back to Home ]                               │
└────────────────────────────────────────────────────────────┘
```

## Email/SMS Notification Format

### Email Template
```
Subject: Macronix Verification - Submission Required

Dear John Doe,

You have been assigned a verification case for your review and submission.

Case Details:
- Case Number: REC-2025-00015
- Reference: REF-2025-00015

Please click the link below to access the submission form:
http://localhost:3000/candidate/submit?token=abc123...

⏰ This link will expire on: December 23, 2025, 5:00 PM

Important:
- Complete all required fields
- Upload all necessary documents
- Submit before the expiry time

Thank you,
Macronix Verification System
```

### SMS Template
```
Macronix: Case REC-2025-00015 assigned to you.
Submit before 23-Dec-2025 5PM.
Link: http://localhost:3000/candidate/submit?token=...
```

## System Flow Diagram

```
┌─────────────────┐
│  Case Created   │
│  Status: Pending│
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Admin: Assign to Candidate         │
│  - Generate Token (48h expiry)      │
│  - Send Email + SMS                 │
│  - Status → candidate_assigned      │
└────────┬────────────────────────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ↓                                  ↓
┌─────────────────────┐         ┌──────────────────────┐
│  Candidate Submits  │         │  Token Expires       │
│  Within 48 Hours    │         │  Without Submission  │
└────────┬────────────┘         └──────────┬───────────┘
         │                                  │
         ↓                                  ↓
┌─────────────────────┐         ┌──────────────────────┐
│  Status: Submitted  │         │  Appears in:         │
│  Moves to Submitted │         │  Candidate Expired   │
│  Tab                │         │  Tab                 │
└─────────────────────┘         └──────────┬───────────┘
                                           │
                                           ↓
                                ┌──────────────────────┐
                                │  Admin: Resend Link  │
                                │  - Old token → used  │
                                │  - New token created │
                                │  - New email/SMS     │
                                └──────────┬───────────┘
                                           │
                                           ↓
                                ┌──────────────────────┐
                                │  Back to:            │
                                │  Candidate Assigned  │
                                │  Tab (with new link) │
                                └──────────────────────┘
```

## Keyboard Shortcuts (Future Enhancement)

```
Alt + 1  →  All Tab
Alt + 2  →  Pending Tab
Alt + 3  →  Vendor Assigned Tab
Alt + 4  →  Candidate Assigned Tab
Alt + 5  →  Candidate Expired Tab  ← NEW
Alt + 6  →  Assigned Tab
Alt + 7  →  Submitted Tab
...
```

## Mobile Responsive View

### On Tablets (768px - 1024px)
```
Stats Cards: 2-3 per row
Tabs: Scrollable horizontally
Table: All columns visible, horizontal scroll if needed
```

### On Mobile (< 768px)
```
Stats Cards: 2 per row, stacked vertically
Tabs: Scrollable with indicators
Table: 
  - Case Number
  - Full Name
  - Status
  - Actions (⋮)
Other columns hidden or shown on tap
```

## Common User Scenarios

### Scenario 1: Candidate Forgot to Submit
```
1. Admin sees record in "Candidate Expired" tab
2. Admin clicks ⋮ → Resend Link
3. Candidate receives new email/SMS
4. Candidate clicks new link
5. Candidate completes and submits form
6. Record moves to "Submitted" tab
```

### Scenario 2: Wrong Email/Mobile Number
```
1. Admin sees record in "Candidate Expired" tab
2. Admin clicks ⋮ → Edit / Assign
3. Admin updates contact info
4. Admin clicks ⋮ → Resend Link
5. Candidate receives notification at correct address
```

### Scenario 3: Bulk Expired Cases
```
1. Admin navigates to "Candidate Expired" tab
2. Sees 5 expired cases
3. Admin reviews each case
4. For valid cases → Resend Link
5. For invalid cases → Stop or Reassign to Vendor
```

## Pro Tips

### For Admins:
1. **Check Daily:** Review "Candidate Expired" tab every morning
2. **Set Reminders:** Note expiry times when assigning to candidates
3. **Verify Contact:** Double-check email/mobile before assigning
4. **Copy Link:** Use "Copy Link" button to share via other channels
5. **Track Attempts:** Keep notes on how many times link was resent

### For Candidates:
1. **Check Spam:** Look in spam/junk folder for email
2. **Save Link:** Bookmark the submission link immediately
3. **Don't Delay:** Start filling form as soon as you receive link
4. **Gather Documents:** Prepare all files before starting
5. **Complete in One Go:** Session may timeout if left incomplete

## Troubleshooting

### "Resend Link" Button Disabled
- ✅ Check if token is actually expired
- ✅ Refresh the page
- ✅ Verify you're on correct record

### New Link Also Expired Immediately
- ❌ System clock incorrect
- ✅ Check server time zone settings
- ✅ Contact system administrator

### Candidate Not Receiving Notifications
- ✅ Verify email/mobile in record details
- ✅ Check spam/junk folders
- ✅ Test email/SMS service configuration
- ✅ Copy link manually and send via WhatsApp

### Record Not Appearing in Expired Tab
- ✅ Token may not be expired yet
- ✅ Check "Candidate Assigned" tab instead
- ✅ Status may have changed (check "All" tab)
- ✅ Refresh the page

---

**Last Updated:** December 21, 2025
**Version:** 1.0
