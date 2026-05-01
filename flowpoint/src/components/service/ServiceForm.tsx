"use client";

import { FREE_LIMITS, PLANS } from "@/billing/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocaleEditor } from "@/components/ui/locale-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { OWNER_TYPE, Service } from "@/core";
import { useCreateService, useServiceForm, useUpdateService } from "@/hooks";
import { useServiceImageUpload } from "@/hooks/service-hooks/media/use-service-image-upload";
import { useNextServiceOrder } from "@/hooks/service-hooks/service/use-next-service-order";
import { useServices } from "@/hooks/repository-hooks/service/use-service";
import { useUserStore } from "@/stores";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { useAuth } from "@clerk/clerk-react";
import { Save, X } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface ServiceFormProps {
  service?: Service;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ServiceForm({
  service,
  onSuccess,
  onCancel,
}: ServiceFormProps) {
  const { t } = useTranslation();
  const { isLoaded, orgId, has } = useAuth();
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const currentOrganizationId = useCurrentOrganizationId();
  const { user } = useUserStore();

  const uploadState = useServiceImageUpload();
  const { url, isComplete: isUploadComplete } = uploadState;

  const { nextOrder } = useNextServiceOrder();
  const { data: servicesData } = useServices({
    pagination: { limit: 1000 },
  });
  const isFreePlan =
    !!orgId && (isLoaded ? has({ plan: PLANS.freeOrg }) : false);
  const currentServicesCount = servicesData?.pages.flatMap((page) => page).length ?? 0;
  const allServices = servicesData?.pages.flatMap((page) => page) ?? [];

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
              ownerId: user.id,
              order: service.order, // Preserve existing order
            },
            organizationId: currentOrganizationId,
          });
        } else {
          if (isFreePlan && currentServicesCount >= FREE_LIMITS.services) {
            toast.error(t("services.freeLimitReached"));
            return;
          }

          // Create new service - assign next order
          await createServiceMutation.mutateAsync({
            data: {
              ...data,
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
  const isAddOn = watch("isAddOn") || false;
  const compatibleWithServiceIds = watch("compatibleWithServiceIds") || [];
  const suggestedWithServiceIds = watch("suggestedWithServiceIds") || [];
  const selectablePrimaryServices = allServices.filter(
    (item) => item.id !== service?.id && !item.isAddOn,
  );
  const selectableAddOnServices = allServices.filter(
    (item) => item.id !== service?.id && item.isAddOn,
  );

  const toggleServiceId = (payload: {
    fieldName: "compatibleWithServiceIds" | "suggestedWithServiceIds";
    serviceId: string;
    checked: boolean;
  }) => {
    const currentValues =
      payload.fieldName === "compatibleWithServiceIds"
        ? compatibleWithServiceIds
        : suggestedWithServiceIds;

    setValue(
      payload.fieldName,
      payload.checked
        ? Array.from(new Set([...currentValues, payload.serviceId]))
        : currentValues.filter((id) => id !== payload.serviceId),
      { shouldDirty: true, shouldValidate: true },
    );
  };

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
          <CardTitle className="text-lg font-sans">
            {t("services.form.serviceInformation")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("services.form.serviceName")} *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder={t("services.form.namePlaceholder")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t("services.form.price")} *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                placeholder={t("services.form.pricePlaceholder")}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">{t("services.form.duration")} *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                {...register("duration", { valueAsNumber: true })}
                placeholder={t("services.form.durationPlaceholder")}
              />
              {errors.duration && (
                <p className="text-sm text-red-500">
                  {errors.duration.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerType">{t("services.form.ownerType")}</Label>
              <Select
                value={ownerType}
                onValueChange={(value) =>
                  setValue("ownerType", value as OWNER_TYPE)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("services.form.ownerType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OWNER_TYPE.ORGANIZATION}>
                    {t("services.organization")}
                  </SelectItem>
                  <SelectItem value={OWNER_TYPE.MEMBER}>{t("services.member")}</SelectItem>
                </SelectContent>
              </Select>
              {errors.ownerType && (
                <p className="text-sm text-red-500">
                  {errors.ownerType.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("services.form.description")}</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t("services.form.descriptionPlaceholder")}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <ImageUpload
            label={t("services.form.image")}
            currentImage={currentImage}
            uploadState={uploadState}
            onImageRemove={handleImageRemove}
            onUploadStart={handleUploadStart}
            disabled={isSubmitting}
            id="service-image"
          />
        </CardContent>
      </Card>

      <Card className="border-none">
        <CardHeader>
          <CardTitle className="text-lg font-sans">Upsells</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-1">
              <Label>Add-on service</Label>
              <p className="text-sm text-muted-foreground">
                Show this service as an optional upgrade during booking.
              </p>
            </div>
            <Switch
              checked={isAddOn}
              onCheckedChange={(checked) => {
                setValue("isAddOn", checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                if (!checked) {
                  setValue("compatibleWithServiceIds", [], {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
              disabled={isSubmitting}
            />
          </div>

          {isAddOn && (
            <div className="space-y-3">
              <Label>Compatible services</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {selectablePrimaryServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add a primary service first.
                  </p>
                ) : (
                  selectablePrimaryServices.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                    >
                      <Checkbox
                        checked={compatibleWithServiceIds.includes(item.id)}
                        onCheckedChange={(checked) =>
                          toggleServiceId({
                            fieldName: "compatibleWithServiceIds",
                            serviceId: item.id,
                            checked: checked === true,
                          })
                        }
                        disabled={isSubmitting}
                      />
                      <span>{item.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {!isAddOn && selectableAddOnServices.length > 0 && (
            <div className="space-y-3">
              <Label>Suggested add-ons</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {selectableAddOnServices.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                  >
                    <Checkbox
                      checked={suggestedWithServiceIds.includes(item.id)}
                      onCheckedChange={(checked) =>
                        toggleServiceId({
                          fieldName: "suggestedWithServiceIds",
                          serviceId: item.id,
                          checked: checked === true,
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <span>{item.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
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
            {t("services.form.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting
            ? t("services.form.saving")
            : service
              ? t("services.edit")
              : t("services.addNew")}
        </Button>
      </div>
    </form>
  );
}
