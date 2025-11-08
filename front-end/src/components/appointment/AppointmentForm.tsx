"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
import { useAppointmentForm, useAvailableTimeslots, useBookAppointment, useMembers } from "@/hooks";
import { useCustomers, useServices } from "@/hooks";
import { CustomerForm } from "@/components/customer/CustomerForm";
import {
  Calendar,
  Clock,
  Plus,
  Save,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { formatUtcDateTime } from "@/utils/date-time";
import { formatPrice } from "@/utils/price-format";
import { useCurrentOrganization } from "@/stores/organization-store";



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
  const {
    handleSubmit: formHandleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useAppointmentForm({
    appointment,
    onSubmit: onSubmit || (async (data: AppointmentData) => {

      // Only book appointment if this is a new appointment (not editing existing)
      if (!appointment) {
        if (!selectedCustomer?.email) {
          console.error("No customer email found");
          throw new Error("Customer email is required to book an appointment");
        }

        if (!data.assigneeId) {
          console.error("No assignee ID found");
          throw new Error("Assignee is required to book an appointment");
        }

        if (!data.serviceId) {
          console.error("No service ID found");
          throw new Error("Service is required to book an appointment");
        }

        // Transform AppointmentData to BookAppointmentPayload
        // Send local date and time, not UTC
        const localDate = formData.date; // Format: yyyy-MM-dd
        const localTime = formData.time; // Format: HH:mm
        const startTime = `${localDate}T${localTime}:00`; // Format: yyyy-MM-ddTHH:mm:00
        
        const bookingPayload = {
          serviceId: data.serviceId,
          customerEmail: selectedCustomer.email,
          startTime: startTime, // Local time, not UTC
          assigneeId: data.assigneeId,
          fee: data.fee, // Function now accepts null
          title: data.title,
          description: data.description,
          additionalCustomerFields: {
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            // Add any additional customer fields if needed
          },
        };
        console.log("📤 Booking Request (Local Time):", {
          localDate,
          localTime,
          startTime: bookingPayload.startTime,
        });
        await bookAppointment.mutateAsync(bookingPayload);
      }
    }),
  });

  // Fetch customers and services data
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

  // Get current organization for currency
  const currentOrganization = useCurrentOrganization();
  const currency = currentOrganization?.currency || "EUR";

  // Flatten the infinite query data
  const customers = customersData?.pages.flatMap(page => page) || [];
  const services = servicesData?.pages.flatMap(page => page) || [];
  const members = membersData?.pages.flatMap(page => page) || [];

  const formData = {
    customerId: watch("customerId") || "",
    serviceId: watch("serviceId") || "",
    date: watch("startTime") ? formatUtcDateTime(watch("startTime"), "yyyy-MM-dd") : "",
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

  // Book appointment mutation
  const bookAppointment = useBookAppointment({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      console.error("Failed to book appointment:", error);
      // TODO: Add toast notification for better UX
      alert(`Failed to book appointment: ${error.message}`);
    },
  });



  const handleChange = (field: string, value: string) => {
    if (field === "date" || field === "time") {
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
          // Store local date and time (backend will handle timezone conversion)
          const localDateTime = `${newDate}T${newTime}:00`;
          setValue("startTime", localDateTime);
        } else {
          // Set date only, time will be added later
          const localDateTime = `${newDate}T00:00:00`;
          setValue("startTime", localDateTime);
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

  // Fetch available timeslots dynamically
  const {
    data: timeslotsData,
    isLoading: isTimeslotsLoading,
    error: timeslotsError,
  } = useAvailableTimeslots({
    serviceId: formData.serviceId,
    date: formData.date,
    enabled: !!formData.serviceId && !!formData.date,
  });

  const timeSlots = useMemo(() => {
    return timeslotsData?.result?.map((slot) => {
      const timeMatch = slot.start.match(/T(\d{2}):(\d{2})/);
      return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : "";
    }) || [];
  }, [timeslotsData?.result]);


  return (
    <div className="flex flex-col h-full min-h-0">
      <Card className="border-none flex flex-col h-full min-h-0 bg-black py-0">
        <CardContent className="flex-1 overflow-y-auto min-h-0 pt-6">
          <form
            id="appointment-form"
            onSubmit={(e) => {
              formHandleSubmit(e);
            }}
            className="h-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label htmlFor="customer">Select Customer *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.customerId}
                    onValueChange={handleCustomerSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a customer" />
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
                  <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="shrink-0 rounded-none">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Customer</DialogTitle>
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
                  <p className="text-sm text-red-500">{errors.customerId.message}</p>
                )}
              </div>

              {/* Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="service">Select Service *</Label>
                <Select
                  value={formData.serviceId}
                  onValueChange={handleServiceSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center w-full gap-2">
                          <p className="font-medium">{service.name}</p>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {formatPrice(service.price, currency)}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee Selection */}
              <div className="space-y-2">
                <Label htmlFor="assignee">Select Assignee *</Label>
                <Select
                  value={watch("assigneeId") || ""}
                  onValueChange={(value) => handleChange("assigneeId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an assignee" />
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
                        No members available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value={APPOINTMENT_STATUS.COMPLETED}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Completed
                      </div>
                    </SelectItem>
                    <SelectItem value={APPOINTMENT_STATUS.CANCELLED}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={`w-full rounded-none justify-start text-left font-normal ${!formData.date && "text-muted-foreground"
                        }`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.date ? (
                        format(new Date(formData.date + "T00:00:00"), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.date ? new Date(formData.date + "T00:00:00") : undefined}
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
                <Label htmlFor="time">Time *</Label>
                <Select
                  value={formData.time || undefined}
                  onValueChange={(value) => {
                    handleChange("time", value);
                  }}
                  disabled={!formData.serviceId || !formData.date}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !formData.serviceId || !formData.date
                          ? "Select service and date first"
                          : isTimeslotsLoading
                          ? "Loading available times..."
                          : timeslotsError
                          ? "Error loading times"
                          : timeSlots.length === 0
                          ? "No available times"
                          : "Select time"
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
                          ? "Error loading available times"
                          : isTimeslotsLoading
                            ? "Loading..."
                            : "No available times for this date"
                        }
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {timeslotsError && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load available times. Please try again.
                  </p>
                )}
              </div>

              {/* Notes - Full Width */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Any special requests, preferences, or notes for this appointment..."
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
            Cancel
          </Button>
          <Button
            type="submit"
            form="appointment-form"
            disabled={
              (() => {
                const disabled = !formData.customerId ||
                  !formData.serviceId ||
                  !watch("assigneeId") ||
                  !formData.date ||
                  !formData.time ||
                  isSubmitting ||
                  bookAppointment.isPending;
                return disabled;
              })()
            }
          >
            {isSubmitting || bookAppointment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {appointment ? "Update Appointment" : "Book Appointment"}
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
