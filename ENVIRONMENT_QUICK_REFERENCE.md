# Environment Configuration Quick Reference Card

## TL;DR - Just Want to Run the Server?

```bash
cd backend
npm start
```

That's it! `.env.local` is already created with development defaults. Server starts on `http://localhost:5000`.

---

## Environment Files at a Glance

| File | Purpose | Location | When to Use |
|------|---------|----------|------------|
| `.env.local` | Development | `backend/.env.local` | Local development & testing |
| `.env.production` | Production | `backend/.env.production` | When deploying to production |
| `.env.example` | Reference | `backend/.env.example` | Read only - for reference |

---

## Check Configuration Status

```bash
cd backend
npm run validate-env
```

Shows what's configured and what's missing.

---

## Start Server Normally

```bash
cd backend
npm start
```

Auto-loads `.env.local` in development mode.

---

## Start Server in Production

```bash
NODE_ENV=production npm start
```

Auto-loads `.env.production` instead.

---

## Common Commands

| Task | Command |
|------|---------|
| **Validate env setup** | `npm run validate-env` |
| **Start development** | `npm start` |
| **Start dev with auto-reload** | `npm run dev` |
| **Start production** | `NODE_ENV=production npm start` |
| **Check critical vars** | `grep "DB_HOST\|JWT_SECRET" backend/.env.local` |

---

## For Team Members

### First Time Setup
```bash
1. Clone repo
2. cd backend
3. Check .env.local exists (it does - already created)
4. Update with YOUR credentials if needed:
   - DB_USER, DB_PASSWORD (your database)
   - SMTP_USER, SMTP_PASS (your test email account)
   - FAST2SMS_API_KEY (your test SMS account)
5. npm start
```

### Starting Work Daily
```bash
cd backend
npm start
```

Your `.env.local` is in `.gitignore` - only you have it. No conflicts!

---

## Optional Services Status

### What's Working Without Any Extra Setup
- ✅ PostgreSQL database (assuming local instance)
- ✅ JWT authentication
- ✅ All core API endpoints

### What's Optional (Won't Break if Missing)
- ⚠️ Email notifications (needs Gmail credentials)
- ⚠️ SMS notifications (needs Fast2SMS credentials)
- ⚠️ Image upload (needs ImageKit credentials)
- ⚠️ Short URL redirects (needs service setup)

### Missing Optional Service Example
```
⚠️ Email (SMTP) - NOT CONFIGURED
  This is OK for local development!
```

---

## When Production Keys Arrive

### Update .env.production
```bash
# Edit backend/.env.production
# Find all: REPLACE_WITH_PROD_*
# Replace with ACTUAL values
```

Example:
```env
# Before (template)
DB_PASSWORD=REPLACE_WITH_PROD_DB_PASSWORD
SMTP_PASS=REPLACE_WITH_PROD_GMAIL_APP_PASSWORD

# After (with real values)
DB_PASSWORD=actualSecurePassword123!
SMTP_PASS=16charGmailAppPassword
```

### Deploy to Production
```bash
NODE_ENV=production npm start
```

Done! Server auto-loads `.env.production` with all your credentials.

---

## Environment Variables (Quick Reference)

### Critical (Must Have)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database
- `JWT_SECRET` - Token signing secret (32+ chars)

### Email (Optional - Has Fallback)
- `SMTP_HOST` - Usually: smtp.gmail.com
- `SMTP_PORT` - Usually: 587 (dev) or 465 (prod)
- `SMTP_USER` - Your Gmail address
- `SMTP_PASS` - Gmail app password (get from Google Account)

### SMS (Optional - Has Fallback)
- `FAST2SMS_API_KEY` - From Fast2SMS dashboard
- `FAST2SMS_SENDER_ID` - Your registered sender ID

### File Upload (Optional - Has Fallback)
- `IMAGEKIT_PUBLIC_KEY` - From ImageKit dashboard
- `IMAGEKIT_PRIVATE_KEY` - From ImageKit dashboard
- `IMAGEKIT_ENDPOINT` - From ImageKit dashboard

---

## Troubleshooting

### Server won't start - "Cannot find .env"
```bash
# Check file exists
ls -la backend/.env.local

# If missing, recreate from example
cp backend/.env.example backend/.env.local
```

### "Database connection failed"
```bash
# 1. Check PostgreSQL is running
psql -V

# 2. Check credentials in .env.local
grep "DB_" backend/.env.local

# 3. Try connecting manually
psql -h localhost -U postgres
```

### "JWT_SECRET is too short" warning
```bash
# Generate a new one
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update in .env.local
# Restart server
```

### Email not configured warning (this is OK!)
```bash
# If you want to enable email:
# 1. Get Gmail app password
# 2. Add to .env.local: SMTP_USER, SMTP_PASS
# 3. Restart server
```

---

## Git & Team Workflows

### My local .env.local won't affect others?
✅ Correct! It's in `.gitignore`. Everyone has their own.

### What if someone forgets to create .env.local?
- Server will warn them and try `.env.example`
- They'll see: "⚠️ Environment file not found"
- They copy `.env.example` → `.env.local`
- They update their credentials
- They're good to go

### What if someone accidentally commits .env.local?
- Can't happen! It's in `.gitignore`
- Git won't let them commit it

---

## File Structure

```
macronix-document-validation-system/
├── backend/
│   ├── .env.local              ← You are here (dev)
│   ├── .env.production         ← Use this for production
│   ├── .env.example            ← Reference only
│   ├── config/
│   │   ├── database.js         ← Uses process.env.DB_*
│   │   └── environmentConfig.js ← Smart loader (NEW)
│   ├── server.js               ← Updated to use loader
│   ├── validateEnvironment.js  ← Validation tool (NEW)
│   └── package.json            ← Has validate-env script
├── ENVIRONMENT_SETUP.md         ← Quick start (NEW)
└── ENVIRONMENT_IMPLEMENTATION_SUMMARY.md ← Full details (NEW)
```

---

## One Minute Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Check if everything is ready
npm run validate-env

# 3. Start server
npm start

# 4. See it running
curl http://localhost:5000/

# Done! API is live on port 5000
```

---

## Summary: What's Ready for You

✅ `.env.local` - Development environment (pre-configured)  
✅ `.env.production` - Production template (ready to fill)  
✅ Smart config loader - Auto-detects and loads environment  
✅ Validation tool - Check what's configured  
✅ Documentation - Complete guides included  
✅ Backward compatible - All existing code still works  

---

**Need full details?** See `ENVIRONMENT_CONFIG_GUIDE.md`  
**Just want to get started?** See `ENVIRONMENT_SETUP.md`  
**Ready for production?** Update `.env.production` with real credentials  

**Questions?** Check server logs - they're very descriptive!
