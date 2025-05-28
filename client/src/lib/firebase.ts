import { initializeApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration for development
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCKNnGmzKQl39oq5s9tceHHagD7tZTQsms",
  authDomain: "aqua-india-61437.firebaseapp.com",
  projectId: "aqua-india-61437",
  storageBucket: "aqua-india-61437.firebasestorage.app",
  messagingSenderId: "562620265018",
  appId: "1:562620265018:web:805f156d3f2416dd15bb03"
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
  let url = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(normalizedPath)}?alt=media`;
  
  // Add access token if provided
  if (accessToken) {
    url += `&token=${accessToken}`;
  }
  
  return url;
}

export default app;