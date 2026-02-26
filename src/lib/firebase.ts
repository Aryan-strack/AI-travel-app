import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: Use client config only. Do NOT include Admin private keys here.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDmtlreTxuctbaaif8LrLHtTqf0FkKNyYM",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "smarttravelplaner.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "smarttravelplaner",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "smarttravelplaner.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "160292458317",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:160292458317:web:your-app-id",
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

// Ensure auth state persists across app restarts in React Native
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;


