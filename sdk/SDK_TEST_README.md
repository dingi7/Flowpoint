# SDK Testing Guide

## Quick Start

1. **Start the development server:**
   ```bash
   cd flowpoint
   npm run dev
   ```

2. **Open the test page:**
   Navigate to `http://localhost:5173/test-sdk.html` (or whatever port Vite is using)

3. **Enter an organization ID** in the input field and click "Load Form"

4. **Test the form:**
   - Select a service
   - Choose a date
   - Select an available time slot
   - Fill in customer information
   - Submit the booking

## Testing with Different API Endpoints

If you need to test against a different API endpoint (e.g., local Firebase Functions emulator or production), enter the base URL in the "API Base URL" field.

### Example URLs:
- **Local Emulator:** `http://localhost:5001/brogrammers-crm/us-central1`
- **Production:** `https://us-central1-brogrammers-crm.cloudfunctions.net`
- **Custom:** Your custom API endpoint

## Troubleshooting

### Firestore Permission Errors (PERMISSION_DENIED)

If you see errors like `PERMISSION_DENIED: Missing or insufficient permissions`, you have two options:

#### Option 1: Test with Local Emulators (Recommended for Development)

1. **Start Firebase Emulators:**
   ```bash
   cd functions
   firebase emulators:start --only functions,firestore
   ```

2. **Update the test page API URL:**
   - Use: `http://localhost:5001/brogrammers-crm/us-central1`
   - The emulator will use local Firestore with no permission restrictions

3. **Import test data** (if needed):
   - Use Firebase Console to export/import data
   - Or use the emulator UI at `http://localhost:4000`

#### Option 2: Fix Production Permissions

If testing against production, ensure the Firebase Functions service account has proper Firestore permissions:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to IAM & Admin > IAM
3. Find the service account: `firebase-adminsdk-fbsvc@brogrammers-crm.iam.gserviceaccount.com`
4. Ensure it has the **Cloud Datastore User** role (or **Firestore User** role)
5. If missing, add the role and redeploy functions

### CORS Issues
If you encounter CORS errors, make sure:
1. You're accessing the page through the dev server (not `file://`)
2. The API endpoints allow requests from your origin
3. For local testing, ensure Firebase Functions emulator is running and configured correctly
4. CORS headers have been added to all widget endpoints (already implemented)

### Form Not Loading
- Check browser console for errors
- Verify the organization ID is correct
- Ensure the SDK script (`sdk.js`) is accessible at `/sdk.js`
- Check network tab to see if API requests are failing
- Verify you're using the correct API base URL (emulator vs production)

### No Services/Members Showing
- Verify the organization ID exists in your database
- Check that the organization has active services and members
- Look at the network requests to see the API responses
- If using emulator, ensure test data is imported

## Manual Testing Checklist

- [ ] Form loads with services dropdown populated
- [ ] Date picker works and prevents past dates
- [ ] Time slots load when service and date are selected
- [ ] Time slot selection works
- [ ] Form validation works (required fields)
- [ ] Email validation works
- [ ] Form submission works
- [ ] Success message appears after booking
- [ ] Error messages display correctly
- [ ] Loading states work correctly
- [ ] Form resets after successful booking
- [ ] Responsive design works on mobile

