import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileUploadTaskAndState } from "@/hooks/service-hooks/file-upload/use-file-upload";
import { Loader2, Upload, X } from "lucide-react";

interface ImageUploadProps {
  label?: string;
  description?: string;
  currentImage?: string;
  uploadState: FileUploadTaskAndState;
  onImageRemove: () => void;
  onUploadStart?: () => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function ImageUpload({
  label = "Image",
  description,
  currentImage,
  uploadState,
  onImageRemove,
  onUploadStart,
  disabled = false,
  className = "",
  id = "image-upload",
}: ImageUploadProps) {
  const {
    isLoading: isUploading,
    uploadFile,
    error: uploadError,
    setError: setUploadError,
    uploadProgress,
  } = uploadState;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Clear current image and error states when starting new upload
      if (currentImage) {
        onImageRemove();
      }
      setUploadError(null);
      // Notify parent component that upload is starting
      onUploadStart?.();
      // Start the upload
      uploadFile(file);
    }
    // Clear the input value to allow re-uploading the same file
    event.target.value = "";
  };

  const isDisabled = disabled || isUploading;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label htmlFor={id}>{label}</Label>}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <div className="space-y-2">
        {currentImage && (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 transition-all duration-200">
            <div className="w-16 h-16 rounded-md overflow-hidden ring-2 ring-emerald-200 dark:ring-emerald-800">
              <img
                src={currentImage}
                alt="Uploaded image"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Currently uploaded image
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Ready to use
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onImageRemove}
              disabled={isDisabled}
              className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {!isUploading ? (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                isDisabled
                  ? "border-muted-foreground/10 cursor-not-allowed opacity-50"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10"
              }`}
            >
              <input
                id={id}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isDisabled}
                className="hidden"
              />
              <label
                htmlFor={id}
                className={`flex flex-col items-center gap-2 transition-colors duration-200 ${
                  isDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:text-primary"
                }`}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {currentImage
                    ? "Click to replace image"
                    : "Click to upload image"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB
                </p>
              </label>
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 dark:bg-primary/10 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">
                  Uploading... {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress value={uploadProgress} className="w-full h-2" />
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-destructive/10 dark:bg-destructive/10 border border-destructive/20 dark:border-destructive/30 rounded-md">
              <p className="text-sm text-destructive font-medium">
                Upload failed
              </p>
              <p className="text-sm text-destructive/90">
                {uploadError.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
