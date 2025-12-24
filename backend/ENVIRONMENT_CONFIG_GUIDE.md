# Environment Configuration Guide

## Overview

The Macronix Document Validation System supports environment-specific configuration for:
- **Local Development** (.env.local)
- **Production** (.env.production)

This approach ensures:
- No hard-coded credentials in source code
- Easy switching between environments
- Security of sensitive credentials
- Clear separation of concerns

## Quick Start

### Development Setup

1. **Copy the local configuration template:**
   ```bash
   cd backend
   # Create .env.local from .env.example (already exists as .env.local)
   ```

2. **Update .env.local with your local credentials:**
   - PostgreSQL credentials
   - Test ImageKit keys
   - Test email/SMS API keys

3. **Start the backend:**
   ```bash
   # Automatically loads .env.local in development
   NODE_ENV=development npm start
   ```

### Production Setup

1. **Prepare .env.production:**
   - Copy the template: `.env.production` (already created)
   - Replace all `REPLACE_WITH_PROD_*` placeholders with real credentials

2. **Deploy:**
   ```bash
   # Will automatically load .env.production
   NODE_ENV=production npm start
   ```

## Environment Variables Structure

### 1. Server Configuration

```env
PORT=5000                    # API server port
NODE_ENV=development         # Environment: development, production
```

### 2. Database Configuration

| Variable | Local | Production | Required |
|----------|-------|-----------|----------|
| `DB_HOST` | localhost | RDS/Cloud host | Yes |
| `DB_PORT` | 5432 | 5432 | Yes |
| `DB_NAME` | postgres | macronix_production | Yes |
| `DB_USER` | postgres | prod_db_user | Yes |
| `DB_PASSWORD` | postgres | (PROD_PASSWORD) | Yes |
| `DB_DIALECT` | postgres | postgres | Yes |
| `DB_LOGGING` | false | false | No |
| `DB_SSL` | false | true | No |

### 3. JWT Configuration

| Variable | Purpose | Required |
|----------|---------|----------|
| `JWT_SECRET` | Secret key for signing tokens (min 32 chars) | Yes |

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Frontend Configuration

| Variable | Local | Production | Purpose |
|----------|-------|-----------|---------|
| `FRONTEND_URL` | http://localhost:3000 | https://your-domain.com | CORS origin |

### 5. ImageKit Configuration (File Uploads)

| Variable | Local | Production | Required |
|----------|-------|-----------|----------|
| `IMAGEKIT_PUBLIC_KEY` | Test key | Production key | If using ImageKit |
| `IMAGEKIT_PRIVATE_KEY` | Test key | Production key | If using ImageKit |
| `IMAGEKIT_ENDPOINT` | Test endpoint | Production endpoint | If using ImageKit |

**Get ImageKit credentials:**
- Sign up at https://imagekit.io
- Copy keys from Dashboard → Settings → API Keys

### 6. Email Configuration (Google SMTP)

| Variable | Local | Production | Notes |
|----------|-------|-----------|-------|
| `SMTP_HOST` | smtp.gmail.com | smtp.gmail.com | Google SMTP server |
| `SMTP_PORT` | 587 | 465 | 587 (TLS) or 465 (SSL) |
| `SMTP_SECURE` | false | true | true for port 465 |
| `SMTP_USER` | test@gmail.com | prod@gmail.com | Gmail address |
| `SMTP_PASS` | test_app_password | prod_app_password | Gmail app password |
| `EMAIL_FROM` | Optional | Optional | Display name in emails |

**Generate Gmail App Password:**
1. Enable 2FA on Gmail account: https://myaccount.google.com/security
2. Create app password: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer" (or your OS)
4. Copy the 16-character password (remove spaces)
5. Use as `SMTP_PASS`

### 7. SMS Configuration (Fast2SMS with DLT)

| Variable | Local | Production | Required |
|----------|-------|-----------|----------|
| `FAST2SMS_API_KEY` | Test API key | Production API key | If using SMS |
| `FAST2SMS_SENDER_ID` | MACRNX | MACRNX | Registered sender ID |
| `FAST2SMS_DLT_TEMPLATE_ID` | Template ID | Production Template ID | DLT template ID |

**Setup Fast2SMS:**
1. Register at https://www.fast2sms.com
2. Complete DLT (Distributed Transaction List) registration
3. Create SMS templates in Fast2SMS dashboard
4. Copy API key from Dashboard
5. Use Template ID from DLT registration

### 8. Short URL Configuration

| Variable | Local | Production | Purpose |
|----------|-------|-----------|---------|
| `SHORT_URL_BASE` | http://localhost:5000 | https://short-url-domain.com | Base for short links in SMS |
| `SHORT_URL_API_KEY` | test_key | prod_key | API key if using external service |

