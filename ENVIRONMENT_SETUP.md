# Environment Configuration Setup

## Quick Start

### For Local Development

1. **Environment file is ready:**
   ```bash
   backend/.env.local  # Already created with development defaults
   ```

2. **Update with your credentials (optional for local testing):**
   - Edit `backend/.env.local`
   - Update email/SMS keys if you want to test those services
   - Database defaults (localhost:5432) should work if PostgreSQL is running locally

3. **Validate configuration:**
   ```bash
   cd backend
   npm run validate-env
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

### For Production Deployment

1. **Prepare production environment:**
   ```bash
   # The template is ready at:
   backend/.env.production
   ```

2. **Replace all placeholders:**
   ```env
   # In .env.production, replace these with REAL production values:
   DB_PASSWORD=REPLACE_WITH_PROD_DB_PASSWORD
   JWT_SECRET=REPLACE_WITH_PROD_JWT_SECRET_MIN_32_CHARS
   IMAGEKIT_PUBLIC_KEY=REPLACE_WITH_PROD_PUBLIC_KEY
   IMAGEKIT_PRIVATE_KEY=REPLACE_WITH_PROD_PRIVATE_KEY
   SMTP_PASS=REPLACE_WITH_PROD_GMAIL_APP_PASSWORD
   FAST2SMS_API_KEY=REPLACE_WITH_PROD_FAST2SMS_API_KEY
   SHORT_URL_API_KEY=REPLACE_WITH_PROD_SHORT_URL_API_KEY
   # ... and other REPLACE_WITH_PROD_* variables
   ```

3. **Deploy:**
   ```bash
   # Set environment to production
   export NODE_ENV=production
   
   # Start server
   npm start
   ```

## Environment Structure

### .env.local (Development)
- **Location:** `backend/.env.local`
- **Purpose:** Local development and testing
- **Status:** ✅ Created with sensible defaults
- **In .gitignore:** Yes - safe to use locally

### .env.production (Production)
- **Location:** `backend/.env.production`
- **Purpose:** Production deployment
- **Status:** Template with REPLACE_WITH_PROD_* placeholders
- **In .gitignore:** Yes - production credentials stay secure

## Services Configured

### 1. PostgreSQL Database
- **Local:** localhost:5432 (adjust if your setup differs)
- **Production:** Remote RDS/Cloud database
- **Config:** `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### 2. Email (Google SMTP)
- **Local:** Test email account
- **Production:** Company email account
- **Config:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- **Status:** Optional - system works without it, just logs warnings

### 3. SMS (Fast2SMS DLT)
- **Local:** Test Fast2SMS account
- **Production:** Production Fast2SMS account with DLT registration
- **Config:** `FAST2SMS_API_KEY`, `FAST2SMS_SENDER_ID`, `FAST2SMS_DLT_TEMPLATE_ID`
- **Status:** Optional - system works without it, just logs warnings

### 4. Image Upload (ImageKit)
- **Local:** Test ImageKit account
- **Production:** Production ImageKit account
- **Config:** `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_ENDPOINT`
- **Status:** Optional - system works without it, just logs warnings

### 5. Short URL Redirects
- **Local:** `http://localhost:5000` (for SMS links)
- **Production:** Your short URL domain
- **Config:** `SHORT_URL_BASE`, `SHORT_URL_API_KEY`
- **Status:** Optional - system works without it

## Loading Behavior

### Automatic Environment Detection

```
┌─ Start Server ─┐
       │
       ├─ Check NODE_ENV
       │
       ├─ NODE_ENV=production? → Load .env.production
       │
       ├─ NODE_ENV=development? → Load .env.local
       │
       └─ Not set? → Load .env.local (default)
```

### File Priority
1. `.env.local` (development - **you are here**)
2. `.env.production` (ready for when you go live)
3. `.env.example` (reference only - auto-fallback)

## Validating Your Configuration

