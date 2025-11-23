import { AppointmentForm } from "@/components/appointment/AppointmentForm";
import { CustomerForm } from "@/components/customer/CustomerForm";
import { FirstTimeUserWelcome } from "@/components/onboarding/FirstTimeUserWelcome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { APPOINTMENT_STATUS } from "@/core";
import { useCustomers, useGetAllAppointments, useServices } from "@/hooks";
import { useOrganizations } from "@/stores";
import { formatPrice } from "@/utils/price-format";
import { useUser } from "@clerk/clerk-react";
import { format } from "date-fns";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useUser();
  const organizations = useOrganizations();
  const navigate = useNavigate();
  const [isBookAppointmentOpen, setIsBookAppointmentOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Fetch dashboard data using existing hooks
  const customersQuery = useCustomers({ pagination: { limit: 1000 } });
  const servicesQuery = useServices({ pagination: { limit: 1000 } });
  const allAppointmentsQuery = useGetAllAppointments();

  // If no organizations, show the first-time user welcome experience
  if (organizations.length === 0) {
    return <FirstTimeUserWelcome />;
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground font-sans mb-2">
          Welcome back
          {user?.firstName
            ? `, ${user.firstName}`
            : user?.lastName
              ? `, ${user.lastName}`
              : ""}
          !
        </h2>
        <p className="text-muted-foreground">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {customersQuery.isPending ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {customersQuery.data?.pages[0]?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active customers in your organization
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Appointments Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Appointments Today
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {allAppointmentsQuery.isPending ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {allAppointmentsQuery.data?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {allAppointmentsQuery.data?.filter(
                    (apt) => apt.status === APPOINTMENT_STATUS.COMPLETED,
                  ).length || 0}{" "}
                  completed,{" "}
                  {allAppointmentsQuery.data?.filter(
                    (apt) =>
                      apt.status !== APPOINTMENT_STATUS.COMPLETED &&
                      apt.status !== APPOINTMENT_STATUS.CANCELLED,
                  ).length || 0}{" "}
                  upcoming
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {allAppointmentsQuery.isPending ? (
              <>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  $
                  {formatPrice(
                    allAppointmentsQuery.data?.reduce(
                      (sum, apt) => sum + (apt.fee || 0),
                      0,
                    ) || 0,
                    true,
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  From completed appointments
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {servicesQuery.isPending ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {servicesQuery.data?.pages[0]?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Services available for booking
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Most Popular Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full justify-start gap-3"
              size="lg"
              onClick={() => setIsBookAppointmentOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Schedule New Appointment
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-transparent"
              size="lg"
              onClick={() => setIsAddCustomerOpen(true)}
            >
              <Users className="h-4 w-4" />
              Add New Customer
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-transparent"
              size="lg"
              onClick={() => navigate("/calendar")}
            >
              <Calendar className="h-4 w-4" />
              View Today's Schedule
            </Button>
          </CardContent>
        </Card>

        {/* Most Popular Services */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Most Popular Services</CardTitle>
            <CardDescription>Top services by bookings and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {allAppointmentsQuery.isPending || servicesQuery.isPending ? (
              <>
                <Skeleton className="h-16 w-full mb-3" />
                <Skeleton className="h-16 w-full mb-3" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (() => {
              // Calculate service statistics from appointments
              const serviceStats = new Map<string, { name: string; bookings: number; revenue: number }>();

              // Get all services as a map for quick lookup
              const servicesMap = new Map(
                servicesQuery.data?.pages.flatMap(page => page).map(service => [service.id, service]) || []
              );

              // Aggregate data from appointments
              allAppointmentsQuery.data?.forEach(appointment => {
                const service = servicesMap.get(appointment.serviceId);
                if (service) {
                  const existing = serviceStats.get(appointment.serviceId) || {
                    name: service.name,
                    bookings: 0,
                    revenue: 0,
                  };

                  serviceStats.set(appointment.serviceId, {
                    name: existing.name,
                    bookings: existing.bookings + 1,
                    revenue: existing.revenue + (appointment.fee || 0),
                  });
                }
              });

              // Convert to array and sort by bookings (descending)
              const topServices = Array.from(serviceStats.values())
                .sort((a, b) => b.bookings - a.bookings)
                .slice(0, 5);

              return topServices.length > 0 ? (
                <div className="space-y-3">
                  {topServices.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.bookings} {service.bookings === 1 ? 'booking' : 'bookings'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          ${formatPrice(service.revenue, true)}
                        </p>
                        <p className="text-xs text-muted-foreground">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No service data available yet
                </p>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Appointment Booking Dialog */}
      <Dialog
        open={isBookAppointmentOpen}
        onOpenChange={setIsBookAppointmentOpen}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 !grid !grid-rows-[auto_1fr] !gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-xl font-semibold">
              Book New Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden">
            <AppointmentForm
              onSuccess={() => setIsBookAppointmentOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="sm:min-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm onSuccess={() => setIsAddCustomerOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Today's Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-sans">Today's Appointments</CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/calendar")}
          >
            View Calendar
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allAppointmentsQuery.isPending ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : allAppointmentsQuery.data?.length ? (
              allAppointmentsQuery.data?.map((appointment) => {
                const startTime = new Date(appointment.startTime);
                const statusBadgeColor =
                  appointment.status === APPOINTMENT_STATUS.COMPLETED
                    ? "bg-accent text-accent-foreground"
                    : appointment.status === APPOINTMENT_STATUS.CANCELLED
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-yellow-100 text-yellow-800";

                return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium">
                          {format(startTime, "h:mm")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(startTime, "a")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{appointment.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Duration: {appointment.duration} min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {appointment.duration} min
                      </Badge>
                      <Badge className={statusBadgeColor}>
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No appointments scheduled for today
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
