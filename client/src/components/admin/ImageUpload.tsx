import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ImageWithFallback } from "@/components/ui/image";
import { 
  uploadImage, 
  UploadProgressCallback, 
  UploadErrorCallback, 
  UploadSuccessCallback 
} from "@/services/image-storage";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  initialImage?: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  folder?: string;
  className?: string;
}

export function ImageUpload({
  initialImage,
  onImageUploaded,
  onImageRemoved,
  folder = "products",
  className = "",
}: ImageUploadProps) {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImage);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add a skip upload button that directly sets a placeholder
  const handleSkipUpload = () => {
    const placeholderUrl = `https://placehold.co/600x800/e6e6e6/999999?text=${folder.charAt(0).toUpperCase() + folder.slice(1, -1)}`;
    setImageUrl(placeholderUrl);
    onImageUploaded(placeholderUrl);
    toast({
      title: "Using placeholder image",
      description: "You can continue with the form."
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear any previous errors
    setUploadError(null);

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Upload the image
    setUploading(true);
    setProgress(0);

    const onProgress: UploadProgressCallback = (progress) => {
      setProgress(progress);
    };

    const onError: UploadErrorCallback = (error) => {
      setUploading(false);
      console.error("Upload error:", error);
      
      // Set error message for display
      setUploadError(error.message || "Unknown error");
      
      toast({
        title: "Upload failed",
        description: "Please try again or use a placeholder image instead.",
        variant: "destructive",
      });
    };

    const onSuccess: UploadSuccessCallback = (url) => {
      setUploading(false);
      setImageUrl(url);
      onImageUploaded(url);
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      });
    };

    try {
      uploadImage(file, folder, onProgress, onError, onSuccess);
    } catch (error) {
      // Fallback if upload fails completely
      console.error("Upload exception:", error);
      setUploading(false);
      
      // Set error message for display
      setUploadError(error instanceof Error ? error.message : "Unknown error");
      
      toast({
        title: "Upload failed",
        description: "Please try again or use a placeholder image instead.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(undefined);
    if (onImageRemoved) {
      onImageRemoved();
    }
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`border rounded-md overflow-hidden ${className}`}>
      {imageUrl ? (
        <div className="relative">
          <ImageWithFallback 
            src={imageUrl} 
            alt="Uploaded image" 
            className="w-full h-64 object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center h-64 p-4">
          {uploading ? (
            <div className="w-full space-y-4">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">
                  Uploading image... {Math.round(progress)}%
                </p>
              </div>
              <Progress value={progress} />
            </div>
          ) : (
            <>
              <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
              
              {uploadError ? (
                <div className="text-red-500 text-sm mb-4 text-center">
                  <p>Upload failed: {uploadError}</p>
                </div>
              ) : null}
              
              <div className="flex flex-col space-y-3">
                <Button 
                  variant="secondary" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select image
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleSkipUpload}
                  className="w-full"
                >
                  Use placeholder
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center mt-3">
                PNG, JPG, GIF up to 5MB
              </p>
            </>
          )}
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}