### Quick Check
```bash
cd backend
npm run validate-env
```

This will show:
- ✅ Which services are configured
- ⚠️ Which optional services are missing (OK for local dev)
- ❌ What critical settings are missing (must fix before running)

### Server Startup Indicators

When you run `npm start`, look for:

```
✅ Email (SMTP) - Configured
✅ SMS (Fast2SMS) - Configured  
✅ Image Upload (ImageKit) - Configured
✅ PostgreSQL Connected Successfully!
✅ Database tables synchronized!
🚀 Server running on http://0.0.0.0:5000
```

Or if services aren't set up yet:

```
⚠️  Email (SMTP) - NOT CONFIGURED
⚠️  SMS (Fast2SMS) - NOT CONFIGURED
✅ Image Upload (ImageKit) - Configured
✅ PostgreSQL Connected Successfully!
```

This is **normal and OK** for local development!

## Common Scenarios

### Scenario 1: Just want to test the API locally
✅ Use `.env.local` as-is  
✅ No need to set up email/SMS/ImageKit  
✅ Run `npm start` - it works!

### Scenario 2: Want to test email/SMS functionality
1. Get test API keys from Gmail/Fast2SMS
2. Update `.env.local` with the test keys
3. Restart server
4. Test email/SMS features

### Scenario 3: Going live to production
1. Get production credentials from your cloud provider
2. Edit `.env.production` - replace all REPLACE_WITH_PROD_* values
3. Deploy with `NODE_ENV=production npm start`
4. Server auto-loads `.env.production`

### Scenario 4: Different team member joining
1. They clone the repo
2. They get their own credentials/API keys
3. They update their `.env.local`
4. Their changes don't affect git (it's in .gitignore)
5. They run `npm start`
6. Everyone works in parallel without conflicts

## Security Notes

### ✅ Safe Practices (Already Set Up)
- `.env.local` and `.env.production` are in `.gitignore`
- No credentials are hard-coded in source files
- Each environment has its own separate config
- Server validates required variables on startup

### 🔐 Additional Tips
- Keep `.env.production` only on production servers
- Use GitHub Secrets for CI/CD deployments
- Rotate credentials quarterly
- Use strong passwords (16+ characters)
- Enable 2FA on email/SMS provider accounts

## Troubleshooting

### "Cannot find module .env"
- Check `.env.local` exists: `ls backend/.env.local`
- If missing, it was deleted - recreate from `.env.example`
- Re-run `npm start`

### "PostgreSQL Connected Failed"
- Is PostgreSQL running? Check with: `psql -V`
- Are credentials correct in `.env.local`? Check: `grep DB_` backend/.env.local
- Can you connect manually? Try: `psql -h localhost -U postgres`

### "Email service not configured"
- This is **normal** if you didn't add SMTP credentials
- System will skip email and log a warning
- To enable: update `SMTP_*` variables in `.env.local`

### "JWT_SECRET is too short"
- Edit `.env.local`
- Change `JWT_SECRET` to a string with 32+ characters
- Can generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Restart server

## Next Steps

### 1. Immediate (Local Testing)
```bash
cd backend
npm run validate-env    # Check what's configured
npm start              # Start the server
```

### 2. When Testing Email/SMS
```bash
# Get test keys from providers
# Update backend/.env.local with the keys
# Restart server - it auto-detects changes
```

### 3. When Going to Production
```bash
# Update backend/.env.production with REAL credentials
# Deploy with NODE_ENV=production
# Server auto-loads .env.production
```

## Full Documentation

For detailed setup including:
- How to get Gmail app passwords
- How to set up Fast2SMS DLT
- How to configure ImageKit
- How to generate secure JWT secrets
- SQL database setup

See: **`backend/ENVIRONMENT_CONFIG_GUIDE.md`**

---

**Ready to start?**
```bash
cd backend
npm run validate-env
npm start
```

Questions? Check the logs - they're very descriptive about what's configured and what's missing.
