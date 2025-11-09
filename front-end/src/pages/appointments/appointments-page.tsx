import { AppointmentForm } from "@/components/appointment/AppointmentForm";
import { AppointmentList } from "@/components/appointment/AppointmentList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APPOINTMENT_STATUS } from "@/core";
import { useAppointments } from "@/hooks/repository-hooks/appointment/use-appointment";
import { endOfDay, startOfDay } from "date-fns";
import {
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

export default function AppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isBookAppointmentOpen, setIsBookAppointmentOpen] = useState(false);

  // Fetch appointments data
  const { data: appointmentsData } = useAppointments({
    pagination: { limit: 1000 },
    orderBy: { field: "startTime", direction: "asc" },
  });

  const appointments = appointmentsData?.pages.flatMap((page) => page) || [];

  // Calculate real stats from appointments data
  const stats = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // This week (Monday to Sunday of current week)
    // today.getDay() returns 0-6 (Sunday=0, Monday=1, ..., Saturday=6)
    // We want Monday, so we subtract (today.getDay() - 1) days
    const weekStart = startOfDay(
      new Date(today.getTime() - (today.getDay() - 1) * 24 * 60 * 60 * 1000),
    );
    const weekEnd = endOfDay(
      new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    );

    // Last week (Monday to Sunday of the previous week)
    // Go back to Monday of previous week: subtract (today.getDay() + 6) days
    const lastWeekStart = startOfDay(
      new Date(today.getTime() - (today.getDay() + 6) * 24 * 60 * 60 * 1000),
    );
    const lastWeekEnd = endOfDay(
      new Date(lastWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    );

    // This month (from start of current month to end of current month)
    const monthStart = startOfDay(
      new Date(today.getFullYear(), today.getMonth(), 1),
    );
    const monthEnd = endOfDay(
      new Date(today.getFullYear(), today.getMonth() + 1, 0),
    );

    const todayAppointments = appointments.filter((appointment) => {
      if (!appointment.startTime) return false;
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate >= todayStart && appointmentDate <= todayEnd;
    });

    const thisWeekAppointments = appointments.filter((appointment) => {
      if (!appointment.startTime) return false;
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate >= weekStart && appointmentDate <= weekEnd;
    });

    const lastWeekAppointments = appointments.filter((appointment) => {
      if (!appointment.startTime) return false;
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate >= lastWeekStart && appointmentDate <= lastWeekEnd;
    });

    const pendingAppointments = appointments.filter(
      (appointment) => appointment.status === APPOINTMENT_STATUS.PENDING,
    );

    const overduePending = pendingAppointments.filter((appointment) => {
      if (!appointment.startTime) return false;
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate < todayStart;
    }).length;

    const completedAppointments = appointments.filter(
      (appointment) => appointment.status === APPOINTMENT_STATUS.COMPLETED,
    );

    const thisMonthCompleted = appointments.filter((appointment) => {
      if (
        !appointment.startTime ||
        appointment.status !== APPOINTMENT_STATUS.COMPLETED
      )
        return false;
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate >= monthStart && appointmentDate <= monthEnd;
    }).length;

    const todayCompleted = todayAppointments.filter(
      (appointment) => appointment.status === APPOINTMENT_STATUS.COMPLETED,
    ).length;

    const todayUpcoming = todayAppointments.filter(
      (appointment) =>
        appointment.status !== APPOINTMENT_STATUS.COMPLETED &&
        appointment.status !== APPOINTMENT_STATUS.CANCELLED,
    ).length;

    // Calculate percentage change from last week
    const lastWeekCount = lastWeekAppointments.length;
    const thisWeekCount = thisWeekAppointments.length;
    let weekPercentageChange = 0;

    if (lastWeekCount > 0) {
      weekPercentageChange = Math.round(
        ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100,
      );
    } else if (thisWeekCount > 0) {
      weekPercentageChange = thisWeekCount * 100; // 100% increase if no appointments last week
    }

    return {
      today: todayAppointments.length,
      thisWeek: thisWeekAppointments.length,
      pending: pendingAppointments.length,
      overduePending,
      completed: completedAppointments.length,
      thisMonthCompleted,
      todayCompleted,
      todayUpcoming,
      weekPercentageChange,
    };
  }, [appointments]);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Page Header */}
      <div className="flex sm:items-center justify-between mb-6 sm:flex-row flex-col">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-sans">
            Appointment Management
          </h2>
          <p className="text-muted-foreground">
            Schedule and manage customer appointments
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Dialog
            open={isBookAppointmentOpen}
            onOpenChange={setIsBookAppointmentOpen}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 !grid !grid-rows-[auto_1fr] !gap-0">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle className="text-xl font-semibold">
                  Book New Appointment
                </DialogTitle>
                <Separator />
              </DialogHeader>
              <div className="overflow-hidden">
                <AppointmentForm
                  onSuccess={() => setIsBookAppointmentOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayCompleted} completed, {stats.todayUpcoming} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">
              {stats.weekPercentageChange > 0 ? "+" : ""}
              {stats.weekPercentageChange}% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Confirmation
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overduePending > 0
                ? `${stats.overduePending} overdue`
                : "Require attention"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthCompleted}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search appointments by customer or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Appointments</SelectItem>
            <SelectItem value={APPOINTMENT_STATUS.PENDING}>Pending</SelectItem>
            <SelectItem value={APPOINTMENT_STATUS.COMPLETED}>
              Completed
            </SelectItem>
            <SelectItem value={APPOINTMENT_STATUS.CANCELLED}>
              Cancelled
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="tomorrow">Tomorrow</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appointment Tabs */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Appointments</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <AppointmentList
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            dateFilter={dateFilter}
          />
        </TabsContent>
        <TabsContent value="today" className="mt-6">
          <AppointmentList
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            dateFilter="today"
          />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-6">
          <AppointmentList
            searchQuery={searchQuery}
            statusFilter="all"
            dateFilter="upcoming"
          />
        </TabsContent>
        <TabsContent value="pending" className="mt-6">
          <AppointmentList
            searchQuery={searchQuery}
            statusFilter={APPOINTMENT_STATUS.PENDING}
            dateFilter={dateFilter}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
