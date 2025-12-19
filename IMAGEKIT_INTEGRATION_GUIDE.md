# ImageKit Integration Guide

## Overview

This guide walks you through integrating ImageKit for cloud image storage in the Macronix Document Validation System.

## What's New

- Mobile app uploads images directly to ImageKit (not local backend)
- Backend receives and stores ImageKit URLs (not base64 files)
- Super Admin displays images from ImageKit URLs
- Images are accessible globally with CDN performance

## Prerequisites

1. **ImageKit Account**
   - Sign up at [imagekit.io](https://imagekit.io) (free tier available)
   - Navigate to Dashboard > Settings > API Keys
   - Copy:
     - **URL Endpoint** (e.g., `https://ik.imagekit.io/your_account_id`)
     - **Public Key** (e.g., `public_abc123...`)
     - **Private Key** (e.g., `private_xyz789...`) — Keep this secret!

2. **Node.js Packages** (will be installed via npm)
   - Backend: `imagekit` package
   - Mobile: Already has axios and FormData support

## Setup Steps

### Step 1: Backend Configuration

Add ImageKit credentials to your backend `.env`:

```bash
# backend/.env
IMAGEKIT_ENDPOINT=https://ik.imagekit.io/YOUR_ACCOUNT_ID
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
```

Install dependencies:

```bash
cd backend
npm install imagekit
npm start
```

### Step 2: Mobile App Configuration

Update `mobile-app/app.json` with your ImageKit credentials:

```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_API_BASE_URL": "http://YOUR_MACHINE_IP:5000/api",
      "EXPO_PUBLIC_IMAGEKIT_ENDPOINT": "https://ik.imagekit.io/YOUR_ACCOUNT_ID",
      "EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY": "your_public_key_here"
    }
  }
}
```

Then restart the mobile app:

```bash
cd mobile-app
npm start
# or
npx expo start --clear
```

### Step 3: How It Works

**Flow:**

1. **Mobile App captures image** → Compresses image (if needed)
2. **Mobile App requests token** → `POST /api/fo-portal/imagekit-token` (backend generates secure token)
3. **Mobile App uploads to ImageKit** → Direct upload using token (no base64 in request)
4. **ImageKit returns URL** → `https://ik.imagekit.io/your_account_id/uploads/...`
5. **Mobile App includes URL** → Sends URL in verification payload to backend
6. **Backend stores URL** → Saves URL string in database (not file path)
7. **Super Admin displays image** → Loads from ImageKit URL in Super Admin panel

**Key Security Feature:**
- Mobile app never sees the Private Key
- Backend generates a secure token with expiration
- Token is used only for that single upload
- Private Key stays on the backend

### Step 4: Database Schema Update

The Verification table now stores URLs instead of file paths:

```javascript
// These fields now contain ImageKit URLs (strings), not local file paths
documents: {                    // Array of ImageKit URLs
  type: DataTypes.JSON,
  defaultValue: []
},
photos: {                       // Array of ImageKit URLs
  type: DataTypes.JSON,
  defaultValue: []
},
selfieWithHousePath: DataTypes.STRING,        // ImageKit URL
candidateWithRespondentPath: DataTypes.STRING, // ImageKit URL
officerSignaturePath: DataTypes.STRING,        // ImageKit URL
respondentSignaturePath: DataTypes.STRING      // ImageKit URL
```

### Step 5: Migration from Local Files

If you have existing submissions with local file paths:

```bash
# Run this migration script (coming in next commit)
cd backend
node scripts/migrateLocalFilesToImageKit.js
```

This script:
- Reads local files from `backend/uploads/fo/`
- Uploads each to ImageKit
- Updates database URLs
- (Optional) Removes old local files

### Step 6: Testing

**Test Seed Data:**

```bash
cd backend
node scripts/seedVerificationForRecord.js REC-2025-00022
```

This will create sample verification with ImageKit URLs.

**Manual Test:**

1. From mobile app, capture a photo and submit
2. Check backend logs for `[ImageKit] Upload success: https://...`
3. Open Super Admin → Submitted Cases → View case details
4. Images should display from ImageKit

## Troubleshooting

| Issue | Solution |
|-------|----------|
| ImageKit credentials not loading | Check `app.json` has correct keys; restart Expo |
| "ImageKit token generation failed" | Verify backend `.env` has `IMAGEKIT_*` set; restart backend |
| Images show broken icon | Check ImageKit URL is correct; verify public access is enabled |
| Upload hangs on mobile | Check network; try smaller images; check ImageKit bandwidth |
| "Invalid signature" error | Backend token expired; mobile requesting new token |

## API Endpoints

### POST `/api/fo-portal/imagekit-token`

**Request:**
```http
POST /api/fo-portal/imagekit-token
Content-Type: application/json
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expire": 1703097600,
  "signature": "abc123def456...",
  "publicKey": "public_xyz789...",
  "urlEndpoint": "https://ik.imagekit.io/your_account_id"
}
```

### POST `/api/fo-portal/cases/:caseId/submit` (ImageKit Version)

**Request:**
```json
{
  "respondentName": "John Doe",
  "documents": [
    "https://ik.imagekit.io/your_account_id/uploads/document_123.pdf"
  ],
  "photos": [
    "https://ik.imagekit.io/your_account_id/uploads/photo_456.jpg"
  ],
  "selfieWithHouse": "https://ik.imagekit.io/your_account_id/uploads/selfie_789.jpg",
  "candidateWithRespondent": "https://ik.imagekit.io/your_account_id/uploads/candidate_012.jpg",
  "officerSignature": "https://ik.imagekit.io/your_account_id/uploads/officer_sig_345.png",
  "respondentSignature": "https://ik.imagekit.io/your_account_id/uploads/respondent_sig_678.png"
}
```

## File Organization in ImageKit

Recommended folder structure:

```
ik.imagekit.io/your_account_id/
├── documents/        # Proof documents
├── photos/          # House photos
├── signatures/      # Signature captures
├── selfies/         # Selfie with house
└── candidates/      # Candidate with respondent
```

Configure this in ImageKit Dashboard under Folder Settings.

## Cost Considerations

ImageKit Free Tier includes:
- 20 GB bandwidth/month
- 500k requests/month
- Unlimited transformations

For production:
- ~100 cases/month × 5 images = 500 images
- ~100-200 MB/month (typical)
- Fits comfortably in free tier for early stages

See [ImageKit Pricing](https://imagekit.io/pricing/) for details.

## Environment Variables Reference

**Backend (`backend/.env`):**
```
IMAGEKIT_ENDPOINT=https://ik.imagekit.io/your_id
IMAGEKIT_PUBLIC_KEY=public_key_here
IMAGEKIT_PRIVATE_KEY=private_key_here
```

**Mobile (`mobile-app/app.json`):**
```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_IMAGEKIT_ENDPOINT": "https://ik.imagekit.io/your_id",
      "EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY": "public_key_here"
    }
  }
}
```

**Frontend (no changes needed; reads from API)**

## Next Steps

1. Get ImageKit credentials
2. Update `.env` and `app.json`
3. Restart backend and mobile app
4. Test image upload and display
5. Monitor ImageKit dashboard for usage

---

For support: Check ImageKit docs at [docs.imagekit.io](https://docs.imagekit.io/)
