import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Organization, OrganizationData, DAY_OF_WEEK, CUSTOMER_FIELD_TYPE } from "@/core";
import { useOrganizationForm } from "@/hooks";
import { useOrganizationImageUpload } from "@/hooks/service-hooks/media/use-organization-image-upload";
import { convertWorkingHoursToLocal, convertLocalTimeStringToUtc } from "@/utils/date-time";
import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, MapPin, Users, Bell } from "lucide-react";

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
  const currentImage = watch("image");
  const workingDays = watch("settings.workingDays") || [];
  const workingHours = watch("settings.workingHours") || { start: "09:00", end: "17:00" };
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
    organization?.settings?.customerFields || []
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
      const localTimes = convertWorkingHoursToLocal(workingHours as { start: string; end: string }, "UTC");
      setLocalStartTime(localTimes.start);
      setLocalEndTime(localTimes.end);
    }
  }, [workingHours]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Enter organization address"
              {...register("settings.contactInfo.address")}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                {...register("settings.contactInfo.phone")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                {...register("settings.contactInfo.email")}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
            <Input
              id="googleMapsUrl"
              type="url"
              placeholder="https://maps.google.com/..."
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
            Working Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value="UTC"
              disabled={true}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC (All organizations use UTC)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All organizations use UTC timezone. Working hours are displayed in your local timezone.
            </p>
            {formState.errors.settings?.timezone && (
              <p className="text-sm text-red-500">
                {formState.errors.settings.timezone.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workingHoursStart">Working Hours Start</Label>
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
                Displayed in your local timezone (stored as UTC)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workingHoursEnd">Working Hours End</Label>
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
                Displayed in your local timezone (stored as UTC)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Working Days</Label>
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
                        setValue("settings.workingDays", workingDays.filter(d => d !== day));
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Label htmlFor={day} className="text-sm">
                    {day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
              <Input
                id="bufferTime"
                type="number"
                min="0"
                placeholder="0"
                {...register("settings.defaultBufferTime", { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationPolicy">Cancellation Policy (hours)</Label>
              <Input
                id="cancellationPolicy"
                type="number"
                min="0"
                placeholder="24"
                {...register("settings.appointmentCancellationPolicyHours", { valueAsNumber: true })}
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
            Appointment Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminderHoursBefore">Reminder Hours Before Appointment</Label>
            <Input
              id="reminderHoursBefore"
              type="number"
              min="0"
              placeholder="24"
              {...register("settings.appointmentReminderHoursBefore", { valueAsNumber: true })}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              How many hours before the appointment should reminder notifications be sent
            </p>
            {formState.errors.settings?.appointmentReminderHoursBefore && (
              <p className="text-sm text-red-500">
                {formState.errors.settings.appointmentReminderHoursBefore.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Notification Methods</Label>
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
                <Label htmlFor="emailNotifications" className="text-sm font-medium cursor-pointer">
                  Email Notifications
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Send appointment confirmation and reminder emails to customers
              </p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="smsNotifications"
                  checked={smsNotifications}
                  onCheckedChange={(checked) => {
                    setValue("settings.smsNotifications", !!checked);
                  }}
                  disabled={isLoading}
                />
                <Label htmlFor="smsNotifications" className="text-sm font-medium cursor-pointer">
                  SMS Notifications
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Send appointment confirmation and reminder SMS messages to customers
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
            Custom Customer Fields
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {customerFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Field {index + 1}</h4>
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
                  <Label>Field Name</Label>
                  <Input
                    value={field.name}
                    onChange={(e) => updateCustomerField(index, { ...field, name: e.target.value })}
                    placeholder="Enter field name"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value) => updateCustomerField(index, { ...field, type: value as CUSTOMER_FIELD_TYPE })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CUSTOMER_FIELD_TYPE.TEXT}>Text</SelectItem>
                      <SelectItem value={CUSTOMER_FIELD_TYPE.EMAIL}>Email</SelectItem>
                      <SelectItem value={CUSTOMER_FIELD_TYPE.PHONE}>Phone</SelectItem>
                      <SelectItem value={CUSTOMER_FIELD_TYPE.DATE}>Date</SelectItem>
                      <SelectItem value={CUSTOMER_FIELD_TYPE.NUMBER}>Number</SelectItem>
                      <SelectItem value={CUSTOMER_FIELD_TYPE.SELECT}>Select</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Placeholder (Optional)</Label>
                <Input
                  value={field.placeholder || ""}
                  onChange={(e) => updateCustomerField(index, { ...field, placeholder: e.target.value })}
                  placeholder="Enter placeholder text"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`required-${field.id}`}
                  checked={field.isRequired}
                  onCheckedChange={(checked) => updateCustomerField(index, { ...field, isRequired: !!checked })}
                  disabled={isLoading}
                />
                <Label htmlFor={`required-${field.id}`}>Required field</Label>
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
            Add Customer Field
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
