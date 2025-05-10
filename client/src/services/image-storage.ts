import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import app from "@/lib/firebase";

// Initialize Firebase Storage
const storage = getStorage(app);

/**
 * Type definitions for image upload
 */
export interface UploadProgressCallback {
  (progress: number): void;
}

export interface UploadErrorCallback {
  (error: Error): void;
}

export interface UploadSuccessCallback {
  (url: string): void;
}

/**
 * Upload an image to Firebase Storage
 * @param file The file to upload
 * @param path The storage path to save the file at (e.g., 'products')
 * @param onProgress Progress callback (0-100)
 * @param onError Error callback
 * @param onSuccess Success callback with download URL
 */
export function uploadImage(
  file: File,
  path: string = 'products',
  onProgress?: UploadProgressCallback,
  onError?: UploadErrorCallback,
  onSuccess?: UploadSuccessCallback
): void {
  // Create a unique file name to prevent collision
  const fileExtension = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
  const fullPath = `${path}/${fileName}`;
  
  // Create a storage reference
  const storageRef = ref(storage, fullPath);
  
  // Upload the file
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  // Monitor the upload progress
  uploadTask.on(
    'state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      if (onProgress) onProgress(progress);
    },
    (error) => {
      if (onError) onError(error);
    },
    async () => {
      try {
        // Get the download URL
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        if (onSuccess) onSuccess(downloadURL);
      } catch (error) {
        if (onError) onError(error as Error);
      }
    }
  );
}

/**
 * Delete an image from Firebase Storage
 * @param url Full URL of the image to delete
 * @returns Promise that resolves when the image is deleted
 */
export async function deleteImage(url: string | undefined): Promise<void> {
  try {
    // If no URL provided, just return
    if (!url) {
      return;
    }
    
    // Extract the path from the URL
    // Firebase Storage URLs follow this pattern:
    // https://firebasestorage.googleapis.com/v0/b/[PROJECT_ID].appspot.com/o/[PATH]?alt=media&token=[TOKEN]
    const baseUrl = "https://firebasestorage.googleapis.com/v0/b/";
    const projectId = app.options.projectId;
    
    if (!url.includes(baseUrl) || !url.includes(projectId)) {
      throw new Error('Invalid Firebase Storage URL');
    }
    
    const startPath = url.indexOf('/o/') + 3;
    const endPath = url.indexOf('?', startPath);
    let path = url.substring(startPath, endPath !== -1 ? endPath : undefined);
    
    // Decode URI components in the path
    path = decodeURIComponent(path);
    
    // Create a reference to the file
    const imageRef = ref(storage, path);
    
    // Delete the file
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Get a Firebase Storage reference from a URL
 * @param url The download URL of the file
 * @returns A Firebase Storage reference or null if URL is invalid
 */
export function getStorageRefFromUrl(url: string | undefined): ReturnType<typeof ref> | null {
  try {
    // If no URL provided, return null
    if (!url) {
      return null;
    }
    
    // Extract the path from the URL
    const baseUrl = "https://firebasestorage.googleapis.com/v0/b/";
    const projectId = app.options.projectId;
    
    if (!url.includes(baseUrl) || !url.includes(projectId)) {
      return null;
    }
    
    const startPath = url.indexOf('/o/') + 3;
    const endPath = url.indexOf('?', startPath);
    let path = url.substring(startPath, endPath !== -1 ? endPath : undefined);
    
    // Decode URI components in the path
    path = decodeURIComponent(path);
    
    // Return a reference to the file
    return ref(storage, path);
  } catch (error) {
    console.error('Error getting storage reference:', error);
    return null;
  }
}

/**
 * Get the image URL from a path or return the URL if it's already a URL
 * @param pathOrUrl Storage path or URL
 * @returns Promise that resolves to a download URL
 */
export async function getImageUrl(pathOrUrl: string | undefined): Promise<string> {
  // If no path or URL provided, return empty string
  if (!pathOrUrl) {
    return '';
  }
  
  // If it's already a URL (starts with http/https), return it
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  
  // Otherwise, get the download URL
  try {
    const imageRef = ref(storage, pathOrUrl);
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error('Error getting image URL:', error);
    throw error;
  }
}