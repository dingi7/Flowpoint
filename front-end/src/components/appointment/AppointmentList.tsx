"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { APPOINTMENT_STATUS, Appointment, Customer, Service } from "@/core";
import { useAppointments, useCustomers, useServices, useUpdateAppointment } from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import {
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { AppointmentDetails } from "./AppointmentDetails";
import { AppointmentForm } from "./AppointmentForm";
import { AppointmentDeleteDialog } from "./AppointmentDeleteDialog";
import { formatUtcDateTime } from "@/utils/date-time";


interface AppointmentListProps {
  searchQuery: string;
  statusFilter: string;
  dateFilter: string;
}

export function AppointmentList({
  searchQuery,
  statusFilter,
  dateFilter,
}: AppointmentListProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Get organization ID for updates
  const organizationId = useCurrentOrganizationId();

  // Fetch real data from repositories
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments({
    pagination: { limit: 1000 },
    orderBy: { field: "startTime", direction: "asc" }
  });

  const { data: customersData, isLoading: customersLoading } = useCustomers({
    pagination: { limit: 1000 }
  });

  const { data: servicesData, isLoading: servicesLoading } = useServices({
    pagination: { limit: 1000 }
  });

  // Update appointment mutation
  const updateAppointment = useUpdateAppointment();

  const appointments = appointmentsData?.pages.flatMap(page => page) as Appointment[] || [];
  const customers = customersData?.pages.flatMap(page => page) || [];
  const services = servicesData?.pages.flatMap(page => page) || [];

  // Create lookup maps for customers and services
  const customersMap = useMemo(() => {
    return customers.reduce((acc, customer) => {
      acc[customer.id] = customer;
      return acc;
    }, {} as Record<string, Customer>);
  }, [customers]);

  const servicesMap = useMemo(() => {
    return services.reduce((acc, service) => {
      acc[service.id] = service;
      return acc;
    }, {} as Record<string, Service>);
  }, [services]);

  // Filter appointments based on search, status, and date
  const filteredAppointments = appointments.filter((appointment) => {
    const customer = customersMap[appointment.customerId];
    const service = servicesMap[appointment.serviceId];

    const matchesSearch =
      customer?.name?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
      service?.name?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
      customer?.email?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
      appointment.title?.toLowerCase().includes(searchQuery?.toLowerCase() || "");

    const matchesStatus =
      statusFilter === "all" || appointment.status === statusFilter;

    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    
    // Get appointment date in local timezone for accurate comparison
    const appointmentDate = appointment.startTime
      ? new Date(appointment.startTime)
      : today;
    const appointmentDateString = appointmentDate && !isNaN(appointmentDate.getTime())
      ? appointmentDate.toISOString().split("T")[0]
      : todayString;
    
    let matchesDate = true;

    switch (dateFilter) {
      case "today":
        matchesDate = appointmentDateString === todayString;
        break;
      case "tomorrow": {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split("T")[0];
        matchesDate = appointmentDateString === tomorrowString;
        break;
      }
      case "week": {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const weekFromNowString = weekFromNow.toISOString().split("T")[0];
        matchesDate =
          appointmentDateString >= todayString &&
          appointmentDateString <= weekFromNowString;
        break;
      }
      case "upcoming":
        // Show all appointments from today onwards
        matchesDate = appointmentDateString >= todayString;
        break;
      default:
        matchesDate = true;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Show loading state
  if (appointmentsLoading || customersLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING: {
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600"
          >
            Pending
          </Badge>
        );
      }
      case APPOINTMENT_STATUS.COMPLETED: {
        return (
          <Badge className="bg-primary text-primary-foreground">
            Completed
          </Badge>
        );
      }
      case APPOINTMENT_STATUS.CANCELLED: {
        return <Badge variant="destructive">Cancelled</Badge>;
      }
      case "confirmed": {
        return (
          <Badge className="bg-accent text-accent-foreground">Confirmed</Badge>
        );
      }
      default: {
        return <Badge variant="outline">{status}</Badge>;
      }
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsEditOpen(true);
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    if (!organizationId) {
      console.error("Organization ID is missing");
      return;
    }

    // Validate that the status is a valid APPOINTMENT_STATUS
    if (!Object.values(APPOINTMENT_STATUS).includes(newStatus as APPOINTMENT_STATUS)) {
      console.error("Invalid appointment status:", newStatus);
      return;
    }

    try {
      await updateAppointment.mutateAsync({
        id: appointmentId,
        data: { status: newStatus as APPOINTMENT_STATUS },
        organizationId: organizationId,
      });
    } catch (error) {
      console.error("Failed to update appointment status:", error);
    }
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">
            Appointments ({filteredAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.map((appointment) => {
                const customer = customersMap[appointment.customerId];
                const service = servicesMap[appointment.serviceId];
                const appointmentDate = appointment.startTime
                  ? formatUtcDateTime(appointment.startTime, "MMM dd, yyyy")
                  : "N/A";
                const appointmentTime = appointment.startTime
                  ? formatUtcDateTime(appointment.startTime, "HH:mm")
                  : "N/A";

                return (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {customer?.name || "Unknown Customer"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {customer?.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {service?.name || appointment.title || "Unknown Service"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.description &&
                          appointment.description.length > 30
                            ? `${appointment.description.substring(0, 30)}...`
                            : appointment.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointmentDate}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointmentTime}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {appointment.duration} min
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {appointment.fee === 0 ? "Free" : appointment.fee}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(appointment)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(appointment)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Appointment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {appointment.status ===
                            APPOINTMENT_STATUS.PENDING && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(
                                  appointment.id,
                                  APPOINTMENT_STATUS.COMPLETED,
                                )
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              handleStatusChange(
                                appointment.id,
                                APPOINTMENT_STATUS.CANCELLED,
                              )
                            }
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteAppointment(appointment)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Appointment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredAppointments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No appointments found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <AppointmentDetails
              appointment={selectedAppointment}
              onEdit={() => {
                setIsDetailsOpen(false);
                handleEdit(selectedAppointment);
              }}
              onStatusChange={handleStatusChange}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 !grid !grid-rows-[auto_1fr] !gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-xl font-semibold">Edit Appointment</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden">
            {editingAppointment && (
              <AppointmentForm
                appointment={editingAppointment}
                onSuccess={() => setIsEditOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Appointment Dialog */}
      <AppointmentDeleteDialog
        appointment={appointmentToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      />
    </>
  );
}
