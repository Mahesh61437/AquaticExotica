# Firebase Storage Integration Guide

This guide explains how to use Firebase Storage for storing product images and other assets in the AquaticExotica e-commerce platform.

## Setup

1. Make sure Firebase is properly configured in the app with the following environment variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

2. Add Firebase Storage bucket rules that allow authenticated users to read and write:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allImages=**} {
      // Only logged-in admin users can write to products directory
      allow write: if request.auth != null && request.auth.token.admin == true;
      // Anyone can read product images
      allow read: if true;
    }
    
    match /categories/{allImages=**} {
      // Only logged-in admin users can write to categories directory
      allow write: if request.auth != null && request.auth.token.admin == true;
      // Anyone can read category images
      allow read: if true;
    }
    
    match /banners/{allImages=**} {
      // Only logged-in admin users can write to banners directory
      allow write: if request.auth != null && request.auth.token.admin == true;
      // Anyone can read banner images
      allow read: if true;
    }
  }
}
```

## Usage

### Uploading Images in Product Management

1. Use the `ImageUpload` component in product or category creation/edit forms:

```tsx
import { ImageUpload } from "@/components/admin/ImageUpload";

function ProductForm() {
  const [productData, setProductData] = useState({
    // other product fields
    imageUrl: "",
  });

  const handleImageUploaded = (url: string) => {
    setProductData({
      ...productData,
      imageUrl: url,
    });
  };

  const handleImageRemoved = () => {
    setProductData({
      ...productData,
      imageUrl: "",
    });
  };

  return (
    <form>
      {/* Other form fields */}
      
      <ImageUpload
        initialImage={productData.imageUrl}
        onImageUploaded={handleImageUploaded}
        onImageRemoved={handleImageRemoved}
        folder="products"
      />
      
      {/* Submit button, etc. */}
    </form>
  );
}
```

### Displaying Images

To display images, simply use the URL stored in the database:

```tsx
<img 
  src={product.imageUrl} 
  alt={product.name} 
  className="w-full h-64 object-cover"
/>
```

### Image URLs in the Database

When saving products or categories, store the complete image URL in the database. The image service handles all the complexities of Firebase Storage paths and URLs.

## Folders Structure

Organize your images into these folders:

- `/products/` - For all product images
- `/categories/` - For category images
- `/banners/` - For homepage banners and promotional images

## Important Notes

1. The Firebase Storage integration securely generates URLs with tokens
2. Images uploaded are automatically given unique names to prevent collisions
3. Remember to handle error states and show placeholders when images fail to load
4. Image uploads are restricted to 5MB maximum size