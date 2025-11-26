"use client";

import { CustomerForm } from "@/components/customer/CustomerForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Appointment, APPOINTMENT_STATUS, AppointmentData } from "@/core";
import {
  useAppointmentForm,
  useAvailableTimeslots,
  useBookAppointment,
  useCustomers,
  useMembers,
  useServices,
} from "@/hooks";
import { useUpdateAppointment } from "@/hooks/repository-hooks/appointment/use-appointment";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { formatUtcDateTime } from "@/utils/date-time";
import { formatPrice } from "@/utils/price-format";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  Clock,
  Loader2,
  Plus,
  Save,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateFormError } from "@/utils/translate-form-errors";

interface AppointmentFormProps {
  appointment?: Appointment;
  onSuccess: () => void;
  onSubmit?: (data: AppointmentData) => void | Promise<void>;
}

export function AppointmentForm({
  appointment,
  onSuccess,
  onSubmit,
}: AppointmentFormProps) {
  const { t } = useTranslation();
  // Get organization ID for updates
  const organizationId = useCurrentOrganizationId();

  // Fetch customers and services data FIRST (before form hook to avoid closure issues)
  const { data: customersData, refetch: refetchCustomers } = useCustomers({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  const { data: servicesData } = useServices({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  const { data: membersData } = useMembers({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  // Flatten the infinite query data
  const customers = customersData?.pages.flatMap((page) => page) || [];
  const services = servicesData?.pages.flatMap((page) => page) || [];
  const members = membersData?.pages.flatMap((page) => page) || [];

  // Book appointment mutation
  const bookAppointment = useBookAppointment({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      alert(`${t("appointments.form.failedToBook")}: ${error.message}`);
    },
  });

  // Update appointment mutation
  const updateAppointment = useUpdateAppointment();

  // Handle update mutation errors
  useEffect(() => {
    if (updateAppointment.isError && updateAppointment.error) {
      const errorMessage =
        updateAppointment.error instanceof Error
          ? updateAppointment.error.message
          : t("appointments.form.failedToUpdate");
      setSubmitError(errorMessage);
    }
  }, [updateAppointment.isError, updateAppointment.error, t]);

  const {
    handleSubmit: formHandleSubmit,
    setValue,
    watch,
    trigger,
    clearErrors,
    formState: { isSubmitting, errors },
  } = useAppointmentForm({
    appointment,
    onSubmit:
      onSubmit ||
      (async (data: AppointmentData) => {
        try {
          // Handle updating existing appointment
          if (appointment) {
            if (!organizationId) {
              const error = new Error(t("appointments.form.organizationIdMissing"));
              throw error;
            }

            if (!appointment.id) {
              const error = new Error(t("appointments.form.appointmentIdMissing"));
              throw error;
            }

            // Get form data for date/time - startTime is already in UTC ISO format
            const startTime = watch("startTime") || appointment.startTime;
            if (!startTime) {
              throw new Error(t("appointments.form.startTimeRequired"));
            }

            const updatePayload = {
              id: appointment.id,
              organizationId: organizationId,
              data: {
                assigneeId: data.assigneeId || appointment.assigneeId,
                customerId: data.customerId || appointment.customerId,
                serviceId: data.serviceId || appointment.serviceId,
                title: data.title || appointment.title,
                description: data.description || appointment.description,
                startTime: startTime, // UTC ISO string
                duration: data.duration || appointment.duration,
                fee: data.fee !== undefined ? data.fee : appointment.fee,
                status: data.status || appointment.status,
              },
            };

            await updateAppointment.mutateAsync(updatePayload);

            setSubmitError(null); // Clear any previous errors
            onSuccess();
            return;
          }

          // Handle creating new appointment
          // Get customer from data
          const customer = data.customerId
            ? customers.find((c) => c.id === data.customerId)
            : null;

          if (!customer?.email) {
            const error = new Error(
              t("appointments.form.customerEmailRequired"),
            );
            throw error;
          }

          if (!data.assigneeId) {
            const error = new Error(
              t("appointments.form.assigneeRequired"),
            );
            throw error;
          }

          if (!data.serviceId) {
            const error = new Error(
              t("appointments.form.serviceRequired"),
            );
            throw error;
          }

          // Transform AppointmentData to BookAppointmentPayload
          // startTime is already in UTC ISO format from the timeslot selection
          const startTime = watch("startTime");
          if (!startTime) {
            throw new Error(t("appointments.form.startTimeRequired"));
          }

          const bookingPayload = {
            serviceId: data.serviceId,
            customerEmail: customer.email,
            startTime: startTime, // UTC ISO string
            assigneeId: data.assigneeId,
            fee: data.fee, // Function now accepts null
            title: data.title,
            description: data.description,
            customerData: {
              name: customer.name,
              phone: customer.phone || "",
              address: customer.address || "",
              notes: customer.notes || "",
            },
          };
          await bookAppointment.mutateAsync(bookingPayload);
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : t("appointments.form.unexpectedError");

          // Set error state for UI display
          setSubmitError(errorMessage);

          throw error; // Re-throw to let the form handle it
        }
      }),
  });

  const formData = {
    customerId: watch("customerId") || "",
    serviceId: watch("serviceId") || "",
    date: watch("startTime")
      ? formatUtcDateTime(watch("startTime"), "yyyy-MM-dd")
      : "",
    time: watch("startTime")
      ? formatUtcDateTime(watch("startTime"), "HH:mm")
      : "", // Use empty string for Select component
    status: watch("status") || APPOINTMENT_STATUS.PENDING,
    notes: watch("description") || "",
  };

  const [selectedCustomer, setSelectedCustomer] = useState(
    appointment?.customerId
      ? customers.find((c) => c.id === appointment.customerId) || null
      : null,
  );
  const [selectedService, setSelectedService] = useState(
    appointment?.serviceId
      ? services.find((s) => s.id === appointment.serviceId) || null
      : null,
  );
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch available timeslots dynamically
  const assigneeId = watch("assigneeId");
  const {
    data: timeslotsData,
    isLoading: isTimeslotsLoading,
    error: timeslotsError,
  } = useAvailableTimeslots({
    serviceId: formData.serviceId,
    date: formData.date,
    assigneeId: assigneeId || undefined,
    enabled: !!formData.serviceId && !!formData.date && !!assigneeId,
  });

  // Map of display time (HH:mm) to UTC timeslot ISO string
  const timeSlotMap = useMemo(() => {
    const map = new Map<string, string>();
    timeslotsData?.result?.forEach((slot) => {
      // Convert UTC ISO string to local time for display
      const utcDate = new Date(slot.start);
      const hours = utcDate.getHours().toString().padStart(2, "0");
      const minutes = utcDate.getMinutes().toString().padStart(2, "0");
      const displayTime = `${hours}:${minutes}`;
      map.set(displayTime, slot.start);
    });
    return map;
  }, [timeslotsData?.result]);

  const timeSlots = useMemo(() => {
    return Array.from(timeSlotMap.keys());
  }, [timeSlotMap]);

  const handleChange = (field: string, value: string) => {
    if (field === "date" || field === "time") {
      // Clear submit error when changing date/time
      setSubmitError(null);

      // Get current values in local timezone
      const currentDate = watch("startTime")
        ? formatUtcDateTime(watch("startTime"), "yyyy-MM-dd")
        : formData.date;
      const currentTime = watch("startTime")
        ? formatUtcDateTime(watch("startTime"), "HH:mm")
        : formData.time;

      const newDate = field === "date" ? value : currentDate;
      const newTime = field === "time" ? value : currentTime;

      if (newDate) {
        if (newTime) {
          // Find the UTC timeslot for the selected local time
          const utcTimeslot = timeSlotMap.get(newTime);
          if (utcTimeslot) {
            // Use the UTC timeslot directly
            setValue("startTime", utcTimeslot, { shouldValidate: true });
          } else {
            // Fallback: create UTC datetime from local date and time
            const localDateTime = new Date(`${newDate}T${newTime}:00`);
            setValue("startTime", localDateTime.toISOString(), {
              shouldValidate: true,
            });
          }
          // Trigger validation to clear any previous errors
          trigger("startTime");
        } else {
          // Set date only, time will be added later
          const localDateTime = new Date(`${newDate}T00:00:00`);
          setValue("startTime", localDateTime.toISOString(), {
            shouldValidate: true,
          });
          // Clear startTime error if only date is set (time not selected yet)
          clearErrors("startTime");
        }
      }
    } else if (field === "customerId") {
      setValue("customerId", value);
    } else if (field === "serviceId") {
      setValue("serviceId", value);
    } else if (field === "assigneeId") {
      setValue("assigneeId", value);
    } else if (field === "status") {
      setValue("status", value as APPOINTMENT_STATUS);
    } else if (field === "notes") {
      setValue("description", value);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customer || null);
    handleChange("customerId", customerId);

    // Update title when customer is selected
    if (customer && selectedService) {
      const title = `${selectedService.name} - ${customer.name}`;
      setValue("title", title);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setSelectedService(service || null);
    handleChange("serviceId", serviceId);

    // Update title when service is selected
    if (service && selectedCustomer) {
      const title = `${service.name} - ${selectedCustomer.name}`;
      setValue("title", title);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <Card className="border-none flex flex-col h-full min-h-0 bg-transparent py-0">
        <CardContent className="flex-1 overflow-y-auto min-h-0 pt-6">
          {/* Display submission errors */}
          {submitError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("appointments.form.error")}</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          <form
            id="appointment-form"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitError(null); // Clear error when submitting again
              formHandleSubmit(e);
            }}
            className="h-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label htmlFor="customer">{t("appointments.form.selectCustomer")} *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.customerId}
                    onValueChange={handleCustomerSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("appointments.form.chooseCustomer")} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={`/abstract-geometric-shapes.png?height=32&width=32&query=${customer.name}`}
                              />
                              <AvatarFallback className="text-xs">
                                {customer.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{customer.name}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog
                    open={isCustomerDialogOpen}
                    onOpenChange={setIsCustomerDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="shrink-0 rounded-none"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{t("appointments.form.createNewCustomer")}</DialogTitle>
                      </DialogHeader>
                      <CustomerForm
                        onSuccess={async () => {
                          setIsCustomerDialogOpen(false);
                          // Refresh customers data to get the newly created customer
                          await refetchCustomers();
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                {errors.customerId && (
                  <p className="text-sm text-red-500">
                    {translateFormError(errors.customerId.message, t)}
                  </p>
                )}
              </div>

              {/* Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="service">{t("appointments.form.selectService")} *</Label>
                <Select
                  value={formData.serviceId}
                  onValueChange={handleServiceSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("appointments.form.chooseService")} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center w-full gap-2">
                          <p className="font-medium">{service.name}</p>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {formatPrice(service.price)}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee Selection */}
              <div className="space-y-2">
                <Label htmlFor="assignee">{t("appointments.form.selectAssignee")} *</Label>
                <Select
                  value={watch("assigneeId") || ""}
                  onValueChange={(value) => handleChange("assigneeId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("appointments.form.chooseAssignee")} />
                  </SelectTrigger>
                  <SelectContent>
                    {members.length > 0 ? (
                      members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.image} />
                              <AvatarFallback>
                                {member.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-members" disabled>
                        {t("team.members")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">{t("appointments.form.status")}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={APPOINTMENT_STATUS.PENDING}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        {t("appointments.pending")}
                      </div>
                    </SelectItem>
                    <SelectItem value={APPOINTMENT_STATUS.COMPLETED}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {t("appointments.completed")}
                      </div>
                    </SelectItem>
                    <SelectItem value={APPOINTMENT_STATUS.CANCELLED}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        {t("appointments.cancelled")}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="date">{t("appointments.form.date")} *</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={`w-full rounded-none justify-start text-left font-normal ${
                        !formData.date && "text-muted-foreground"
                      } ${errors.startTime ? "border-destructive" : ""}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.date ? (
                        format(new Date(formData.date + "T00:00:00"), "PPP")
                      ) : (
                        <span>{t("appointments.form.pickDate")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        formData.date
                          ? new Date(formData.date + "T00:00:00")
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          handleChange("date", format(date, "yyyy-MM-dd"));
                          setIsCalendarOpen(false);
                        }
                      }}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <Label htmlFor="time">{t("appointments.form.time")} *</Label>
                <Select
                  value={formData.time || undefined}
                  onValueChange={(value) => {
                    handleChange("time", value);
                  }}
                  disabled={!formData.serviceId || !formData.date}
                >
                  <SelectTrigger
                    className={errors.startTime ? "border-destructive" : ""}
                  >
                    <SelectValue
                      placeholder={
                        !formData.serviceId || !formData.date
                          ? t("appointments.form.selectServiceAndDate")
                          : isTimeslotsLoading
                            ? t("appointments.form.loadingTimes")
                            : timeslotsError
                              ? t("appointments.form.errorLoadingTimes")
                              : timeSlots.length === 0
                                ? t("appointments.form.noAvailableTimes")
                                : t("appointments.form.selectTime")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.length > 0 ? (
                      timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {time}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-sm text-muted-foreground">
                        {timeslotsError
                          ? t("appointments.form.errorLoadingTimes")
                          : isTimeslotsLoading
                            ? t("appointments.form.loadingTimes")
                            : t("appointments.form.noAvailableTimes")}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.startTime && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {translateFormError(errors.startTime.message, t)}
                  </p>
                )}
                {timeslotsError && !errors.startTime && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t("appointments.form.errorLoadingTimes")}
                  </p>
                )}
              </div>

              {/* Notes - Full Width */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">{t("appointments.form.notes")}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder={t("appointments.form.notesPlaceholder")}
                  rows={3}
                />
              </div>
            </div>
          </form>
        </CardContent>
        {/* Form Actions - Fixed at bottom */}
        <div className="flex justify-end gap-3 p-6 border-t flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isSubmitting || bookAppointment.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            {t("appointments.form.cancel")}
          </Button>
          <Button
            type="submit"
            form="appointment-form"
            disabled={(() => {
              const disabled =
                !formData.customerId ||
                !formData.serviceId ||
                !watch("assigneeId") ||
                !formData.date ||
                !formData.time ||
                isSubmitting ||
                bookAppointment.isPending;
              return disabled;
            })()}
          >
            {isSubmitting || bookAppointment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("appointments.form.booking")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {appointment ? t("appointments.form.update") : t("appointments.form.book")}
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
