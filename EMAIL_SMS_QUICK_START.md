# Email & SMS Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd backend
npm install nodemailer twilio --save
```

### Step 2: Configure Email (Gmail Example)

1. **Get Gmail App Password:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Go to "App passwords"
   - Create password for "Mail"
   - Copy the 16-character password

2. **Add to backend/.env:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
EMAIL_FROM=Macronix Verification <noreply@macronix.com>
```

### Step 3: Configure SMS (Twilio - Optional)

1. **Sign up at https://www.twilio.com/**
2. **Get credentials from dashboard**
3. **Add to backend/.env:**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 4: Restart Backend

```bash
cd backend
node server.js
```

**Look for:**
```
✅ Email transporter initialized
✅ SMS client initialized
```

### Step 5: Test in Frontend

1. Login as admin/vendor
2. Open any case
3. Click "Assign to Candidate"
4. ✅ Check "Send Email"
5. ☐ Check "Send SMS" (if configured)
6. Click "Send Link"
7. ✅ Verify notification status

---

## ⚡ Quick Test (No Configuration Required)

**The system works WITHOUT any configuration!**

1. Skip Steps 2 & 3 (no .env setup needed)
2. Restart backend
3. Assign case to candidate
4. System will:
   - Generate link ✅
   - Mark notifications as "NOT_SENT" ⚠️
   - Show link for manual sharing 📋

**Use Case:** Copy link and share via WhatsApp manually

---

## 📋 Default Behavior

| Configuration | Email Status | SMS Status | What Happens |
|--------------|-------------|-----------|--------------|
| None | NOT_SENT | NOT_SENT | Link generated, manual sharing |
| Email only | SENT/FAILED | NOT_SENT | Email sent, SMS skipped |
| SMS only | NOT_SENT | SENT/FAILED | Email skipped, SMS sent |
| Both | SENT/FAILED | SENT/FAILED | Both attempted |

---

## 🎯 Usage Examples

### Example 1: Email Only (Default)
```
✅ Send Email ← checked
☐ Send SMS ← unchecked
```
→ Email sent to candidate@example.com

### Example 2: SMS Only
```
☐ Send Email ← unchecked
✅ Send SMS ← checked
```
→ SMS sent to +91 9876543210

### Example 3: Both Channels
```
✅ Send Email ← checked
✅ Send SMS ← checked
```
→ Both sent (independent of each other)

---

## 🐛 Troubleshooting

### Email Not Sending?

**Check 1:** Environment variables set correctly?
```bash
echo $SMTP_USER
echo $SMTP_PASS
```

**Check 2:** Using App Password (not account password)?
- Gmail requires App Passwords

**Check 3:** Backend logs?
```
❌ [Email] Failed to send: Invalid login
```

**Fix:** Re-generate App Password and update `.env`

---

### SMS Not Sending?

**Check 1:** Twilio credentials correct?
```bash
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
```

**Check 2:** Trial account? Verify recipient number first
- Trial: Only sends to verified numbers
- Production: Sends to any number

**Fix:** Upgrade to paid Twilio account OR verify recipient

---

## 📞 Need Help?

1. **Read full guide:** `EMAIL_SMS_CONFIGURATION_GUIDE.md`
2. **Check logs:** Backend terminal output
3. **Test without config:** Skip configuration and share links manually
4. **Check database:** `candidate_tokens` table for delivery status

---

## ✅ Success Checklist

- [ ] Dependencies installed (`nodemailer`, `twilio`)
- [ ] `.env` file created in `backend` folder
- [ ] SMTP variables added (for email)
- [ ] Twilio variables added (for SMS) - optional
- [ ] Backend restarted
- [ ] Initialization messages show ✅ or ⚠️
- [ ] Test assignment from frontend
- [ ] Check notification status in UI
- [ ] Verify email/SMS received

---

**Time Required:** 5-10 minutes  
**Difficulty:** Easy  
**Prerequisites:** Gmail account OR Twilio account (optional)

---

**Pro Tip:** Start with email only (easier setup), add SMS later if needed!
