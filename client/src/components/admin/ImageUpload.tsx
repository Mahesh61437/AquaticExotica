import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      toast({
        title: "Upload failed",
        description: error.message,
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

    uploadImage(file, folder, onProgress, onError, onSuccess);
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
          <img 
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
        <div 
          className="bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center h-64 p-4"
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: "pointer" }}
        >
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
              <p className="text-sm text-muted-foreground text-center mb-2">
                Click to upload an image or drag and drop
              </p>
              <p className="text-xs text-muted-foreground text-center">
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