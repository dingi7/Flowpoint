"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Appointment, APPOINTMENT_STATUS, AppointmentData } from "@/core";
import { useAppointmentForm, useAvailableTimeslots, useBookAppointment, useMembers } from "@/hooks";
import { useCustomers, useServices } from "@/hooks";
import { CustomerForm } from "@/components/customer/CustomerForm";
import {
  Calendar,
  Clock,
  DollarSign,
  Plus,
  Save,
  Search,
  User,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";



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
    formState: { isSubmitting },
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
        const bookingPayload = {
          serviceId: data.serviceId,
          customerEmail: selectedCustomer.email,
          startTime: data.startTime, // This should already be in ISO format
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

  // Flatten the infinite query data
  const customers = customersData?.pages.flatMap(page => page) || [];
  const services = servicesData?.pages.flatMap(page => page) || [];
  const members = membersData?.pages.flatMap(page => page) || [];

  const formData = {
    customerId: watch("customerId") || "",
    serviceId: watch("serviceId") || "",
    date: watch("startTime") ? watch("startTime").split("T")[0] : "",
    time: watch("startTime")
      ? watch("startTime").split("T")[1]?.substring(0, 5)
      : undefined, // Use undefined instead of empty string for Select component
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
      // Combine date and time into startTime
      const currentDate = watch("startTime")
        ? watch("startTime").split("T")[0]
        : formData.date;
      const currentTime = watch("startTime")
        ? watch("startTime").split("T")[1]?.substring(0, 5)
        : formData.time;

      const newDate = field === "date" ? value : currentDate;
      const newTime = field === "time" ? value : currentTime;

      if (newDate) {
        if (newTime) {
          // Create proper ISO datetime string
          const dateTime = new Date(`${newDate}T${newTime}:00`);
          setValue("startTime", dateTime.toISOString());
        } else {
          // Set date only, time will be added later
          const dateTime = new Date(`${newDate}T00:00:00`);
          setValue("startTime", dateTime.toISOString());
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

  // Convert timeslots to time strings for the dropdown
  const timeSlots = timeslotsData?.result?.map((slot) => {
    const startTime = new Date(slot.start);
    return startTime.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  }) || [];



  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-6 px-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              formData.customerId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {formData.customerId ? <CheckCircle className="h-4 w-4" /> : "1"}
            </div>
            <span className="ml-2 text-sm font-medium">Customer</span>
          </div>
          <div className="w-8 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              formData.serviceId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {formData.serviceId ? <CheckCircle className="h-4 w-4" /> : "2"}
            </div>
            <span className="ml-2 text-sm font-medium">Service</span>
          </div>
          <div className="w-8 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              watch("assigneeId") ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {watch("assigneeId") ? <CheckCircle className="h-4 w-4" /> : "3"}
            </div>
            <span className="ml-2 text-sm font-medium">Assignee</span>
          </div>
          <div className="w-8 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              formData.date && formData.time ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {formData.date && formData.time ? <CheckCircle className="h-4 w-4" /> : "4"}
            </div>
            <span className="ml-2 text-sm font-medium">Schedule</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
        <form id="appointment-form" onSubmit={(e) => {
          formHandleSubmit(e);
        }} className="space-y-8">
          {/* Customer Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Customer Information</h3>
                  <p className="text-sm text-muted-foreground">Select or create a customer</p>
                </div>
              </div>
              <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Customer
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

            <div className="space-y-3">
              <Label htmlFor="customer" className="text-sm font-medium">Select Customer *</Label>
              <Select
                value={formData.customerId}
                onValueChange={handleCustomerSelect}
              >
                <SelectTrigger className="h-16 py-4">
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id} className="py-4">
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
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomer && (
              <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={`/abstract-geometric-shapes.png?height=48&width=48&query=${selectedCustomer.name}`}
                    />
                    <AvatarFallback>
                      {selectedCustomer.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.email}
                    </p>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-muted-foreground">
                        {selectedCustomer.phone}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Selected
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Service Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Search className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Service Selection</h3>
                <p className="text-sm text-muted-foreground">Choose the service for this appointment</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="service" className="text-sm font-medium">Select Service *</Label>
              <Select
                value={formData.serviceId}
                onValueChange={handleServiceSelect}
              >
                <SelectTrigger className="h-16" size="default">
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id} className="py-4">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex-1">
                          <p className="font-medium">{service.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {service.duration} min
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              {service.price === 0 ? "Free" : `$${service.price}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedService && (
              <div className="p-4 bg-gradient-to-r from-blue-500/5 to-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{selectedService.name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {selectedService.duration} minutes
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {selectedService.price === 0 ? "Free" : `$${selectedService.price}`}
                      </div>
                    </div>
                    {selectedService.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedService.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                    Selected
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Assignee Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <User className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Assignee Selection</h3>
                <p className="text-sm text-muted-foreground">Choose who will handle this appointment</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="assignee" className="text-sm font-medium">Select Assignee *</Label>
              <Select
                value={watch("assigneeId") || ""}
                onValueChange={(value) => handleChange("assigneeId", value)}
              >
                <SelectTrigger className="h-16">
                  <SelectValue placeholder="Choose an assignee" />
                </SelectTrigger>
                <SelectContent>
                  {members.length > 0 ? (
                    members.map((member) => (
                      <SelectItem key={member.id} value={member.id} className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.image} />
                            <AvatarFallback>
                              {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.description || 'Team member'}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-members" disabled className="py-4">
                      No members available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {watch("assigneeId") && (
              <div className="p-4 bg-gradient-to-r from-green-500/5 to-green-500/10 rounded-xl border border-green-500/20">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={members.find(m => m.id === watch("assigneeId"))?.image} />
                    <AvatarFallback>
                      {members.find(m => m.id === watch("assigneeId"))?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {members.find(m => m.id === watch("assigneeId"))?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {members.find(m => m.id === watch("assigneeId"))?.description || 'Team member'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    Assigned
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Date & Time Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Schedule</h3>
                <p className="text-sm text-muted-foreground">Set the date and time for this appointment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={`h-16 w-full justify-start text-left font-normal ${!formData.date && "text-muted-foreground"
                        }`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.date ? (
                        format(new Date(formData.date), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.date ? new Date(formData.date) : undefined}
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
              <div className="space-y-3">
                <Label htmlFor="time" className="text-sm font-medium">Time *</Label>
                <Select
                  value={formData.time}
                  onValueChange={(value) => handleChange("time", value)}
                  disabled={isTimeslotsLoading || !formData.serviceId || !formData.date}
                >
                  <SelectTrigger className="h-16">
                    <SelectValue 
                      placeholder={
                        isTimeslotsLoading 
                          ? "Loading available times..." 
                          : !formData.serviceId || !formData.date
                          ? "Select service and date first"
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
                        <SelectItem key={time} value={time} className="py-4">
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
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load available times. Please try again.
                  </div>
                )}
              </div>
            </div>

            {formData.date && formData.time && (
              <div className="p-4 bg-gradient-to-r from-purple-500/5 to-purple-500/10 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {format(new Date(formData.date), "EEEE, MMMM do, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formData.time} - {selectedService ? `${selectedService.duration} minutes` : 'Duration TBD'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
                    Scheduled
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger className="h-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={APPOINTMENT_STATUS.PENDING} className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="confirmed" className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Confirmed
                    </div>
                  </SelectItem>
                  <SelectItem value={APPOINTMENT_STATUS.COMPLETED} className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value={APPOINTMENT_STATUS.CANCELLED} className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Cancelled
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <p className="text-sm text-muted-foreground">Add any special notes or requirements</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any special requests, preferences, or notes for this appointment..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Form Actions - Fixed at bottom */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-t bg-background/95 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>All fields marked with * are required</span>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onSuccess} className="gap-2">
            <X className="h-4 w-4" />
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
                  formData.time === undefined ||
                  isSubmitting ||
                  bookAppointment.isPending;
                return disabled;
              })()
            }
            className="gap-2 min-w-[140px]"
          >
            {isSubmitting || bookAppointment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {appointment ? "Update Appointment" : "Book Appointment"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
