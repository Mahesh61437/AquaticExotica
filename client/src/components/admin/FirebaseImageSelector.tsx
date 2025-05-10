import { useState } from "react";
import { createFirebaseStorageUrl } from "@/lib/firebase";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, ImageIcon } from "lucide-react";

interface FirebaseImageSelectorProps {
  onImageSelected: (url: string) => void;
  initialImage?: string;
  className?: string;
}

export function FirebaseImageSelector({
  onImageSelected,
  initialImage = "",
  className = "",
}: FirebaseImageSelectorProps) {
  const { toast } = useToast();
  const [imagePath, setImagePath] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(initialImage);
  const [errorLoading, setErrorLoading] = useState(false);

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImagePath(e.target.value);
    setErrorLoading(false);
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessToken(e.target.value);
    setErrorLoading(false);
  };

  const handleLoadImage = () => {
    if (!imagePath) {
      toast({
        title: "Error",
        description: "Please enter a Firebase Storage path",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setErrorLoading(false);
    
    try {
      // Create the Firebase Storage URL
      const url = createFirebaseStorageUrl(imagePath, accessToken);
      
      // Test the image URL by creating an Image object
      const img = new Image();
      
      img.onload = () => {
        setPreviewUrl(url);
        onImageSelected(url);
        setLoading(false);
        toast({
          title: "Success",
          description: "Image loaded successfully",
        });
      };
      
      img.onerror = () => {
        setLoading(false);
        setErrorLoading(true);
        toast({
          title: "Error",
          description: "Failed to load image. Check the path and access token",
          variant: "destructive",
        });
      };
      
      // Set the source to trigger loading
      img.src = url;
    } catch (error) {
      setLoading(false);
      setErrorLoading(true);
      toast({
        title: "Error",
        description: "Invalid Firebase Storage path",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="firebasePath">Firebase Storage Path</Label>
        <div className="flex gap-2">
          <Input
            id="firebasePath"
            placeholder="products/my-image.jpg"
            value={imagePath}
            onChange={handlePathChange}
            className={errorLoading ? "border-red-500" : ""}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Enter the path to your image in Firebase Storage (e.g., products/image.jpg)
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="accessToken">Access Token (Optional)</Label>
        <Input
          id="accessToken"
          placeholder="Firebase Access Token"
          value={accessToken}
          onChange={handleTokenChange}
          className={errorLoading ? "border-red-500" : ""}
        />
        <p className="text-xs text-muted-foreground">
          If your storage requires authentication, enter the access token
        </p>
      </div>
      
      <Button 
        type="button" 
        onClick={handleLoadImage}
        disabled={loading || !imagePath}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <ImageIcon className="mr-2 h-4 w-4" />
            Load Image
          </>
        )}
      </Button>
      
      {previewUrl && (
        <div className="mt-4">
          <div className="border rounded-md overflow-hidden">
            <div className="aspect-square relative bg-muted">
              <img
                src={previewUrl}
                alt="Preview"
                className="object-contain w-full h-full"
                onError={() => setErrorLoading(true)}
              />
              {!errorLoading && (
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}