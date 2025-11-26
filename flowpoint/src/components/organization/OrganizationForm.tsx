import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CUSTOMER_FIELD_TYPE,
  DAY_OF_WEEK,
  Organization,
  OrganizationData,
} from "@/core";
import { useOrganizationForm } from "@/hooks";
import { useOrganizationImageUpload } from "@/hooks/service-hooks/media/use-organization-image-upload";
import {
  convertLocalTimeStringToUtc,
  convertWorkingHoursToLocal,
} from "@/utils/date-time";
import { Bell, Clock, MapPin, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateFormError } from "@/utils/translate-form-errors";

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
  const { t } = useTranslation();
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
  const currentImage = watch("image");
  const workingDays = watch("settings.workingDays") || [];
  const workingHours = watch("settings.workingHours") || {
    start: "09:00",
    end: "17:00",
  };
  const emailNotifications = watch("settings.emailNotifications") ?? true;
  const smsNotifications = watch("settings.smsNotifications") ?? false;

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

  const [customerFields, setCustomerFields] = useState(
    organization?.settings?.customerFields || [],
  );

  // Update local state when organization changes
  useEffect(() => {
    if (organization) {
      setCustomerFields(organization.settings?.customerFields || []);
    }
  }, [organization]);

  // Local state for working hours to ensure proper input control
  const [localStartTime, setLocalStartTime] = useState("09:00");
  const [localEndTime, setLocalEndTime] = useState("17:00");

  const addCustomerField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      name: "",
      type: CUSTOMER_FIELD_TYPE.TEXT,
      isRequired: false,
      placeholder: "",
      options: [],
    };
    setCustomerFields([...customerFields, newField]);
  };

  const updateCustomerField = (index: number, field: any) => {
    const updated = [...customerFields];
    updated[index] = field;
    setCustomerFields(updated);
  };

  const removeCustomerField = (index: number) => {
    setCustomerFields(customerFields.filter((_, i) => i !== index));
  };

  // Update form when customer fields change
  useEffect(() => {
    setValue("settings.customerFields", customerFields);
  }, [customerFields, setValue]);

  // Ensure timezone is always set to UTC
  useEffect(() => {
    setValue("settings.timezone", "UTC");
  }, [setValue]);

  // Initialize local times when working hours change
  useEffect(() => {
    if (workingHours && workingHours.start && workingHours.end) {
      const localTimes = convertWorkingHoursToLocal(
        workingHours as { start: string; end: string },
        "UTC",
      );
      setLocalStartTime(localTimes.start);
      setLocalEndTime(localTimes.end);
    }
  }, [workingHours]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("organization.form.basicInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t("organization.form.organizationName")} *</Label>
            <Input
              id="name"
              placeholder={t("organization.form.organizationNamePlaceholder")}
              {...register("name")}
              disabled={isLoading}
            />
            {formState.errors.name && (
              <p className="text-sm text-red-500">
                {translateFormError(formState.errors.name.message, t)}
              </p>
            )}
          </div>

          <ImageUpload
            label={t("organization.form.organizationLogo")}
            currentImage={currentImage}
            uploadState={uploadState}
            onImageRemove={handleImageRemove}
            onUploadStart={handleUploadStart}
            disabled={isLoading}
            id="image"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">{t("organization.form.industry")}</Label>
              <Input
                id="industry"
                placeholder={t("organization.form.industryPlaceholder")}
                {...register("industry")}
                disabled={isLoading}
              />
              {formState.errors.industry && (
                <p className="text-sm text-red-500">
                  {translateFormError(formState.errors.industry.message, t)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t("organization.form.currency")}</Label>
              <Select
                value={currency}
                onValueChange={(value) =>
                  setValue(
                    "currency",
                    value as "EUR" | "USD" | "GBP" | "CAD" | "AUD",
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("organization.form.selectCurrency")} />
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
                  {translateFormError(formState.errors.currency.message, t)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t("organization.form.contactInformation")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">{t("organization.form.address")}</Label>
            <Textarea
              id="address"
              placeholder={t("organization.form.addressPlaceholder")}
              {...register("settings.contactInfo.address")}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("organization.form.phone")}</Label>
              <Input
                id="phone"
                placeholder={t("organization.form.phonePlaceholder")}
                {...register("settings.contactInfo.phone")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("organization.form.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("organization.form.emailPlaceholder")}
                {...register("settings.contactInfo.email")}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleMapsUrl">{t("organization.form.googleMapsUrl")}</Label>
            <Input
              id="googleMapsUrl"
              type="url"
              placeholder={t("organization.form.googleMapsUrlPlaceholder")}
              {...register("settings.contactInfo.googleMapsUrl")}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Working Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("organization.form.workingHours")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="timezone">{t("organization.form.timezone")}</Label>
            <Select value="UTC" disabled={true}>
              <SelectTrigger>
                <SelectValue placeholder={t("organization.form.selectTimezone")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">
                  UTC (All organizations use UTC)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("organization.form.timezoneDescription")}
            </p>
            {formState.errors.settings?.timezone && (
              <p className="text-sm text-red-500">
                {translateFormError(formState.errors.settings.timezone.message, t)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workingHoursStart">{t("organization.form.workingHoursStart")}</Label>
              <Input
                id="workingHoursStart"
                type="time"
                value={localStartTime}
                onChange={(e) => {
                  setLocalStartTime(e.target.value);
                  // Convert local time back to UTC for storage
                  const utcTime = convertLocalTimeStringToUtc(e.target.value);
                  setValue("settings.workingHours.start", utcTime);
                }}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {t("organization.form.workingHoursStartDescription")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workingHoursEnd">{t("organization.form.workingHoursEnd")}</Label>
              <Input
                id="workingHoursEnd"
                type="time"
                value={localEndTime}
                onChange={(e) => {
                  setLocalEndTime(e.target.value);
                  // Convert local time back to UTC for storage
                  const utcTime = convertLocalTimeStringToUtc(e.target.value);
                  setValue("settings.workingHours.end", utcTime);
                }}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {t("organization.form.workingHoursEndDescription")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("organization.form.workingDays")}</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.values(DAY_OF_WEEK).map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={workingDays.includes(day)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setValue("settings.workingDays", [...workingDays, day]);
                      } else {
                        setValue(
                          "settings.workingDays",
                          workingDays.filter((d: DAY_OF_WEEK) => d !== day),
                        );
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Label htmlFor={day} className="text-sm">
                    {t(`calendar.workingScheduleForm.days.${day.toLowerCase()}`)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bufferTime">{t("organization.form.bufferTime")}</Label>
              <Input
                id="bufferTime"
                type="number"
                min="0"
                placeholder={t("organization.form.bufferTimePlaceholder")}
                {...register("settings.defaultBufferTime", {
                  valueAsNumber: true,
                })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationPolicy">
                {t("organization.form.cancellationPolicy")}
              </Label>
              <Input
                id="cancellationPolicy"
                type="number"
                min="0"
                placeholder={t("organization.form.cancellationPolicyPlaceholder")}
                {...register("settings.appointmentCancellationPolicyHours", {
                  valueAsNumber: true,
                })}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Appointment Notifications Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("organization.form.appointmentReminders")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminderHoursBefore">
              {t("organization.form.reminderHoursBefore")}
            </Label>
            <Input
              id="reminderHoursBefore"
              type="number"
              min="0"
              placeholder={t("organization.form.reminderHoursBeforePlaceholder")}
              {...register("settings.appointmentReminderHoursBefore", {
                valueAsNumber: true,
              })}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {t("organization.form.reminderHoursBeforeDescription")}
            </p>
            {formState.errors.settings?.appointmentReminderHoursBefore && (
              <p className="text-sm text-red-500">
                {translateFormError(
                  formState.errors.settings.appointmentReminderHoursBefore.message,
                  t
                )}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>{t("organization.form.notificationMethods")}</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={(checked) => {
                    setValue("settings.emailNotifications", !!checked);
                  }}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="emailNotifications"
                  className="text-sm font-medium cursor-pointer"
                >
                  {t("organization.form.emailNotifications")}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {t("organization.form.emailNotificationsDescription")}
              </p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="smsNotifications"
                  checked={smsNotifications}
                  onCheckedChange={(checked) => {
                    setValue("settings.smsNotifications", !!checked);
                  }}
                  disabled={true}
                />
                <Label
                  htmlFor="smsNotifications"
                  className="text-sm font-medium cursor-pointer"
                >
                  {t("organization.form.smsNotifications")} (Coming Soon)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {t("organization.form.smsNotificationsDescription")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Customer Fields Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("organization.form.customFields")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {customerFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{t("organization.form.field")} {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCustomerField(index)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("organization.form.fieldName")}</Label>
                  <Input
                    value={field.name}
                    onChange={(e) =>
                      updateCustomerField(index, {
                        ...field,
                        name: e.target.value,
                      })
                    }
                    placeholder={t("organization.form.fieldNamePlaceholder")}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("organization.form.fieldType")}</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value) =>
                      updateCustomerField(index, {
                        ...field,
                        type: value as CUSTOMER_FIELD_TYPE,
                      })
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CUSTOMER_FIELD_TYPE.TEXT}>
                        Text
                      </SelectItem>
                      <SelectItem value={CUSTOMER_FIELD_TYPE.EMAIL}>
                        Email
                      </SelectItem>
                      <SelectItem value={CUSTOMER_FIELD_TYPE.PHONE}>
                        Phone
                      </SelectItem>
                      <SelectItem value={CUSTOMER_FIELD_TYPE.DATE}>
                        Date
                      </SelectItem>
                      <SelectItem value={CUSTOMER_FIELD_TYPE.NUMBER}>
                        Number
                      </SelectItem>
                      <SelectItem value={CUSTOMER_FIELD_TYPE.SELECT}>
                        Select
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("organization.form.placeholder")}</Label>
                <Input
                  value={field.placeholder || ""}
                  onChange={(e) =>
                    updateCustomerField(index, {
                      ...field,
                      placeholder: e.target.value,
                    })
                  }
                  placeholder={t("organization.form.placeholderPlaceholder")}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`required-${field.id}`}
                  checked={field.isRequired}
                  onCheckedChange={(checked) =>
                    updateCustomerField(index, {
                      ...field,
                      isRequired: !!checked,
                    })
                  }
                  disabled={isLoading}
                />
                <Label htmlFor={`required-${field.id}`}>{t("organization.form.requiredField")}</Label>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addCustomerField}
            disabled={isLoading}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("organization.form.addField")}
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || isUploading}
          >
            {t("organization.form.cancel")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading || !formState.isValid || isUploading}
        >
          {isLoading
            ? t("organization.form.saving")
            : isUploading
              ? t("organization.form.uploadingImage")
              : organization ? t("organization.form.updateOrganization") : t("organization.form.createOrganization")}
        </Button>
      </div>
    </form>
  );
}
