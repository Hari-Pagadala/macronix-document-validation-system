# ImageKit Integration: Troubleshooting & Testing Guide

## Quick Status Check

### 1. Backend Running?
```bash
# Check if node process is running
Get-Process -Name node

# Expected: process running with ID, memory usage visible
```

### 2. ImageKit Token Endpoint Accessible?
The endpoint is at: `http://localhost:5000/api/fo-portal/imagekit-token`

**No Authentication Required** — Token itself is secure

**Expected Success Response (200):**
```json
{
  "token": "eyJ...",
  "expire": "1234567890",
  "signature": "abc123...",
  "publicKey": "public_jnmn+DPEtMjBKnAKHgFbNRN4OxA=",
  "urlEndpoint": "https://ik.imagekit.io/g6rdi7spf"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Failed to generate ImageKit token"
}
```

If you get a 500 error, check:
1. ImageKit credentials in `backend/.env` are complete
2. `imagekit` npm package is installed in backend
3. `backend/utils/imagekitHelper.js` is loading credentials correctly

### 3. Frontend Can Display ImageKit Images?
In `frontend/src/components/ViewDetailsModal.js`, images from ImageKit should render with:
- Automatic lazy loading
- Low-quality placeholder while loading
- Responsive sizing

If images don't display:
1. Check that `imagekit-react` is installed: `npm list imagekit-react` in frontend directory
2. Verify `ImageKitContext.js` is properly wrapping the app
3. Check browser console for specific image URL errors

## Common Issues & Solutions

### Issue: "Cannot find module 'imagekit'"

**Cause:** npm package not installed in backend

**Solution:**
```bash
cd backend
npm install imagekit
```

**Verify:**
```bash
npm list imagekit

# Should show: imagekit@<version>
```

### Issue: Token Endpoint Returns 500 Error

**Cause:** ImageKit credentials missing or invalid

**Solution:**
1. Open `backend/.env` and verify these lines exist:
   ```
   IMAGEKIT_ENDPOINT=https://ik.imagekit.io/g6rdi7spf
   IMAGEKIT_PUBLIC_KEY=public_jnmn+DPEtMjBKnAKHgFbNRN4OxA=
   IMAGEKIT_PRIVATE_KEY=private_fd8buWCL3eljgCV1enHQM46QyE8=
   ```

2. Check they're spelled exactly as shown (case-sensitive)

3. Restart backend after making changes:
   ```bash
   Get-Process -Name node | Stop-Process -Force
   cd backend
   node server.js
   ```

4. Check backend logs for error message:
   ```
   [ImageKit] Token generation error: ...
   ```

### Issue: Mobile App Can't Connect to Backend

**Cause:** API_BASE_URL incorrect in `mobile-app/app.json`

**Solution:**
Check `mobile-app/app.json` extra section:
```json
"extra": {
  "EXPO_PUBLIC_API_BASE_URL": "http://192.168.X.X:5000/api",
  "EXPO_PUBLIC_IMAGEKIT_ENDPOINT": "https://ik.imagekit.io/g6rdi7spf",
  "EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY": "public_jnmn+DPEtMjBKnAKHgFbNRN4OxA="
}
```

Replace `192.168.X.X` with your actual backend machine IP (shown when server starts)

### Issue: Images Not Displaying in Super Admin

**Cause 1:** URLs not stored in database

**Solution:**
1. Check mobile app submission logs for `[ImageKit] Upload success`
2. Verify backend received and stored URLs (check server logs)
3. Query database:
   ```sql
   SELECT id, docUrls, photoUrls FROM "Verifications" 
   WHERE "docUrls" IS NOT NULL 
   LIMIT 1;
   ```
4. URLs should be in format: `https://ik.imagekit.io/g6rdi7spf/...`

**Cause 2:** Frontend not detecting ImageKit URLs

**Solution:**
1. Check browser console for errors
2. Verify `isImageKitUrl()` function in ViewDetailsModal.js returns true for ImageKit URLs
3. Verify `<IKImage>` component is rendering (not fallback `<img>`)

### Issue: Duplicate Variable Declarations Error

**Cause:** Old code not properly updated in fieldOfficerController_SQL.js

**Solution:** This should already be fixed, but if you see:
```
SyntaxError: Identifier 'officerSignaturePath' has already been declared
```

Check lines around 420-430 in fieldOfficerController_SQL.js for duplicate `const` declarations and remove them.

## Testing Workflow

### Step 1: Verify Backend Infrastructure (5 min)

```bash
# 1. Start backend
cd backend
node server.js

# 2. Expected output:
# 🚀 Server running on http://0.0.0.0:5000
# ✅ PostgreSQL Connected Successfully!
# ✅ Database tables synchronized!

# 3. Keep this terminal open for logs
```

