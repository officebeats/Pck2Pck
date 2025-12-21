# 🚀 Pck2Pck Deployment & SSO Roadmap

This document outlines the strategy for launching Pck2Pck to a production environment using the **Google Cloud / Firebase technology stack**. Our goal is to make deployment simple, efficient, and robust for a growing user base.

## 1. Google Single Sign-On (SSO)
The application is already architected to support Google SSO via Firebase Authentication.

### Technical Implementation
- **Current Status**: Code-ready in `src/context/AuthContext.tsx`.
- **Method**: `signInWithPopup` for web, or `signInWithRedirect` for mobile-first PWA compliance.
- **Data Persistence**: Successful login automatically links the user to their Firestore data.

### Required Actions (Non-Technical)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Go to **Authentication** > **Sign-in method**.
4. Enable **Google**.
5. Whitelist your production domain (e.g., `pck2pck.web.app`).

---

## 2. Production Deployment (Firebase Hosting)
Firebase Hosting is the ideal solution for high-performance delivery of our React PWA.

### The "Zero-Effort" Workflow
We will implement **GitHub Actions** so that every time you save code to your main branch, the app automatically builds and deploys.

### Step-by-Step Setup
1. **Build Step**: The app will be built using `npm run build`.
2. **Deploy Step**: The `dist` folder will be uploaded to Firebase Hosting.
3. **Environment Variables**:
   - `VITE_FIREBASE_API_KEY` etc. will be stored securely in GitHub Secrets.
   - This ensures your API keys are never exposed in public code.

---

## 3. Scalability & Efficiency
As you reach "a few hundred users," the Google stack scales automatically:
- **Firestore**: Handles thousands of concurrent reads/writes without configuration.
- **Firebase Storage**: Automatically optimizes image delivery for profile pictures.
- **PWA Capabilities**: Users can "Add to Home Screen" on iOS/Android for a native app feel without paying Apple/Google store fees.

---

## 4. Maintenance & Monitoring
- **Firebase Analytics**: (Optional) Enable to see how many people are using the app and where they get stuck.
- **Sentry/LogRocket**: (Optional) For "one-click" debugging if a user reports an issue.

## Next Steps
1. ✅ **Renamed "Payments" to "Bills"** for better user mental mapping.
2. 🛠️ **Prepare GitHub Action**: I will create a `.github/workflows/deploy.yml` file to automate this.
3. 🛠️ **Verify Environment Config**: Ensure all Firebase keys are properly typed and ready for production.
