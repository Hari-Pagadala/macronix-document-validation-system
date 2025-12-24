# Database Setup Guide

## Current Status
The backend server is running successfully, but the database connection is failing because **PostgreSQL is not running** on your system.

## Required: Start PostgreSQL

You need a PostgreSQL database running on `localhost:5432` with the following credentials:
- **Host**: localhost
- **Port**: 5432
- **Database**: postgres
- **Username**: postgres
- **Password**: postgres

### Option 1: Using Docker (Recommended)

If you have Docker installed:

```bash
cd "c:\Users\nares\Desktop\macronix-document-validation-system"
docker-compose up -d db
```

This will start PostgreSQL in a Docker container.

### Option 2: Windows PostgreSQL Installer

1. Download PostgreSQL 15+ from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Set the password to `postgres` when prompted
4. Keep the default port 5432
5. After installation, PostgreSQL will run as a Windows service

### Option 3: PostgreSQL Portable

1. Download PostgreSQL portable version
2. Extract and run the postgres service manually

## After Starting PostgreSQL

Once PostgreSQL is running:

1. **Kill current backend process:**
   ```bash
   Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

2. **Initialize the database:**
   ```bash
   cd "c:\Users\nares\Desktop\macronix-document-validation-system\backend"
   node createAdmin_SQL.js
   ```

   This will:
   - Create database tables
   - Create admin user: `purna@macronix.com` / `December@2025`
   - Initialize counters

3. **Start the backend:**
   ```bash
   npm start
   ```

4. **Login in frontend** with:
   - **Email**: purna@macronix.com
   - **Password**: December@2025

## Verification

Once database is connected, you should see:
```
✅ PostgreSQL Connected Successfully!
✅ Database tables synchronized!
🚀 Server running on http://0.0.0.0:5000
```

## Troubleshooting

**Error: `Database Connection Error`**
- Verify PostgreSQL is running
- Check: `psql -h localhost -U postgres -d postgres -c "SELECT 1;"`
- Verify credentials in `.env.local` file

**Error: `EADDRINUSE: address already in use 0.0.0.0:5000`**
- Kill all node processes: `Get-Process node | Stop-Process -Force`
- Wait 3 seconds before restarting

**Error: `relation "users" does not exist`**
- Run: `node createAdmin_SQL.js` to initialize tables
