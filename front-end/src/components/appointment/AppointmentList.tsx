"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { APPOINTMENT_STATUS, ASSIGNEE_TYPE } from "@/core";
import {
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { AppointmentDetails } from "./AppointmentDetails";
import { AppointmentForm } from "./AppointmentForm";

// Mock data - in real app this would come from API
const mockAppointments = [
  {
    id: "1",
    assigneeType: ASSIGNEE_TYPE.MEMBER,
    assigneeId: "staff-1",
    customerId: "1",
    serviceId: "1",
    title: "Hair Cut & Style",
    description: "First time client, prefers shorter styles",
    organizationId: "org-1",
    startTime: "2024-01-25T10:00:00Z",
    duration: 60,
    fee: 85,
    status: APPOINTMENT_STATUS.PENDING,
    createdAt: new Date("2024-01-20T00:00:00Z"),
    updatedAt: new Date("2024-01-20T00:00:00Z"),
  },
  {
    id: "2",
    assigneeType: ASSIGNEE_TYPE.MEMBER,
    assigneeId: "staff-2",
    customerId: "2",
    serviceId: "2",
    title: "Color Treatment",
    description: "Wants to go from brown to blonde",
    organizationId: "org-1",
    startTime: "2024-01-25T14:00:00Z",
    duration: 120,
    fee: 150,
    status: APPOINTMENT_STATUS.PENDING,
    createdAt: new Date("2024-01-22T00:00:00Z"),
    updatedAt: new Date("2024-01-22T00:00:00Z"),
  },
  {
    id: "3",
    assigneeType: ASSIGNEE_TYPE.MEMBER,
    assigneeId: "staff-1",
    customerId: "3",
    serviceId: "3",
    title: "Facial Treatment",
    description: "Regular monthly facial",
    organizationId: "org-1",
    startTime: "2024-01-24T11:30:00Z",
    duration: 90,
    fee: 120,
    status: APPOINTMENT_STATUS.COMPLETED,
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "4",
    assigneeType: ASSIGNEE_TYPE.MEMBER,
    assigneeId: "staff-3",
    customerId: "4",
    serviceId: "4",
    title: "Massage Therapy",
    description: "Focus on back and shoulders",
    organizationId: "org-1",
    startTime: "2024-01-26T16:30:00Z",
    duration: 75,
    fee: 100,
    status: APPOINTMENT_STATUS.PENDING,
    createdAt: new Date("2024-01-23T00:00:00Z"),
    updatedAt: new Date("2024-01-23T00:00:00Z"),
  },
  {
    id: "5",
    assigneeType: ASSIGNEE_TYPE.ORGANIZATION,
    assigneeId: "org-1",
    customerId: "5",
    serviceId: "5",
    title: "Consultation",
    description: "Cancelled due to illness",
    organizationId: "org-1",
    startTime: "2024-01-23T09:00:00Z",
    duration: 30,
    fee: 0,
    status: APPOINTMENT_STATUS.CANCELLED,
    createdAt: new Date("2024-01-20T00:00:00Z"),
    updatedAt: new Date("2024-01-20T00:00:00Z"),
  },
];

// Mock customer and service data for display
const mockCustomers = {
  "1": {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    avatar: "/abstract-geometric-shapes.png",
  },
  "2": {
    id: "2",
    name: "Mike Chen",
    email: "mike.chen@email.com",
    phone: "+1 (555) 234-5678",
    avatar: "/abstract-geometric-shapes.png",
  },
  "3": {
    id: "3",
    name: "Emma Wilson",
    email: "emma.wilson@email.com",
    phone: "+1 (555) 345-6789",
    avatar: "/abstract-geometric-shapes.png",
  },
  "4": {
    id: "4",
    name: "David Park",
    email: "david.park@email.com",
    phone: "+1 (555) 456-7890",
    avatar: "/abstract-geometric-shapes.png",
  },
  "5": {
    id: "5",
    name: "Lisa Zhang",
    email: "lisa.zhang@email.com",
    phone: "+1 (555) 567-8901",
    avatar: "/abstract-geometric-shapes.png",
  },
};

const mockServices = {
  "1": { id: "1", name: "Hair Cut & Style", duration: 60, price: 85 },
  "2": { id: "2", name: "Color Treatment", duration: 120, price: 150 },
  "3": { id: "3", name: "Facial Treatment", duration: 90, price: 120 },
  "4": { id: "4", name: "Massage Therapy", duration: 75, price: 100 },
  "5": { id: "5", name: "Consultation", duration: 30, price: 0 },
};

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
  const [selectedAppointment, setSelectedAppointment] = useState<
    (typeof mockAppointments)[0] | null
  >(null);
  const [editingAppointment, setEditingAppointment] = useState<
    (typeof mockAppointments)[0] | null
  >(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Filter appointments based on search, status, and date
  const filteredAppointments = mockAppointments.filter((appointment) => {
    const customer =
      mockCustomers[appointment.customerId as keyof typeof mockCustomers];
    const service =
      mockServices[appointment.serviceId as keyof typeof mockServices];

    const matchesSearch =
      customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || appointment.status === statusFilter;

    const today = new Date().toISOString().split("T")[0];
    const appointmentDate = appointment.startTime
      ? new Date(appointment.startTime).toISOString().split("T")[0]
      : today;
    let matchesDate = true;

    switch (dateFilter) {
      case "today":
        matchesDate = appointmentDate === today;
        break;
      case "tomorrow": {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        matchesDate = appointmentDate === tomorrow.toISOString().split("T")[0];
        break;
      }
      case "week": {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        matchesDate =
          appointmentDate >= today &&
          appointmentDate <= weekFromNow.toISOString().split("T")[0];
        break;
      }
      case "upcoming":
        matchesDate = appointmentDate >= today;
        break;
      default:
        matchesDate = true;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

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

  const handleViewDetails = (appointment: (typeof mockAppointments)[0]) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const handleEdit = (appointment: (typeof mockAppointments)[0]) => {
    setEditingAppointment(appointment);
    setIsEditOpen(true);
  };

  const handleStatusChange = (appointmentId: string, newStatus: string) => {
    // In real app, this would make an API call
    console.log(`Changing appointment ${appointmentId} status to ${newStatus}`);
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
                const customer =
                  mockCustomers[
                    appointment.customerId as keyof typeof mockCustomers
                  ];
                const service =
                  mockServices[
                    appointment.serviceId as keyof typeof mockServices
                  ];
                const appointmentDate = appointment.startTime
                  ? new Date(appointment.startTime).toLocaleDateString()
                  : "N/A";
                const appointmentTime = appointment.startTime
                  ? new Date(appointment.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A";

                return (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`${customer?.avatar}?height=40&width=40&query=${customer?.name}`}
                          />
                          <AvatarFallback>
                            {customer?.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("") || "N/A"}
                          </AvatarFallback>
                        </Avatar>
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
                          {service?.name || appointment.title}
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
                                handleStatusChange(appointment.id, "confirmed")
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm
                            </DropdownMenuItem>
                          )}
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
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
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
        <DialogContent className="min-w-4xl">
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
    </>
  );
}