## Configuration Loading Logic

```
┌─────────────────────────────────────┐
│  Check NODE_ENV value               │
└──────┬──────────────────────────────┘
       │
       ├─→ production? ─→ Load .env.production
       │
       └─→ development/default? ─→ Load .env.local
       
       If file missing, show warning and try .env.example
```

## Service Status Check

On server startup, you'll see:

```
✅ PostgreSQL Connected Successfully!
✅ Database tables synchronized!
✅ Email (SMTP) - Configured
✅ SMS (Fast2SMS) - Configured
✅ Image Upload (ImageKit) - Configured
🚀 Server running on http://0.0.0.0:5000
```

Or warnings if services are not configured:

```
⚠️  Email (SMTP) - NOT CONFIGURED
⚠️  SMS (Fast2SMS) - NOT CONFIGURED
```

## Security Best Practices

### 1. Never commit .env files
```bash
# Verify in .gitignore
cat .gitignore | grep ".env"
```

### 2. Separate local and production credentials
- `.env.local` - for development (can contain test/dummy values)
- `.env.production` - for production (replace placeholders before deployment)

### 3. Rotate sensitive credentials regularly
- Change database passwords quarterly
- Regenerate API keys after employee changes
- Update SMTP/SMS credentials when adding new users

### 4. Use strong JWT secrets
```bash
# Generate 256-bit hex string
openssl rand -hex 32
# or with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Restrict access to production environment files
- Keep `.env.production` only on production servers
- Use deployment secrets management (GitHub Secrets, AWS Secrets Manager, etc.)
- Never share credentials in Slack, email, or version control

## Environment Variables Reference

### Complete .env.local Template

See `backend/.env.local` for a complete template with all supported variables.

### Complete .env.production Template

See `backend/.env.production` for production placeholders.

## Migration from .env.example

If you were using `.env.example` before:

1. **Check current setup:**
   ```bash
   ls -la backend/.env*
   ```

2. **Create .env.local from .env.example:**
   ```bash
   cp backend/.env.example backend/.env.local
   # Then update values in .env.local
   ```

3. **Remove old .env if it exists:**
   ```bash
   rm backend/.env
   ```

4. **Update .gitignore (already done):**
   Verify `.env.local` and `.env.production` are ignored.

## Troubleshooting

### "Missing required environment variables" error

**Problem:** Server won't start due to missing ENV vars

**Solution:**
1. Check current NODE_ENV:
   ```bash
   echo $NODE_ENV  # Linux/Mac
   echo %NODE_ENV%  # Windows
   ```

2. Verify the correct .env file exists:
   ```bash
   # For development
   ls -la backend/.env.local
   
   # For production
   ls -la backend/.env.production
   ```

3. Check file has required variables:
   ```bash
   grep "DB_HOST\|DB_PORT\|DB_NAME" backend/.env.local
   ```

### Services show "NOT CONFIGURED"

**Problem:** Email/SMS/ImageKit showing as not configured

**Solution:**
1. Check the .env file for missing keys:
   ```bash
   grep "SMTP_HOST\|FAST2SMS_API_KEY\|IMAGEKIT" backend/.env.local
   ```

2. Fill in missing credentials (dummy values okay for local development)

3. Restart the server - it will auto-detect the changes

### Database connection fails

**Problem:** "PostgreSQL Connected Failed" or connection timeout

**Solution:**
1. Verify credentials in .env file match your database:
   ```bash
   grep "DB_" backend/.env.local
   ```

2. Test connection manually:
   ```bash
   psql -h localhost -U postgres -d postgres -p 5432
   ```

3. Check PostgreSQL is running:
   ```bash
   # Windows
   Get-Service PostgreSQL*
   
   # Linux
   systemctl status postgresql
   ```

## Advanced Configuration

### Custom Database URL

If you prefer connection string format:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
```

The system will parse this automatically if needed.

### Multiple SMTP Transports

For Gmail accounts that block port 587, the system automatically falls back to port 465 with SSL.

No additional configuration needed - it's automatic!

### Email Source Address

Customize the "From" address in emails:

```env
EMAIL_FROM=Support Team <support@company.com>
```

Default: Uses `SMTP_USER` if not specified

## Next Steps

1. **Local Development:**
   - Use `.env.local` (already configured for you)
   - Update with your actual test credentials
   - Run `npm start` to verify everything works

2. **Prepare for Production:**
   - When ready for live deployment, update `.env.production`
   - Replace all `REPLACE_WITH_PROD_*` placeholders
   - Deploy and restart with `NODE_ENV=production`

3. **Continuous Deployment:**
   - Use GitHub Secrets or similar service
   - Inject environment variables during deployment
   - Never commit `.env.production` to version control

---

**Questions?** Check the server logs for detailed error messages and configuration status.
