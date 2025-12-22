# Candidate Expired Feature - Quick Start Guide

## 🚀 Quick Overview

**What is this?** A new tab and feature to handle cases where candidates don't submit their verification within the timeframe.

**Who uses it?** Super Admin only

**Main benefit:** Easily identify expired candidate assignments and resend links with one click.

---

## ⚡ Quick Access

### From Dashboard:
```
Dashboard → Click "Candidate Expired" tab (4th tab)
```

### From Stats Cards:
```
Look for the red "Candidate Expired: X" card
```

---

## 📋 3-Step Usage

### Step 1: Find Expired Cases
1. Open Admin Dashboard
2. Click **"Candidate Expired"** tab
3. See all cases where candidates didn't submit in time

### Step 2: Resend Link
1. Click the **⋮** (three dots) on any expired record
2. Select **"Resend Link"**
3. Done! Candidate gets new email + SMS

### Step 3: Verify
- Check the alert message for new link and expiry
- Record automatically moves back to "Candidate Assigned" tab
- Stats update immediately

---

## 🎯 When to Use

### ✅ Use "Resend Link" when:
- Candidate forgot to submit
- Email was lost/not received
- Candidate needs more time
- Technical issues prevented submission

### ❌ Don't use "Resend Link" when:
- Candidate is unreachable (use "Stop" instead)
- Wrong candidate assigned (use "Edit" to reassign)
- Case should be cancelled (use "Stop")

---

## 📊 What You'll See

### Candidate Expired Tab
```
┌────────────┬─────────────┬────────────┬─────────────┬─────────┐
│ Case #     │ Reference   │ Name       │ Candidate   │ Actions │
├────────────┼─────────────┼────────────┼─────────────┼─────────┤
│ REC-00015  │ REF-00015   │ John Doe   │ John Doe    │   ⋮     │
│            │             │            │ john@e...   │         │
└────────────┴─────────────┴────────────┴─────────────┴─────────┘
```

### After Clicking "Resend Link"
```
┌─────────────────────────────────────────────────────────┐
│ ✅ New link generated and sent to John Doe              │
│                                                          │
│ Link: http://localhost:3000/candidate/submit?token=... │
│                                                          │
│ Expires at: 12/23/2025, 5:00:00 PM                     │
│                                                          │
│                    [ OK ]                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🔔 What Candidate Receives

### Email
```
Subject: Macronix Verification - Submission Required

Dear John Doe,

You have been assigned a verification case.

Case Number: REC-2025-00015
Reference: REF-2025-00015

Click here to submit:
http://localhost:3000/candidate/submit?token=...

Expires: December 23, 2025, 5:00 PM

