"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { LocaleEditor } from "@/components/ui/locale-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Service, OWNER_TYPE } from "@/core";
import { useCreateService, useUpdateService } from "@/hooks";
import { useServiceForm } from "@/hooks";
import { useServiceImageUpload } from "@/hooks/service-hooks/media/use-service-image-upload";
import { useNextServiceOrder } from "@/hooks/service-hooks/service/use-next-service-order";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { Save, X } from "lucide-react";
import { useUserStore } from "@/stores";
import { useEffect } from "react";

interface ServiceFormProps {
  service?: Service;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ServiceForm({ service, onSuccess, onCancel }: ServiceFormProps) {
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const currentOrganizationId = useCurrentOrganizationId();
  const {user} = useUserStore()
  
  const uploadState = useServiceImageUpload();
  const {
    url,
    isComplete: isUploadComplete,
  } = uploadState;

  const { nextOrder } = useNextServiceOrder();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useServiceForm({
    service,
    onSubmit: async (data) => {
      try {
        if (!currentOrganizationId) {
          throw new Error("No organization selected");
        }
        
        if (!user) {
          throw new Error("User not authenticated");
        }

        if (service) {
          // Update existing service - preserve existing order
          await updateServiceMutation.mutateAsync({
            id: service.id,
            data: {
              ...data,
              organizationId: currentOrganizationId,
              ownerId: user.id,
              order: service.order, // Preserve existing order
            },
            organizationId: currentOrganizationId,
          });
        } else {
          // Create new service - assign next order
          await createServiceMutation.mutateAsync({
            data: {
              ...data,
              organizationId: currentOrganizationId,
              ownerId: user.id,
              order: nextOrder, // Auto-assign next order
            },
            organizationId: currentOrganizationId,
          });
        }
        
        onSuccess();
      } catch (error) {
        console.error("Failed to save service:", error);
        // You can add toast notifications here if needed
      }
    },
  });
  
  const currentImage = watch("image");
  const localisation = watch("localisation");

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
    uploadState.setError(null);
  };
  
  if (!user) {
    return null;
  }

  const ownerType = watch("ownerType");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="border-none">
        <CardHeader>
          <CardTitle className="text-lg font-sans">Service Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter service name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                {...register("duration", { valueAsNumber: true })}
                placeholder="60"
              />
              {errors.duration && (
                <p className="text-sm text-red-500">{errors.duration.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerType">Owner Type</Label>
              <Select
                value={ownerType}
                onValueChange={(value) => setValue("ownerType", value as OWNER_TYPE)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OWNER_TYPE.ORGANIZATION}>Organization</SelectItem>
                  <SelectItem value={OWNER_TYPE.MEMBER}>Member</SelectItem>
                </SelectContent>
              </Select>
              {errors.ownerType && (
                <p className="text-sm text-red-500">{errors.ownerType.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter service description..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <ImageUpload
            label="Service Image (Optional)"
            currentImage={currentImage}
            uploadState={uploadState}
            onImageRemove={handleImageRemove}
            onUploadStart={handleUploadStart}
            disabled={isSubmitting}
            id="service-image"
          />
        </CardContent>
      </Card>

      {/* Translations */}
      <LocaleEditor
        value={localisation}
        onChange={(value) => setValue("localisation", value)}
        disabled={isSubmitting}
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Saving..." : service ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </form>
  );
}