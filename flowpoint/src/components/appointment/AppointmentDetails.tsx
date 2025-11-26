"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Appointment, APPOINTMENT_STATUS } from "@/core";
import { useCustomer, useService } from "@/hooks";
import { formatUtcDateTime } from "@/utils/date-time";
import { formatPrice } from "@/utils/price-format";
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Mail,
  Phone,
  User,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface AppointmentDetailsProps {
  appointment: Appointment;
  onStatusChange: (appointmentId: string, newStatus: string) => void;
}

export function AppointmentDetails({
  appointment,
  onStatusChange,
}: AppointmentDetailsProps) {
  const { t } = useTranslation();
  // Fetch customer and service data
  const { data: customer, isLoading: isLoadingCustomer } = useCustomer(
    appointment.customerId,
  );
  const { data: service, isLoading: isLoadingService } = useService(
    appointment.serviceId,
  );

  // Appointment date and time (derived from startTime) - convert from UTC to local
  const appointmentDate = appointment.startTime
    ? formatUtcDateTime(appointment.startTime, "yyyy-MM-dd")
    : new Date().toISOString().split("T")[0];
  const appointmentTime = appointment.startTime
    ? formatUtcDateTime(appointment.startTime, "HH:mm")
    : "10:00";
  const notes = appointment.description || null;

  // Loading state
  if (isLoadingCustomer || isLoadingService) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">
            {t("appointments.details.loading")}
          </p>
        </div>
      </div>
    );
  }

  // Fallback data if customer or service is not found
  const customerData = customer || {
    id: appointment.customerId,
    name: t("appointments.details.unknownCustomer"),
    email: t("common.notAvailable"),
    phone: t("common.notAvailable"),
  };

  const serviceData = service || {
    id: appointment.serviceId,
    name: appointment.title || "Unknown Service",
    duration: appointment.duration || 60,
    price: appointment.fee || 0,
    description: undefined,
  };

  const avatarUrl = customerData.name
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customerData.name)}`
    : undefined;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING:
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600"
          >
            {t("appointments.pending")}
          </Badge>
        );
      case APPOINTMENT_STATUS.COMPLETED:
        return (
          <Badge className="bg-primary text-primary-foreground">
            {t("appointments.completed")}
          </Badge>
        );
      case APPOINTMENT_STATUS.CANCELLED:
        return <Badge variant="destructive">{t("appointments.cancelled")}</Badge>;
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
          <h3 className="text-2xl font-bold font-sans">{serviceData.name}</h3>
          <p className="text-muted-foreground mt-1">
            {formatDate(appointmentDate)} at {formatTime(appointmentTime)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge(appointment.status)}
            <span className="text-sm text-muted-foreground">
              {t("appointments.details.bookedOn")} {new Date(appointment.createdAt).toLocaleDateString()}
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
              {t("appointments.details.complete")}
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
              {t("appointments.details.cancel")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("appointments.details.customerInformation")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={
                    avatarUrl ? `${avatarUrl}?height=48&width=48` : undefined
                  }
                />
                <AvatarFallback>
                  {customerData.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">{customerData.name}</h4>
                <p className="text-sm text-muted-foreground">{t("appointments.details.customer")}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("appointments.details.email")}</p>
                  <p className="text-sm text-muted-foreground">
                    {customerData.email}
                  </p>
                </div>
              </div>
              {customerData.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("appointments.details.phone")}</p>
                    <p className="text-sm text-muted-foreground">
                      {customerData.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {t("appointments.details.serviceDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">{serviceData.name}</h4>
              <p className="text-sm text-muted-foreground">
                {serviceData.description || t("appointments.details.service")}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("appointments.details.duration")}</p>
                  <p className="text-sm text-muted-foreground">
                    {serviceData.duration} {t("appointments.details.minutes")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("appointments.details.price")}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(serviceData.price)}
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
            {t("appointments.details.scheduleInformation")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("appointments.details.date")}
                </p>
                <p className="text-lg font-semibold">
                  {formatDate(appointmentDate)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("appointments.details.time")}
                </p>
                <p className="text-lg font-semibold">
                  {formatTime(appointmentTime)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("appointments.details.duration")}
                </p>
                <p className="text-lg font-semibold">
                  {serviceData.duration} {t("appointments.details.minutes")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("appointments.details.endTime")}
                </p>
                <p className="text-lg font-semibold">
                  {(() => {
                    const [hours, minutes] = appointmentTime.split(":");
                    const startTime = new Date();
                    startTime.setHours(
                      Number.parseInt(hours),
                      Number.parseInt(minutes),
                    );
                    const endTime = new Date(
                      startTime.getTime() + serviceData.duration * 60000,
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
      {notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("appointments.details.notes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
