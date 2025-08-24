import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const { handleSubmit, register, setValue, watch, formState } = useOrganizationForm({
    organization,
    onSubmit,
  });

  const { 
    isLoading: isUploading, 
    uploadFile, 
    url, 
    error: uploadError, 
    isComplete: isUploadComplete, 
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
      uploadFile(file);
    }
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
          <p className="text-sm text-red-500">{formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Organization Logo</Label>
        <div className="space-y-2">
          {currentImage && (
            <div className="flex items-center space-x-2">
              <img 
                src={currentImage} 
                alt="Organization logo" 
                className="w-16 h-16 object-cover rounded-md border"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue("image", "")}
                disabled={isLoading || isUploading}
              >
                Remove
              </Button>
            </div>
          )}
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isLoading || isUploading}
          />
          {isUploading && (
            <p className="text-sm text-blue-500">Uploading image...</p>
          )}
          {uploadError && (
            <p className="text-sm text-red-500">Upload failed: {uploadError.message}</p>
          )}
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
          <p className="text-sm text-red-500">{formState.errors.industry.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={currency}
          onValueChange={(value) => setValue("currency", value)}
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
          <p className="text-sm text-red-500">{formState.errors.currency.message}</p>
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
            <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
            <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
          </SelectContent>
        </Select>
        {formState.errors.settings?.timezone && (
          <p className="text-sm text-red-500">{formState.errors.settings.timezone.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !formState.isValid}>
          {isLoading ? "Saving..." : organization ? "Update" : "Create"} Organization
        </Button>
      </div>
    </form>
  );
}