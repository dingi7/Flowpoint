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
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizations } from "@/stores";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomers, useServices, useGetAppointmentsByDate } from "@/hooks";
import { APPOINTMENT_STATUS } from "@/core";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user } = useUser();
  const organizations = useOrganizations();
  const navigate = useNavigate();
  
  // Fetch dashboard data using existing hooks
  const customersQuery = useCustomers({ pagination: { limit: 1 } });
  const servicesQuery = useServices({ pagination: { limit: 1000 } });
  const todayAppointmentsQuery = useGetAppointmentsByDate(new Date());

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
            {todayAppointmentsQuery.isPending ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {todayAppointmentsQuery.data?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {todayAppointmentsQuery.data?.filter(
                    (apt) => apt.status === APPOINTMENT_STATUS.COMPLETED
                  ).length || 0}{" "}
                  completed,{" "}
                  {todayAppointmentsQuery.data?.filter(
                    (apt) =>
                      apt.status !== APPOINTMENT_STATUS.COMPLETED &&
                      apt.status !== APPOINTMENT_STATUS.CANCELLED
                  ).length || 0}{" "}
                  upcoming
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Revenue This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue This Month
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {todayAppointmentsQuery.isPending ? (
              <>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  $
                  {(
                    todayAppointmentsQuery.data
                      ?.filter(
                        (apt) => apt.status === APPOINTMENT_STATUS.COMPLETED
                      )
                      .reduce(
                        (sum, apt) =>
                          sum + (apt.fee || 0),
                        0
                      ) || 0
                  ).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From completed appointments today
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

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start gap-3" size="lg">
              <Plus className="h-4 w-4" />
              Schedule New Appointment
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-transparent"
              size="lg"
            >
              <Users className="h-4 w-4" />
              Add New Customer
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-transparent"
              size="lg"
            >
              <Calendar className="h-4 w-4" />
              View Today's Schedule
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-sans">Recent Activity</CardTitle>
              <CardDescription>Latest updates from your CRM</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {customersQuery.isPending ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : customersQuery.data?.pages[0]?.length ? (
              customersQuery.data.pages[0]?.slice(0, 3).map((customer, idx) => (
                <div key={customer.id} className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 ${
                      idx === 0
                        ? "bg-accent"
                        : idx === 1
                          ? "bg-primary"
                          : "bg-muted-foreground"
                    } rounded-full`}
                  ></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New customer added</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.name} - {format(new Date(customer.createdAt), "MMM d, p")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

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
            {todayAppointmentsQuery.isPending ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : todayAppointmentsQuery.data?.length ? (
              todayAppointmentsQuery.data?.map((appointment) => {
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
