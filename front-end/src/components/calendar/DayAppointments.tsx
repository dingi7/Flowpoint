"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENT_STATUS, Appointment } from "@/core";
import { useAppointments } from "@/hooks/repository-hooks/appointment/use-appointment";
import { formatUtcDateTime } from "@/utils/date-time";
import { format } from "date-fns";
import { Clock, User, Edit, Trash2, Plus } from "lucide-react";
import { AppointmentForm } from "@/components/appointment/AppointmentForm";

interface DayAppointmentsProps {
  date: Date;
  onClose: () => void;
}

export function DayAppointments({ date, onClose }: DayAppointmentsProps) {
  const [editingAppointment, setEditingAppointment] = useState<string | null>(null);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  
  const { data: appointmentsData, isLoading } = useAppointments({
    pagination: { limit: 100 },
    orderBy: { field: "startTime", direction: "asc" }
  });

  // Filter appointments for the selected date
  const dayAppointments = (appointmentsData?.pages
    .flatMap(page => page) as Appointment[] || [])
    .filter(appointment => {
      if (!appointment.startTime) return false;
      const appointmentDate = new Date(appointment.startTime);
      return format(appointmentDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING:
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
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

  const handleEditAppointment = (appointmentId: string) => {
    setEditingAppointment(appointmentId);
  };

  const handleCreateAppointment = () => {
    setIsCreatingAppointment(true);
  };

  const handleCloseEdit = () => {
    setEditingAppointment(null);
    setIsCreatingAppointment(false);
  };

  const handleAppointmentSaved = () => {
    setEditingAppointment(null);
    setIsCreatingAppointment(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Appointments for {format(date, 'EEEE, MMMM do, yyyy')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''} scheduled
            </div>
            <Button onClick={handleCreateAppointment} className="gap-2">
              <Plus className="h-4 w-4" />
              New Appointment
            </Button>
          </div>

          {/* Appointments List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : dayAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Appointments</h3>
              <p className="text-muted-foreground mb-4">
                No appointments scheduled for this day.
              </p>
              <Button onClick={handleCreateAppointment} className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {dayAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-medium">{appointment.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {appointment.startTime && formatUtcDateTime(appointment.startTime, "HH:mm")} - 
                              {appointment.duration && ` ${appointment.duration} min`}
                            </p>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        {appointment.description && (
                          <p className="text-sm text-muted-foreground">
                            {appointment.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>Customer: {appointment.customerId}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Service: {appointment.serviceId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAppointment(appointment.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement delete functionality
                            console.log("Delete appointment:", appointment.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit/Create Appointment Modal */}
        {(editingAppointment || isCreatingAppointment) && (
          <Dialog open={true} onOpenChange={handleCloseEdit}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isCreatingAppointment ? "Create New Appointment" : "Edit Appointment"}
                </DialogTitle>
              </DialogHeader>
              <AppointmentForm
                appointment={editingAppointment ? dayAppointments.find(a => a.id === editingAppointment) : undefined}
                onSuccess={handleAppointmentSaved}
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
