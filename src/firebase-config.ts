
import { initializeApp, FirebaseApp } from 'firebase/app';
// Fix: Corrected the import type from FirebaseDatabase to Database as defined in firebase.d.ts
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth'; // Changed FirebaseAuth to Auth

// Define the expected environment variables type
interface FirebaseEnv {
  FIREBASE_API_KEY?: string;
  FIREBASE_AUTH_DOMAIN?: string;
  FIREBASE_DATABASE_URL?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_STORAGE_BUCKET?: string;
  FIREBASE_MESSAGING_SENDER_ID?: string;
  FIREBASE_APP_ID?: string;
}

// Safely access process.env (or a fallback if process is not defined in some contexts)
// Assumes process.env will be populated by the Applet environment as per instructions.
// Fix: Added 'as unknown as FirebaseEnv' to satisfy TypeScript's strictness when assigning ProcessEnv to FirebaseEnv.
const env: FirebaseEnv = (typeof process !== 'undefined' && process.env ? process.env : {}) as unknown as FirebaseEnv;

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  databaseURL: env.FIREBASE_DATABASE_URL,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID
};

// Validate critical Firebase configuration values
if (!firebaseConfig.apiKey) {
  throw new Error("Firebase configuration error: 'FIREBASE_API_KEY' is missing in the environment variables.");
}
if (!firebaseConfig.projectId) {
  throw new Error("Firebase configuration error: 'FIREBASE_PROJECT_ID' is missing in the environment variables.");
}
if (!firebaseConfig.databaseURL) {
  throw new Error("Firebase configuration error: 'FIREBASE_DATABASE_URL' is missing in the environment variables. It's crucial for Realtime Database initialization.");
}

// Initialize Firebase
let app: FirebaseApp;
// Fix: Corrected the type from FirebaseDatabase to Database
let db: Database;
let auth: Auth; // Changed FirebaseAuth to Auth

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase initialization failed with config:", firebaseConfig);
  throw e; // Re-throw to prevent application from starting with broken Firebase
}

export { db, auth };