import { initializeApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

// Check required environment variables
const requiredVars = [
  'VITE_FIREBASE_API_KEY', 
  'VITE_FIREBASE_PROJECT_ID', 
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
  console.error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
}

// Use fallbacks for optional values if needed
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string || 
                   (projectId ? `${projectId}.firebaseapp.com` : '');
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string || 
                      (projectId ? `${projectId}.appspot.com` : '');

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw new Error("Failed to initialize Firebase");
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;