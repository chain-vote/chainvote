# Firebase Google Authentication Setup

To finalize the integration of Google Authentication into ChainVote, you need to configure your own Firebase project. Since we lack direct access to your Google Cloud environment, please follow these steps to securely set it up:

## 1. Firebase Console
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project** (or use an existing one).
3. In the left sidebar, click on **Authentication** > **Get Started**.
4. Go to the **Sign-in method** tab.
5. Click **Add new provider** and select **Google**.
6. Enable the switch. Provide your project's support email and save.

## 2. Frontend Configuration
1. Go to **Project Settings** (the gear icon on the left).
2. Scroll to the "Your apps" section and click the **Web (</>)** icon to add a web app.
3. Register the app (e.g., "ChainVote Frontend").
4. You will be provided with a `firebaseConfig` object.
5. **Open `frontend/.env`** (create one if missing) and paste the following, replacing the dummy values with your Firebase Config values:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

## 3. Backend Configuration (firebase-admin)
To securely verify logins from the frontend, your backend needs service account credentials.
1. Still in **Project Settings**, go to the **Service accounts** tab.
2. Click **Generate new private key**. This downloads a JSON file.
3. Rename the downloaded file to `firebase-service-account.json`.
4. Place this file inside your `.gemini` or an ignored directory, or set its path as an environment variable in `backend/.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```
5. The backend code expects this file to exist to parse and verify incoming Google Identity tokens.

*Note: I have already implemented the UI buttons, the frontend logic utilizing `signInWithPopup`, and the backend endpoint for token verification. Once you populate these configuration files, the Google authentication flow will be fully operational.*
