"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Appointment, APPOINTMENT_STATUS } from "@/core";
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Mail,
  Phone,
  User,
  X,
} from "lucide-react";

interface AppointmentDetailsProps {
  appointment: Appointment;
  onEdit: () => void;
  onStatusChange: (appointmentId: string, newStatus: string) => void;
}

export function AppointmentDetails({
  appointment,
  onEdit,
  onStatusChange,
}: AppointmentDetailsProps) {
  // Mock data for customer, service, and assignee
  const mockCustomer = {
    id: appointment.customerId,
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 (555) 123-4567",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
  };

  const mockService = {
    id: appointment.serviceId,
    name: appointment.title || "Professional Consultation",
    duration: appointment.duration || 60,
    price: appointment.fee || 150,
  };

  // Mock appointment date and time (derived from startTime)
  const mockDate = appointment.startTime
    ? new Date(appointment.startTime).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const mockTime = appointment.startTime
    ? new Date(appointment.startTime).toTimeString().slice(0, 5)
    : "10:00";
  const mockNotes = appointment.description || null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING:
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600"
          >
            Pending
          </Badge>
        );
      case APPOINTMENT_STATUS.COMPLETED:
        return (
          <Badge className="bg-primary text-primary-foreground">
            Completed
          </Badge>
        );
      case APPOINTMENT_STATUS.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Appointment Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold font-sans">{mockService.name}</h3>
          <p className="text-muted-foreground mt-1">
            {formatDate(mockDate)} at {formatTime(mockTime)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge(appointment.status)}
            <span className="text-sm text-muted-foreground">
              Booked on {new Date(appointment.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {appointment.status === APPOINTMENT_STATUS.PENDING && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onStatusChange(appointment.id, APPOINTMENT_STATUS.COMPLETED)
              }
              className="bg-transparent"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
          {appointment.status === APPOINTMENT_STATUS.PENDING && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onStatusChange(appointment.id, APPOINTMENT_STATUS.CANCELLED)
              }
              className="bg-transparent text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button onClick={onEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={`${mockCustomer.avatar}?height=48&width=48&query=${mockCustomer.name}`}
                />
                <AvatarFallback>
                  {mockCustomer.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">{mockCustomer.name}</h4>
                <p className="text-sm text-muted-foreground">Customer</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {mockCustomer.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {mockCustomer.phone}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Service Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">{mockService.name}</h4>
              <p className="text-sm text-muted-foreground">
                Professional service
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {mockService.duration} minutes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Price</p>
                  <p className="text-sm text-muted-foreground">
                    {mockService.price === 0 ? "Free" : `$${mockService.price}`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Date
                </p>
                <p className="text-lg font-semibold">{formatDate(mockDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Time
                </p>
                <p className="text-lg font-semibold">{formatTime(mockTime)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Duration
                </p>
                <p className="text-lg font-semibold">
                  {mockService.duration} minutes
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  End Time
                </p>
                <p className="text-lg font-semibold">
                  {(() => {
                    const [hours, minutes] = mockTime.split(":");
                    const startTime = new Date();
                    startTime.setHours(
                      Number.parseInt(hours),
                      Number.parseInt(minutes),
                    );
                    const endTime = new Date(
                      startTime.getTime() + mockService.duration * 60000,
                    );
                    return formatTime(
                      `${endTime.getHours().toString().padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`,
                    );
                  })()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {mockNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{mockNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