### Step 2: Test Token Endpoint (2 min)

Open **another terminal** and test:

```powershell
# Option A: Direct test with headers
$headers = @{
    "Authorization" = "Bearer test-token"
    "Content-Type" = "application/json"
}
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/fo-portal/imagekit-token" `
    -Method POST `
    -Headers $headers

$response | ConvertTo-Json

# Expected: Returns token object with all fields populated

# Option B: Check if URL is reachable
Test-NetConnection -ComputerName localhost -Port 5000

# Expected: TcpTestSucceeded : True
```

### Step 3: Test Mobile Submission (10 min)

1. Open Expo app on device/simulator
2. Navigate to Submitted Cases
3. Select any case and click "Submit Verification"
4. Capture or select photos
5. Click "Submit"
6. Watch backend terminal for logs:
   ```
   [ImageKit] Uploading X documents...
   [ImageKit] Upload success: https://ik.imagekit.io/...
   Documents uploaded: [...]
   ```

### Step 4: Verify Database (2 min)

Connect to PostgreSQL and check:

```sql
-- Check if verification was stored with ImageKit URLs
SELECT 
  id,
  "caseId",
  "docUrls",
  "photoUrls",
  "selfieWithHousePath",
  "createdAt"
FROM "Verifications"
WHERE "selfieWithHousePath" LIKE 'https://ik.imagekit.io/%'
ORDER BY "createdAt" DESC
LIMIT 5;

-- If URLs start with 'https://ik.imagekit.io/' → ImageKit storage working!
-- If URLs look like file paths → Legacy storage (check if base64 or local path)
```

### Step 5: Test Super Admin Display (3 min)

1. Open Super Admin panel (same machine or network)
2. Go to Submitted Cases
3. Find the case you just submitted
4. Click "View Details"
5. Scroll to Verification section
6. Check images display:
   - Images should load from ImageKit (CDN)
   - Should see lazy loading placeholders first
   - Should scale responsively

## Monitoring & Debugging

### Backend Logs to Watch For

```
✅ Success indicators:
[ImageKit] Upload success: https://ik.imagekit.io/g6rdi7spf/documents/...
Verification saved with ImageKit URLs
isImageKitSubmission: true

❌ Error indicators:
[ImageKit] Token generation error:
Failed to generate ImageKit token
Cannot find module 'imagekit'
Duplicate variable declaration
```

### Frontend Console (Browser DevTools)

```javascript
// Check if context is working
console.log(useContext(IKContext))  
// Should show: { endpoint: "...", publicKey: "..." }

// Check if URL detection works
isImageKitUrl("https://ik.imagekit.io/g6rdi7spf/...")
// Should return: true

// Check if IKImage component loads
// Look for <IKImage> tags in Elements panel (not <img>)
```

### Mobile App Logs (Expo)

Relevant logs from `SubmitVerificationScreen.js`:
```
[ImageKit] Uploading X documents...
[ImageKit] Uploading X photos...
[ImageKit] Uploading selfie...
[ImageKit] Upload success: [URL1, URL2, ...]
Verification submitted with ImageKit URLs
```

## Quick Fixes

### Force Backend Restart
```bash
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
cd backend
node server.js
```

### Clear Frontend Cache
In browser DevTools:
1. Application → Storage → Clear Site Data
2. Refresh page

### Verify Expo Configuration
```bash
cd mobile-app
expo start --clear
# Then select 'w' for web preview or scan QR code
```

### Check npm Dependencies
```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install

# Mobile
cd ../mobile-app
npm install
```

## Success Indicators

You'll know everything is working when you see:

1. **Backend logs show:**
   ```
   🚀 Server running on http://0.0.0.0:5000
   ✅ PostgreSQL Connected Successfully!
   ```

2. **Mobile app shows:**
   ```
   [ImageKit] Uploading X documents...
   [ImageKit] Upload success: https://ik.imagekit.io/...
   Verification submitted with ImageKit URLs
   ```

3. **Database contains:**
   ```
   docUrls: ["https://ik.imagekit.io/g6rdi7spf/documents/...", ...]
   photoUrls: ["https://ik.imagekit.io/g6rdi7spf/photos/...", ...]
   selfieWithHousePath: "https://ik.imagekit.io/g6rdi7spf/..."
   ```

4. **Super Admin displays:**
   - Images load with lazy loading
   - Images scale responsively
   - No broken image errors
   - Images load from ImageKit CDN (check Network tab)

---

**All infrastructure components are deployed. Use this guide to verify functionality and troubleshoot any issues.**
