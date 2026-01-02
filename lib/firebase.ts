// Firebase Client SDK configuration
// 
// SETUP INSTRUCTIONS:
// 1. Get your Firebase config from Firebase Console:
//    - Go to Project Settings > General > Your apps
//    - Add a web app or use existing web app config
// 2. Set these environment variables in your .env file or Expo config:
//    - EXPO_PUBLIC_FIREBASE_API_KEY
//    - EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
//    - EXPO_PUBLIC_FIREBASE_PROJECT_ID
//    - EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
//    - EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
//    - EXPO_PUBLIC_FIREBASE_APP_ID
// 3. Enable Phone Authentication in Firebase Console:
//    - Go to Authentication > Sign-in method > Phone
//    - Enable Phone sign-in provider
// 4. For React Native/Expo, ensure you have proper native configuration
//    - Phone auth may require additional setup for reCAPTCHA
//    - Consider using @react-native-firebase/auth for better React Native support
//
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration
// These should be set in your Firebase Console and environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'vitura',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

try {
  // Check if Firebase config is valid
  const isConfigValid = firebaseConfig.apiKey && 
                       firebaseConfig.projectId && 
                       firebaseConfig.appId;

  if (!isConfigValid) {
    console.warn('Firebase configuration is incomplete. Please set EXPO_PUBLIC_FIREBASE_* environment variables.');
  } else {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      
      // Initialize Auth with AsyncStorage persistence for React Native
      if (Platform.OS === 'web') {
        auth = getAuth(app);
      } else {
        try {
          auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
          });
        } catch (error) {
          // If initializeAuth fails (e.g., already initialized), use getAuth
          console.warn('initializeAuth failed, using getAuth:', error);
          auth = getAuth(app);
        }
      }
    } else {
      app = getApps()[0];
      auth = getAuth(app);
    }
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Don't throw - allow app to continue but auth will be undefined
}

// Export with null checks
export { app, auth };
export default app;

// Helper function to check if Firebase is initialized
export const isFirebaseInitialized = (): boolean => {
  return auth !== undefined && app !== undefined;
};

