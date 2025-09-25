import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Organization, OrganizationData } from "@/core";
import { useOrganizationForm } from "@/hooks";
import { useOrganizationImageUpload } from "@/hooks/service-hooks/media/use-organization-image-upload";
import { useEffect } from "react";

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

  const uploadState = useOrganizationImageUpload();
  const {
    isLoading: isUploading,
    url,
    isComplete: isUploadComplete,
  } = uploadState;

  const currency = watch("currency");
  const timezone = watch("settings.timezone");
  const currentImage = watch("image");

  // Update form when image upload completes
  useEffect(() => {
    if (isUploadComplete && url) {
      setValue("image", url);
    }
  }, [isUploadComplete, url, setValue]);

  const handleImageRemove = () => {
    setValue("image", "");
    uploadState.setError(null);
  };
  
  const handleUploadStart = () => {
    // Clear any previous errors when starting a new upload
    // The upload hook will handle clearing the current image
    uploadState.setError(null);
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

      <ImageUpload
        label="Organization Logo (Optional)"
        currentImage={currentImage}
        uploadState={uploadState}
        onImageRemove={handleImageRemove}
        onUploadStart={handleUploadStart}
        disabled={isLoading}
        id="image"
      />

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
