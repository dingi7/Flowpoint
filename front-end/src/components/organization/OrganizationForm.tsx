import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Organization, OrganizationData } from "@/core";
import { useOrganizationForm } from "@/hooks/forms/use-organization-form";
import { useOrganizationImageUpload } from "@/hooks/service-hooks/media/use-organization-image-upload";
import { useEffect } from "react";
import { Loader2, Upload, X } from "lucide-react";

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: OrganizationData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function OrganizationForm({
  organization,
  onSubmit,
  onCancel,
  isLoading = false,
}: OrganizationFormProps) {
  const { handleSubmit, register, setValue, watch, formState } =
    useOrganizationForm({
      organization,
      onSubmit,
    });

  const {
    isLoading: isUploading,
    uploadFile,
    url,
    error: uploadError,
    isComplete: isUploadComplete,
    uploadProgress,
  } = useOrganizationImageUpload();

  const currency = watch("currency");
  const timezone = watch("settings.timezone");
  const currentImage = watch("image");

  // Update form when image upload completes
  useEffect(() => {
    if (isUploadComplete && url) {
      setValue("image", url);
    }
  }, [isUploadComplete, url, setValue]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Clear any previous errors
      uploadFile(file);
    }
    // Clear the input value to allow re-uploading the same file
    event.target.value = '';
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Organization Name</Label>
        <Input
          id="name"
          placeholder="Enter organization name"
          {...register("name")}
          disabled={isLoading}
        />
        {formState.errors.name && (
          <p className="text-sm text-red-500">
            {formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Organization Logo (Optional)</Label>
        <div className="space-y-2">
          {currentImage && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200 transition-all duration-200">
              <div className="w-16 h-16 rounded-md overflow-hidden ring-2 ring-green-200">
                <img
                  src={currentImage}
                  alt="Organization logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700">Logo uploaded successfully</p>
                <p className="text-xs text-green-600">Ready to use</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue("image", "")}
                disabled={isLoading || isUploading}
                className="hover:bg-red-100 hover:text-red-600 hover:border-red-300 transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          )}
          <div className="space-y-2">
            {!isUploading ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isLoading || isUploading}
                  className="hidden"
                />
                <label
                  htmlFor="image"
                  className={`cursor-pointer flex flex-col items-center gap-2 transition-colors duration-200 ${
                    isLoading || isUploading 
                      ? 'cursor-not-allowed opacity-50' 
                      : 'hover:text-blue-600'
                  }`}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload organization logo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-600">
                    Uploading... {Math.round(uploadProgress)}%
                  </span>
                </div>
                <Progress 
                  value={uploadProgress} 
                  className="w-full h-2"
                />
              </div>
            )}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 font-medium">Upload failed</p>
                <p className="text-sm text-red-500">{uploadError.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Input
          id="industry"
          placeholder="Enter industry (optional)"
          {...register("industry")}
          disabled={isLoading}
        />
        {formState.errors.industry && (
          <p className="text-sm text-red-500">
            {formState.errors.industry.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={currency}
          onValueChange={(value) =>
            setValue("currency", value as "EUR" | "USD" | "GBP" | "CAD" | "AUD")
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EUR">EUR (€)</SelectItem>
            <SelectItem value="USD">USD ($)</SelectItem>
            <SelectItem value="GBP">GBP (£)</SelectItem>
            <SelectItem value="CAD">CAD (C$)</SelectItem>
            <SelectItem value="AUD">AUD (A$)</SelectItem>
          </SelectContent>
        </Select>
        {formState.errors.currency && (
          <p className="text-sm text-red-500">
            {formState.errors.currency.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select
          value={timezone}
          onValueChange={(value) => setValue("settings.timezone", value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="Europe/London">Europe/London</SelectItem>
            <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
            <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
            <SelectItem value="America/New_York">America/New_York</SelectItem>
            <SelectItem value="America/Los_Angeles">
              America/Los_Angeles
            </SelectItem>
            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
            <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
          </SelectContent>
        </Select>
        {formState.errors.settings?.timezone && (
          <p className="text-sm text-red-500">
            {formState.errors.settings.timezone.message}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || isUploading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !formState.isValid || isUploading}>
          {isLoading ? (
            "Saving..."
          ) : isUploading ? (
            "Uploading image..."
          ) : (
            `${organization ? "Update" : "Create"} Organization`
          )}
        </Button>
      </div>
    </form>
  );
}
