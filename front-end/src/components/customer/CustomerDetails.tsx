"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Customer, APPOINTMENT_STATUS } from "@/core";
import { useGetAppointmentsByCustomer, useServices } from "@/hooks";
import { formatUtcDateTime } from "@/utils/date-time";
import {
  Clock,
  Edit,
  Mail,
  MapPin,
  Phone,
  Calendar,
} from "lucide-react";
import { useMemo } from "react";

interface CustomerDetailsProps {
  customer: Customer;
  onEdit: () => void;
}

export function CustomerDetails({ customer, onEdit }: CustomerDetailsProps) {
  // Fetch appointments for this customer
  const { data: appointments = [], isLoading: isLoadingAppointments, error: appointmentsError } = useGetAppointmentsByCustomer(customer.id);
  console.log(appointmentsError)
  
  // Fetch services to get service names
  const { data: servicesData, error: servicesError } = useServices({ pagination: { limit: 1000 } });
  console.log(servicesError)
  const services = useMemo(() => {
    return servicesData?.pages.flatMap(page => page) || [];
  }, [servicesData]);

  // Create a map for quick service lookup
  const servicesMap = useMemo(() => {
    return services.reduce((acc, service) => {
      acc[service.id] = service;
      return acc;
    }, {} as Record<string, typeof services[0]>);
  }, [services]);

  // Sort appointments by date (most recent first)
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0;
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
  }, [appointments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING:
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600 bg-yellow-50"
          >
            Pending
          </Badge>
        );
      case APPOINTMENT_STATUS.CONFIRMED:
        return (
          <Badge className="bg-blue-500 text-white">
            Confirmed
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

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold font-sans">{customer.name}</h3>
          </div>
        </div>
        <Button onClick={onEdit} className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans">
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  {customer.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">
                  {customer.phone}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">
                  {customer.address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans">Customer Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Appointments</p>
                <p className="text-sm text-muted-foreground">
                  {isLoadingAppointments ? "Loading..." : `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{customer.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans">
            Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAppointments ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Loading appointments...</p>
            </div>
          ) : sortedAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No appointments found for this customer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAppointments.map((appointment) => {
                const service = servicesMap[appointment.serviceId];
                const serviceName = service?.name || appointment.title || "Unknown Service";
                const appointmentDate = appointment.startTime
                  ? formatUtcDateTime(appointment.startTime, "MMM dd, yyyy")
                  : "TBD";
                const appointmentTime = appointment.startTime
                  ? formatUtcDateTime(appointment.startTime, "h:mm a")
                  : "TBD";
                const amount = appointment.fee ?? service?.price ?? 0;

                return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{serviceName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{appointmentDate}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{appointmentTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-medium">${amount.toFixed(2)}</p>
                      <div className="mt-1">
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