Please complete before expiry time.
```

### SMS
```
Macronix: Case REC-2025-00015 assigned.
Submit by 23-Dec 5PM.
Link: http://localhost:3000/...
```

---

## 💡 Pro Tips

### Tip 1: Check Daily
Review the "Candidate Expired" tab every morning to stay on top of pending cases.

### Tip 2: Copy Link Manually
If notification fails, copy the link from the alert and send via WhatsApp or other channel.

### Tip 3: Verify Contact Info
Before resending, click "Edit" to ensure email and mobile number are correct.

### Tip 4: Track Attempts
Keep notes on how many times you've resent the link to the same candidate.

### Tip 5: Set Deadline Reminders
When assigning to candidates, note the expiry time and set a reminder to follow up.

---

## ⚙️ Settings

### Link Expiry Duration
- **Default:** 48 hours (2 days)
- **Where:** Automatically set when resending
- **Future:** Will be configurable in UI

### Notification Channels
- **Email:** ✅ Enabled by default
- **SMS:** ✅ Enabled by default
- **WhatsApp:** ❌ Coming soon

---

## 🐛 Troubleshooting

### Q: "Resend Link" button is disabled (greyed out)
**A:** This means the token hasn't expired yet. The button only enables for expired tokens.

### Q: Candidate says they didn't receive email/SMS
**A:** 
1. Click "View Details" to verify email/mobile number
2. If wrong, click "Edit" to update
3. Try "Resend Link" again
4. As backup, copy link from alert and send via WhatsApp

### Q: Record not showing in "Candidate Expired" tab
**A:**
1. Check if token is actually expired (may still be active)
2. Look in "Candidate Assigned" tab instead
3. Refresh the page
4. Check "All" tab to verify status

### Q: Stats card shows wrong count
**A:**
1. Refresh the page
2. Clear browser cache (Ctrl + Shift + R)
3. Contact system administrator if issue persists

### Q: New link also expires immediately
**A:** System time/timezone issue. Contact system administrator.

---

## 📱 Mobile View

On mobile devices:
- Scroll tabs horizontally to reach "Candidate Expired"
- Table shows fewer columns for better fit
- All actions available via ⋮ menu

---

## 🔒 Permissions

### Who Can Access:
- ✅ Super Admin

### Who Cannot Access:
- ❌ Vendor Users
- ❌ Field Officers
- ❌ View-only Admins (if implemented)

---

## 🎓 Tutorial: First Time Use

### Scenario: Candidate Didn't Submit

**Step 1: Login as Super Admin**
```
Email: admin@example.com
Password: your_password
```

**Step 2: Navigate to Dashboard**
```
Home → Dashboard (or already there after login)
```

**Step 3: Check Stats**
```
Look at "Candidate Expired: X" card
Note the number of expired cases
```

**Step 4: Open Expired Tab**
```
Click on "Candidate Expired" tab (4th from left)
```

**Step 5: Review Cases**
```
See list of all expired candidate assignments
Each row shows:
- Case number
- Candidate name
- Contact info
- Expiry details
```

**Step 6: Select Case**
```
Click ⋮ (three dots) on the right side of any row
Menu appears with options
```

**Step 7: Resend Link**
```
Click "Resend Link" in the menu
Alert box appears with confirmation
```

**Step 8: Verify**
```
- Note the new link in the alert
- Note the new expiry time (48 hours from now)
- Click "OK" to close alert
- Case disappears from Expired tab
```

**Step 9: Confirm with Candidate**
```
- Call candidate to confirm they received new email/SMS
- If not, copy link from alert history
- Send via WhatsApp or other channel
```

**Step 10: Monitor Submission**
```
- Check "Candidate Assigned" tab to see active cases
- Once submitted, case moves to "Submitted" tab
- Review and approve/reject as usual
```

---

## 📞 Support

### Need Help?
- **Documentation:** See `CANDIDATE_EXPIRED_FEATURE.md` for technical details
- **Visual Guide:** See `CANDIDATE_EXPIRED_VISUAL_GUIDE.md` for screenshots
- **System Admin:** Contact IT team for technical issues
- **Process Help:** Contact operations manager

### Report Issues
- Backend errors: Check server logs
- UI issues: Take screenshot and report
- Notification failures: Check email/SMS service status

---

## ✅ Checklist for Admins

Daily Tasks:
- [ ] Review "Candidate Expired" tab
- [ ] Resend links for valid expired cases
- [ ] Stop or reassign invalid cases
- [ ] Follow up with candidates who haven't responded

Weekly Tasks:
- [ ] Analyze expiry patterns (which cases expire most?)
- [ ] Review candidate response times
- [ ] Optimize expiry duration if needed
- [ ] Update contact info for unreachable candidates

Monthly Tasks:
- [ ] Generate report on expired cases
- [ ] Identify systemic issues (email deliverability, etc.)
- [ ] Review and update process as needed

---

## 🎉 Success Metrics

You'll know the feature is working when:
- ✅ Zero expired cases sitting idle for days
- ✅ Quick turnaround on resend (< 5 minutes)
- ✅ High submission rate after resend
- ✅ Clear visibility into pending candidate work
- ✅ Reduced manual tracking effort

---

## 🔄 Feature Updates

### Current Version: 1.0 (Dec 2025)
- Candidate Expired tab
- Resend Link action
- Stats card
- Email + SMS notifications

### Coming Soon:
- Configurable expiry duration
- Bulk resend action
- Auto-reminders before expiry
- Delivery status tracking
- Resend attempt counter

---

## 📝 Quick Reference

| Action | Location | Shortcut |
|--------|----------|----------|
| View Expired Cases | Dashboard → Candidate Expired tab | Alt+5 (future) |
| Resend Link | ⋮ menu → Resend Link | - |
| Check Stats | Stats card (red) | - |
| Verify Contact | ⋮ menu → View Details | - |
| Update Contact | ⋮ menu → Edit / Assign | - |

---

**Last Updated:** December 21, 2025  
**Version:** 1.0  
**For:** Super Admin Users  
**Support:** IT Team / Operations Manager
