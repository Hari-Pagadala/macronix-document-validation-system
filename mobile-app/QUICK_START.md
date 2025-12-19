# Field Officer Mobile App - Quick Start Guide

## Installation Complete ✅

The mobile app dependencies have been successfully installed. Follow these steps to run the application.

## Step 1: Update Backend API URL

If the backend is running on a different machine or IP:

**For Local Testing (same machine):**
```
Keep .env as:
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

**For Physical Device Testing:**
Edit `.env`:
```
EXPO_PUBLIC_API_BASE_URL=http://YOUR_MACHINE_IP:5000/api
```

To find your machine IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

## Step 2: Ensure Backend is Running

Make sure the backend server is running on port 5000:
```bash
cd backend
npm run dev
```

You should see: `🚀 Server running on http://localhost:5000`

## Step 3: Start the Mobile App

Choose one of the following options:

### Option A: Run on Expo Go (Recommended for Quick Testing)
```bash
cd mobile-app
npm start
```

Then:
- **Android**: Press `a` in terminal or scan QR code with Expo Go app
- **iOS**: Press `i` or scan QR code with native camera
- **Web**: Press `w` for browser preview

### Option B: Run on Android Emulator
```bash
cd mobile-app
npm run android
```

Requires Android Studio and emulator to be running.

### Option C: Run on iOS Simulator (macOS only)
```bash
cd mobile-app
npm run ios
```

### Option D: Run on Web
```bash
cd mobile-app
npm run web
```

Opens at `http://localhost:19006` (browser only, camera/location limited)

## Step 4: Test the App

### Login
- Use any active Field Officer credentials from the database
- Example:
  ```
  Email: [field-officer-email]
  Password: [field-officer-password]
  ```

### Case Operations
1. **View Cases**: Should display all assigned cases
2. **Filter**: Try filtering by "Submitted" or "Insufficient"
3. **Search**: Search by case number or name
4. **View Details**: Tap a case to see full details
5. **Submit**: Tap "Submit Verification" button

### Test Verification Submission
1. Fill in respondent details
2. Select ownership type
3. **Upload mandatory photos**:
   - Selfie Photo with House (tap "Select Image")
   - Candidate with Respondent Photo (tap "Select Image")
4. Tap "Submit Verification"
5. Check the console/backend for success

## Troubleshooting

### Issue: "Cannot connect to backend"
**Solution**:
- Verify backend is running: `npm run dev` in backend folder
- Check backend URL in `.env` matches your setup
- For physical device: use machine IP instead of localhost
- Check firewall allows port 5000

### Issue: "GPS location not available"
**Solution**:
- On physical device: Enable location permissions in Settings
- On emulator: Mock location isn't available, use device
- App will show alert if location can't be acquired

### Issue: "Blank white screen on startup"
**Solution**:
- Wait 30 seconds (bundling can be slow)
- Check terminal for errors
- Restart Expo: `Ctrl+C` then `npm start` again

### Issue: "Image picker not working"
**Solution**:
- On physical device: Enable photo library permissions
- On web: File picker works but limited to web file system
- Try using a physical device for full functionality

### Issue: "Dependencies won't install"
**Solution**:
```bash
# Clear cache and reinstall
npm cache clean --force
rm -r node_modules package-lock.json
npm install
```

## File Structure Reference

```
mobile-app/
├── App.js                    # Main entry & navigation
├── screens/                  # UI screens
│   ├── LoginScreen.js        # Login form
│   ├── CaseListingScreen.js  # Cases list
│   ├── CaseDetailsScreen.js  # Case info
│   └── SubmitVerificationScreen.js  # Submission form
├── services/
│   └── apiService.js         # API calls
├── package.json              # Dependencies
├── app.json                  # Expo config
└── .env                      # Environment variables
```

## Key Features Verified

✅ Login with email/password
✅ View assigned cases
✅ Filter by status (Assigned, Submitted, Insufficient)
✅ Search cases
✅ View case details
✅ Submit verification with mandatory photos
✅ GPS location capture
✅ File uploads (documents & photos)
✅ Form validation
✅ Error handling
✅ Token persistence (auto-login)

## Development Tips

### Debugging
- Use React Native Debugger: `https://github.com/jhen0409/react-native-debugger`
- Check console logs in Expo DevTools (press `j` in terminal)
- Network requests visible in DevTools

### Hot Reload
- Save file → App reloads automatically
- Hard reload: Press `r` in terminal or shake device

### Testing Different Scenarios
1. **Valid login**: Should navigate to case listing
2. **Invalid login**: Should show error alert
3. **Network offline**: Should show connection error
4. **Permission denied**: Should show appropriate alerts

## Next Steps

1. **Install on Physical Device**:
   - Download Expo Go from Play Store / App Store
   - Scan QR code from `npm start` terminal

2. **Submit Real Verification**:
   - Assign a case to your test FO in backend
   - Test full submission flow with photos
   - Verify record created in database

3. **Build for Production** (future):
   - `expo build:android` or `expo build:ios`
   - Requires Expo account

## Support Resources

- **React Native Docs**: https://reactnative.dev
- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org

---

**Mobile App Version**: 1.0.0
**Last Updated**: 2025-12-18
