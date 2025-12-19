# Field Officer Mobile Application

A React Native mobile application for Field Officers to manage and submit case verifications. This app mirrors the functionality of the existing web Field Officer portal.

## Features

- **Authentication**: Secure login using the same credentials as the web portal
- **Case Listing**: View assigned cases with filtering by status
- **Case Details**: View comprehensive case information
- **Verification Submission**: Submit verification details with photo uploads, GPS location, and signatures
- **Offline Support**: Uses local storage for authentication tokens
- **Cross-Platform**: Works on both iOS and Android

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: React Hooks
- **API Communication**: Axios
- **Local Storage**: AsyncStorage
- **Camera & Location**: Expo modules

## Project Structure

```
mobile-app/
├── App.js                          # Main app entry and navigation setup
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── screens/
│   ├── LoginScreen.js             # FO login screen
│   ├── CaseListingScreen.js       # List of assigned cases
│   ├── CaseDetailsScreen.js       # Case information display
│   └── SubmitVerificationScreen.js # Verification submission form
├── services/
│   └── apiService.js              # API integration layer
└── README.md                       # This file
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. Navigate to the mobile-app directory:
   ```bash
   cd mobile-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the backend API URL in `.env`:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://YOUR_BACKEND_URL/api
   ```

4. For development with physical devices:
   - Install Expo Go app on your mobile device
   - Update the API URL to use your machine's IP address instead of `localhost`

### Running the App

**Development Mode (Web)**:
```bash
npm run web
```

**Development Mode (Android)**:
```bash
npm run android
```

**Development Mode (iOS)**:
```bash
npm run ios
```

**Expo Go (All Platforms)**:
```bash
npm start
```

Then scan the QR code with Expo Go app or press `a` for Android / `i` for iOS.

## API Integration

The mobile app uses the same backend API endpoints as the web portal:

- **Login**: `POST /api/fo-portal/login`
- **Get Cases**: `GET /api/fo-portal/cases`
- **Get Case Details**: `GET /api/records/{caseId}`
- **Get Verification**: `GET /api/records/{caseId}/verification`
- **Submit Verification**: `POST /api/fo-portal/cases/{caseId}/submit`

## Authentication Flow

1. User logs in with email and password on LoginScreen
2. Backend returns JWT token
3. Token is stored in AsyncStorage
4. Token is automatically attached to all API requests via axios interceptor
5. If token expires (401), user is redirected to login

## Verification Submission

### Required Fields
- Respondent name
- Respondent contact (10-digit numeric)
- Ownership type (Owned, Rented, PG, Hostel)
- Verification date
- **Selfie Photo with House** *(mandatory)*
- **Candidate with Respondent Photo** *(mandatory)*
- GPS location (automatically captured)

### Optional Fields
- Relationship with candidate
- Period of stay
- Comments
- Additional house photos
- Documents

### Validations

All validations match the web portal:
- Contact number must be exactly 10 digits
- GPS location is required (status checked)
- Both mandatory photos must be provided
- All required fields must be filled

## File Upload

Files are uploaded as multipart/form-data using FormData API:
- Maximum file size: Depends on backend configuration
- Supported formats: JPEG, PNG
- Photos are compressed before upload (quality: 0.8)

## Offline Capabilities

- Token persists in AsyncStorage
- App automatically logs in user if valid token exists
- API requests will fail if offline (show error alert)

## Error Handling

- Network errors display user-friendly messages
- Validation errors show specific field-level feedback
- 401 errors trigger automatic logout and redirect to login
- All errors are logged to console for debugging

## Testing

### Test Credentials

Use the same Field Officer credentials created in the backend:

```
Email: [field-officer-email]
Password: [field-officer-password]
```

### Manual Testing Steps

1. **Login Test**:
   - Enter valid FO credentials → Should redirect to case listing
   - Enter invalid credentials → Should show error

2. **Case Listing Test**:
   - Should display all assigned cases
   - Filter by status (Assigned, Submitted, Insufficient)
   - Search by case number or name

3. **Case Details Test**:
   - Tap on case → Should show full details
   - Verify all information displays correctly

4. **Submit Verification Test**:
   - Navigate to submit verification
   - Fill all mandatory fields
   - Upload selfie and candidate photos
   - Submit → Should show success message
   - Check backend database for created verification record

## Known Limitations

- File picker on web (expo web) has limited functionality
- Large files may cause upload issues (recommend < 5MB per image)
- GPS requires device location permissions (may fail on emulator)

## Future Enhancements

- Offline sync for submitted verifications
- Signature pad for on-screen signatures
- Image annotation tools
- Document scanning
- Push notifications for case updates
- Advanced filters and search

## Support

For issues or questions:
1. Check the error messages displayed in the app
2. Review console logs in Expo DevTools
3. Verify backend API is running and accessible
4. Check network connectivity

## License

Proprietary - Macronix Document Validation System
