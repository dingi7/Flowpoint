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
import {
  ANALYTICS_INSIGHT_TYPE,
  APPOINTMENT_STATUS,
  PRICING_RULE_TYPE,
} from "@/core";
import {
  useAnalyticsDashboard,
  useAppointments,
  useCustomers,
  useServices,
} from "@/hooks";
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
  Lightbulb,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useUser();
  const organizations = useOrganizations();
  const navigate = useNavigate();
  const [isBookAppointmentOpen, setIsBookAppointmentOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const { t } = useTranslation();

  // const dashboardLookbackDate = useMemo(() => {
  //   const date = new Date();
  //   date.setDate(date.getDate() - 90);
  //   return date;
  // }, []);

  // Fetch dashboard data using existing hooks
  const customersQuery = useCustomers({ pagination: { limit: 200 } });
  const servicesQuery = useServices({ pagination: { limit: 200 } });
  const appointmentsQuery = useAppointments({
    // queryConstraints: [
    //   { field: "startTime", operator: ">=", value: dashboardLookbackDate },
    // ],
    pagination: { limit: 200 },
    orderBy: { field: "startTime", direction: "desc" },
  });
  const analyticsQuery = useAnalyticsDashboard();
  const analytics = analyticsQuery.data;

  const appointments = useMemo(
    () => appointmentsQuery.data?.pages.flatMap((page) => page) || [],
    [appointmentsQuery.data],
  );

  // Calculate top services from completed appointments only
  const topServices = useMemo(() => {
    if (analytics?.revenueByService.length) {
      return analytics.revenueByService.slice(0, 5).map((service) => ({
        name: service.name,
        bookings: service.bookings,
        revenue: service.revenue,
      }));
    }

    if (!appointments.length || !servicesQuery.data) return [];

    // Get all services as a map for quick lookup
    const servicesMap = new Map(
      servicesQuery.data.pages
        .flatMap((page) => page)
        .map((service) => [service.id, service]),
    );

    // Calculate service statistics from COMPLETED appointments only
    const serviceStats = new Map<
      string,
      { name: string; bookings: number; revenue: number }
    >();

    appointments
      .filter(
        (appointment) => appointment.status === APPOINTMENT_STATUS.COMPLETED,
      )
      .forEach((appointment) => {
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

    // Convert to array and sort by bookings (descending), take top 5
    return Array.from(serviceStats.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
  }, [analytics?.revenueByService, appointments, servicesQuery.data]);

  const formatPercent = (value?: number) => {
    return `${Math.round((value || 0) * 100)}%`;
  };

  const openPricingRecommendation = (payload: {
    type: PRICING_RULE_TYPE;
    dayOfWeek: string;
    startHour: number;
    endHour: number;
    name: string;
  }) => {
    const isPeak = payload.type === PRICING_RULE_TYPE.PEAK_MULTIPLIER;
    const params = new URLSearchParams({
      type: payload.type,
      dayOfWeek: payload.dayOfWeek,
      startTime: `${String(payload.startHour).padStart(2, "0")}:00`,
      endTime: `${String(payload.endHour).padStart(2, "0")}:00`,
      value: isPeak ? "1.15" : "10",
      priority: isPeak ? "20" : "10",
      label: isPeak ? "Peak price" : "Off-peak discount",
      name: payload.name,
    });
    navigate(`/pricing?${params.toString()}`);
  };

  // If no organizations, show the first-time user welcome experience
  if (organizations.length === 0) {
    return <FirstTimeUserWelcome />;
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground font-sans mb-2">
          {t("dashboard.welcome")}
          {user?.firstName
            ? `, ${user.firstName}`
            : user?.lastName
              ? `, ${user.lastName}`
              : ""}
          !
        </h2>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.totalCustomers")}
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
                  {t("dashboard.activeCustomers")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.totalAppointments")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {appointmentsQuery.isPending ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {analytics?.summary.totalBookings ?? appointments.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.summary.completedBookings ??
                    appointments.filter(
                      (apt) => apt.status === APPOINTMENT_STATUS.COMPLETED,
                    ).length}{" "}
                  {t("dashboard.completed")},{" "}
                  {analytics?.summary.noShowBookings ?? 0}{" "}
                  {t("dashboard.noShows")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.totalRevenue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {appointmentsQuery.isPending ? (
              <>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatPrice(
                    analytics?.summary.totalRevenue ??
                      appointments
                        .filter(
                          (apt) =>
                            apt.status === APPOINTMENT_STATUS.COMPLETED,
                        )
                        .reduce((sum, apt) => sum + (apt.fee || 0), 0),
                    true,
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.fromCompleted")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.activeServices")}
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
                  {t("dashboard.servicesAvailable")}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              {t("dashboard.insightsTitle")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.insightsSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsQuery.isPending ? (
              <>
                <Skeleton className="h-12 w-full mb-3" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : analytics?.insights.length ? (
              <div className="space-y-3">
                {analytics.insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-3">
                    <p className="text-sm font-medium">{insight.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {insight.recommendation}
                    </p>
                    {(insight.type ===
                      ANALYTICS_INSIGHT_TYPE.UNDERBOOKED_PERIOD ||
                      insight.type === ANALYTICS_INSIGHT_TYPE.PEAK_PERIOD) &&
                      insight.dayOfWeek &&
                      insight.startHour !== undefined &&
                      insight.endHour !== undefined && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() =>
                            openPricingRecommendation({
                              type:
                                insight.type ===
                                ANALYTICS_INSIGHT_TYPE.PEAK_PERIOD
                                  ? PRICING_RULE_TYPE.PEAK_MULTIPLIER
                                  : PRICING_RULE_TYPE.SLOW_PERIOD_DISCOUNT,
                              dayOfWeek: insight.dayOfWeek!,
                              startHour: insight.startHour!,
                              endHour: insight.endHour!,
                              name: insight.message,
                            })
                          }
                        >
                          {insight.type === ANALYTICS_INSIGHT_TYPE.PEAK_PERIOD
                            ? "Create peak rule"
                            : t("dashboard.createDiscount")}
                        </Button>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("dashboard.noInsights")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("dashboard.analyticsHealth")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("dashboard.retentionRate")}
              </span>
              <span className="font-semibold">
                {formatPercent(analytics?.summary.retentionRate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("dashboard.utilization")}
              </span>
              <span className="font-semibold">
                {formatPercent(analytics?.summary.utilizationRate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("dashboard.noShowRate")}
              </span>
              <span className="font-semibold">
                {formatPercent(analytics?.summary.noShowRate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("dashboard.averageClv")}
              </span>
              <span className="font-semibold">
                {formatPrice(
                  analytics?.summary.averageCustomerLifetimeValue || 0,
                  true,
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Most Popular Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">
              {t("dashboard.quickActions")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.quickActionsSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full justify-start gap-3"
              size="lg"
              onClick={() => setIsBookAppointmentOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t("dashboard.scheduleAppointment")}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-transparent"
              size="lg"
              onClick={() => setIsAddCustomerOpen(true)}
            >
              <Users className="h-4 w-4" />
              {t("dashboard.addCustomer")}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-transparent"
              size="lg"
              onClick={() => navigate("/calendar")}
            >
              <Calendar className="h-4 w-4" />
              {t("dashboard.viewSchedule")}
            </Button>
          </CardContent>
        </Card>

        {/* Most Popular Services */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">
              {t("dashboard.popularServices")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.popularServicesSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentsQuery.isPending || servicesQuery.isPending ? (
              <>
                <Skeleton className="h-16 w-full mb-3" />
                <Skeleton className="h-16 w-full mb-3" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : topServices.length > 0 ? (
              <div className="space-y-3">
                {topServices.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.bookings}{" "}
                        {service.bookings === 1
                          ? t("dashboard.booking")
                          : t("dashboard.bookings")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatPrice(service.revenue, true)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("dashboard.revenue")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("dashboard.noServiceData")}
              </p>
            )}
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
              {t("dashboard.scheduleAppointment")}
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
            <DialogTitle>{t("dashboard.addCustomer")}</DialogTitle>
          </DialogHeader>
          <CustomerForm onSuccess={() => setIsAddCustomerOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Today's Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-sans">
              {t("dashboard.todaysAppointments")}
            </CardTitle>
            <CardDescription>{t("dashboard.todaysSchedule")}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/calendar")}
          >
            {t("dashboard.viewCalendar")}
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointmentsQuery.isPending ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : (
              (() => {
                // Filter for today's appointments only
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const todaysAppointments = appointments.filter((appointment) => {
                  const appointmentDate = new Date(appointment.startTime);
                  return appointmentDate >= today && appointmentDate < tomorrow;
                });

                return todaysAppointments.length ? (
                  todaysAppointments.map((appointment) => {
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
                              {t("dashboard.duration")}: {appointment.duration}{" "}
                              {t("dashboard.min")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {appointment.duration} {t("dashboard.min")}
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
                    {t("dashboard.noAppointmentsToday")}
                  </p>
                );
              })()
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
