"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Service, OWNER_TYPE } from "@/core";
import { useCreateService, useUpdateService } from "@/hooks";
import { useServiceForm } from "@/hooks/forms/use-service-form";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { Save, X } from "lucide-react";

interface ServiceFormProps {
  service?: Service;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ServiceForm({ service, onSuccess, onCancel }: ServiceFormProps) {
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const currentOrganizationId = useCurrentOrganizationId();
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

        if (service) {
          // Update existing service
          await updateServiceMutation.mutateAsync({
            id: service.id,
            data: {
              ...data,
              organizationId: currentOrganizationId,
            },
            organizationId: currentOrganizationId,
          });
        } else {
          // Create new service
          await createServiceMutation.mutateAsync({
            data: {
              ...data,
              organizationId: currentOrganizationId,
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

  const ownerType = watch("ownerType");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
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
        </CardContent>
      </Card>

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