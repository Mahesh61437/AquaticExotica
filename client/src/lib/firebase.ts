import { initializeApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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
// Use the storage bucket from environment variables or create a default one
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
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized successfully");

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const storage = getStorage(app);

/**
 * Parse a Firebase Storage URL or path to get the file path
 * @param urlOrPath Firebase Storage URL or path
 * @returns The parsed file path
 */
export function parseFirebaseStoragePath(urlOrPath: string): string | null {
  try {
    // If it's already a path (not a URL), return it directly
    if (!urlOrPath.startsWith('http')) {
      return urlOrPath;
    }
    
    // If it's a Firebase Storage URL, extract the path
    if (urlOrPath.includes('firebasestorage.googleapis.com')) {
      const startPath = urlOrPath.indexOf('/o/') + 3;
      const endPath = urlOrPath.indexOf('?', startPath);
      const path = urlOrPath.substring(startPath, endPath !== -1 ? endPath : undefined);
      return decodeURIComponent(path);
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing Firebase Storage path:', error);
    return null;
  }
}

/**
 * Create a Firebase Storage URL with a custom access token
 * @param path Firebase Storage path
 * @param accessToken Custom access token
 * @returns The Firebase Storage URL with the access token
 */
export function createFirebaseStorageUrl(path: string, accessToken?: string): string {
  // Make sure path doesn't start with a slash
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Create the Firebase Storage URL
  let url = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(normalizedPath)}?alt=media`;
  
  // Add access token if provided
  if (accessToken) {
    url += `&token=${accessToken}`;
  }
  
  return url;
}

export default app;