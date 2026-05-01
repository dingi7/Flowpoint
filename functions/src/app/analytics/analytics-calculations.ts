import {
  ANALYTICS_INSIGHT_SEVERITY,
  ANALYTICS_INSIGHT_TYPE,
  APPOINTMENT_STATUS,
  AnalyticsCustomerValue,
  AnalyticsDaily,
  AnalyticsDailyData,
  AnalyticsDashboardResponse,
  AnalyticsDashboardSummary,
  AnalyticsHourBucket,
  AnalyticsInsight,
  AnalyticsInsightData,
  AnalyticsMetric,
  Appointment,
  Calendar,
  Customer,
  DAY_OF_WEEK,
  Member,
  Service,
} from "@/core";
import { timeStringToMinutes } from "@/app/availability/util/helpers";

const DEFAULT_TIMEZONE = "UTC";
const DAY_LABELS: Record<DAY_OF_WEEK, string> = {
  [DAY_OF_WEEK.MONDAY]: "Mondays",
  [DAY_OF_WEEK.TUESDAY]: "Tuesdays",
  [DAY_OF_WEEK.WEDNESDAY]: "Wednesdays",
  [DAY_OF_WEEK.THURSDAY]: "Thursdays",
  [DAY_OF_WEEK.FRIDAY]: "Fridays",
  [DAY_OF_WEEK.SATURDAY]: "Saturdays",
  [DAY_OF_WEEK.SUNDAY]: "Sundays",
};

const WEEKDAY_TO_DAY_OF_WEEK: Record<string, DAY_OF_WEEK> = {
  monday: DAY_OF_WEEK.MONDAY,
  tuesday: DAY_OF_WEEK.TUESDAY,
  wednesday: DAY_OF_WEEK.WEDNESDAY,
  thursday: DAY_OF_WEEK.THURSDAY,
  friday: DAY_OF_WEEK.FRIDAY,
  saturday: DAY_OF_WEEK.SATURDAY,
  sunday: DAY_OF_WEEK.SUNDAY,
};

interface BuildAnalyticsPayload {
  appointments: Appointment[];
  services: Service[];
  members: Member[];
  customers: Customer[];
  calendars: Calendar[];
  startDate: string;
  endDate: string;
  timezone?: string;
}

interface GetDashboardPayload {
  dailyAnalytics: AnalyticsDaily[];
  insights: AnalyticsInsight[];
  startDate: string;
  endDate: string;
  timezone?: string;
}

interface ZonedDateParts {
  dateKey: string;
  dayOfWeek: DAY_OF_WEEK;
  hour: number;
}

function createEmptyMetric(payload: { id: string; name: string }): AnalyticsMetric {
  return {
    id: payload.id,
    name: payload.name,
    bookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    noShowBookings: 0,
    revenue: 0,
    bookedMinutes: 0,
  };
}

function createEmptyHourBucket(payload: {
  dayOfWeek: DAY_OF_WEEK;
  hour: number;
}): AnalyticsHourBucket {
  return {
    dayOfWeek: payload.dayOfWeek,
    hour: payload.hour,
    bookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    noShowBookings: 0,
    revenue: 0,
    bookedMinutes: 0,
    availableMinutes: 0,
    utilizationRate: 0,
  };
}

function normalizeDateKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid analytics date: ${value}`);
  }

  return date.toISOString().slice(0, 10);
}

function iterateDateKeys(payload: { startDate: string; endDate: string }): string[] {
  const startDate = normalizeDateKey(payload.startDate);
  const endDate = normalizeDateKey(payload.endDate);
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function getZonedDateParts(payload: {
  date: Date;
  timezone: string;
}): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: payload.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(payload.date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekday = String(values.weekday || "").toLowerCase();
  const dayOfWeek = WEEKDAY_TO_DAY_OF_WEEK[weekday] || DAY_OF_WEEK.MONDAY;

  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    dayOfWeek,
    hour: Number(values.hour || 0) % 24,
  };
}

function getDayOfWeekForDateKey(payload: {
  dateKey: string;
  timezone: string;
}): DAY_OF_WEEK {
  const date = new Date(`${payload.dateKey}T12:00:00.000Z`);
  return getZonedDateParts({ date, timezone: payload.timezone }).dayOfWeek;
}

function formatHourRange(payload: { startHour: number; endHour: number }): string {
  const formatHour = (hour: number) => {
    const normalizedHour = hour % 24;
    const suffix = normalizedHour >= 12 ? "PM" : "AM";
    const displayHour = normalizedHour % 12 || 12;
    return `${displayHour} ${suffix}`;
  };

  return `${formatHour(payload.startHour)}-${formatHour(payload.endHour)}`;
}

function calculateRate(payload: { numerator: number; denominator: number }): number {
  if (payload.denominator <= 0) {
    return 0;
  }

  return payload.numerator / payload.denominator;
}

function addMetricValues(payload: {
  metric: AnalyticsMetric;
  appointment: Appointment;
  revenue: number;
}) {
  payload.metric.bookings += 1;
  payload.metric.bookedMinutes += payload.appointment.duration || 0;

  if (payload.appointment.status === APPOINTMENT_STATUS.COMPLETED) {
    payload.metric.completedBookings += 1;
    payload.metric.revenue += payload.revenue;
  }

  if (payload.appointment.status === APPOINTMENT_STATUS.CANCELLED) {
    payload.metric.cancelledBookings += 1;
  }

  if (payload.appointment.status === APPOINTMENT_STATUS.NO_SHOW) {
    payload.metric.noShowBookings += 1;
  }
}

function getAppointmentRevenue(appointment: Appointment): number {
  if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
    return 0;
  }

  return appointment.finalFee ?? appointment.fee ?? 0;
}

function createDailySkeleton(payload: {
  date: string;
  timezone: string;
}): AnalyticsDailyData {
  return {
    date: payload.date,
    timezone: payload.timezone,
    periodStartAt: `${payload.date}T00:00:00.000Z`,
    periodEndAt: `${payload.date}T23:59:59.999Z`,
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    noShowBookings: 0,
    totalRevenue: 0,
    bookedMinutes: 0,
    availableMinutes: 0,
    utilizationRate: 0,
    activeCustomerCount: 0,
    repeatCustomerCount: 0,
    retentionRate: 0,
    averageCustomerLifetimeValue: 0,
    revenueByService: {},
    revenueByEmployee: {},
    customerLifetimeValue: {},
    hourBuckets: {},
  };
}

function addAvailability(payload: {
  dailyAnalytics: Record<string, AnalyticsDailyData>;
  calendars: Calendar[];
  timezone: string;
}) {
  for (const [dateKey, daily] of Object.entries(payload.dailyAnalytics)) {
    const dayOfWeek = getDayOfWeekForDateKey({
      dateKey,
      timezone: payload.timezone,
    });

    for (const calendar of payload.calendars) {
      const workingBlocks = calendar.workingHours[dayOfWeek] || [];

      for (const workingBlock of workingBlocks) {
        const startMinutes = timeStringToMinutes(workingBlock.start);
        const endMinutes = timeStringToMinutes(workingBlock.end);
        daily.availableMinutes += Math.max(0, endMinutes - startMinutes);

        for (let hour = 0; hour < 24; hour++) {
          const hourStart = hour * 60;
          const hourEnd = hourStart + 60;
          const overlapMinutes = Math.max(
            0,
            Math.min(endMinutes, hourEnd) - Math.max(startMinutes, hourStart),
          );

          if (overlapMinutes <= 0) {
            continue;
          }

          const bucketKey = `${dayOfWeek}-${hour}`;
          daily.hourBuckets[bucketKey] =
            daily.hourBuckets[bucketKey] ||
            createEmptyHourBucket({ dayOfWeek, hour });
          daily.hourBuckets[bucketKey].availableMinutes += overlapMinutes;
        }
      }
    }
  }
}

export function buildDailyAnalytics(
  payload: BuildAnalyticsPayload,
): AnalyticsDailyData[] {
  const timezone = payload.timezone || DEFAULT_TIMEZONE;
  const dateKeys = iterateDateKeys({
    startDate: payload.startDate,
    endDate: payload.endDate,
  });
  const dailyAnalytics = Object.fromEntries(
    dateKeys.map((dateKey) => [
      dateKey,
      createDailySkeleton({ date: dateKey, timezone }),
    ]),
  );
  const servicesById = new Map(payload.services.map((service) => [service.id, service]));
  const membersById = new Map(payload.members.map((member) => [member.id, member]));
  const customersById = new Map(
    payload.customers.map((customer) => [customer.id, customer]),
  );
  const customerCompletedCountsByDay = new Map<string, Map<string, number>>();

  addAvailability({
    dailyAnalytics,
    calendars: payload.calendars,
    timezone,
  });

  for (const appointment of payload.appointments) {
    const startDate = new Date(appointment.startTime);
    if (Number.isNaN(startDate.getTime())) {
      continue;
    }

    const zonedParts = getZonedDateParts({ date: startDate, timezone });
    const daily = dailyAnalytics[zonedParts.dateKey];
    if (!daily) {
      continue;
    }

    const revenue = getAppointmentRevenue(appointment);
    const duration = appointment.duration || 0;
    const service = servicesById.get(appointment.serviceId);
    const member = membersById.get(appointment.assigneeId);
    const customer = customersById.get(appointment.customerId);
    const serviceMetricId = appointment.serviceId || "unknown-service";
    const employeeMetricId = appointment.assigneeId || "unknown-employee";
    const customerMetricId = appointment.customerId || "unknown-customer";

    daily.totalBookings += 1;
    daily.bookedMinutes +=
      appointment.status === APPOINTMENT_STATUS.CANCELLED ? 0 : duration;
    daily.totalRevenue += revenue;

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      daily.completedBookings += 1;
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      daily.cancelledBookings += 1;
    }

    if (appointment.status === APPOINTMENT_STATUS.NO_SHOW) {
      daily.noShowBookings += 1;
    }

    daily.revenueByService[serviceMetricId] =
      daily.revenueByService[serviceMetricId] ||
      createEmptyMetric({
        id: serviceMetricId,
        name: service?.name || "Unknown service",
      });
    addMetricValues({
      metric: daily.revenueByService[serviceMetricId],
      appointment,
      revenue,
    });

    daily.revenueByEmployee[employeeMetricId] =
      daily.revenueByEmployee[employeeMetricId] ||
      createEmptyMetric({
        id: employeeMetricId,
        name: member?.name || "Unknown employee",
      });
    addMetricValues({
      metric: daily.revenueByEmployee[employeeMetricId],
      appointment,
      revenue,
    });

    daily.customerLifetimeValue[customerMetricId] =
      daily.customerLifetimeValue[customerMetricId] || {
        id: customerMetricId,
        name: customer?.name || "Unknown customer",
        email: customer?.email,
        completedBookings: 0,
        revenue: 0,
      };

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      daily.customerLifetimeValue[customerMetricId].completedBookings += 1;
      daily.customerLifetimeValue[customerMetricId].revenue += revenue;
      const completedCounts =
        customerCompletedCountsByDay.get(zonedParts.dateKey) || new Map();
      completedCounts.set(
        customerMetricId,
        (completedCounts.get(customerMetricId) || 0) + 1,
      );
      customerCompletedCountsByDay.set(zonedParts.dateKey, completedCounts);
    }

    const bucketKey = `${zonedParts.dayOfWeek}-${zonedParts.hour}`;
    daily.hourBuckets[bucketKey] =
      daily.hourBuckets[bucketKey] ||
      createEmptyHourBucket({
        dayOfWeek: zonedParts.dayOfWeek,
        hour: zonedParts.hour,
      });
    daily.hourBuckets[bucketKey].bookings += 1;
    daily.hourBuckets[bucketKey].bookedMinutes +=
      appointment.status === APPOINTMENT_STATUS.CANCELLED ? 0 : duration;
    daily.hourBuckets[bucketKey].revenue += revenue;

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      daily.hourBuckets[bucketKey].completedBookings += 1;
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      daily.hourBuckets[bucketKey].cancelledBookings += 1;
    }

    if (appointment.status === APPOINTMENT_STATUS.NO_SHOW) {
      daily.hourBuckets[bucketKey].noShowBookings += 1;
    }
  }

  for (const [dateKey, daily] of Object.entries(dailyAnalytics)) {
    const completedCounts = customerCompletedCountsByDay.get(dateKey) || new Map();
    const activeCustomerCount = completedCounts.size;
    const repeatCustomerCount = Array.from(completedCounts.values()).filter(
      (count) => count > 1,
    ).length;
    const customerValues = Object.values(daily.customerLifetimeValue).filter(
      (customer) => customer.completedBookings > 0,
    );

    daily.activeCustomerCount = activeCustomerCount;
    daily.repeatCustomerCount = repeatCustomerCount;
    daily.retentionRate = calculateRate({
      numerator: repeatCustomerCount,
      denominator: activeCustomerCount,
    });
    daily.averageCustomerLifetimeValue = calculateRate({
      numerator: daily.totalRevenue,
      denominator: customerValues.length,
    });
    daily.utilizationRate = calculateRate({
      numerator: daily.bookedMinutes,
      denominator: daily.availableMinutes,
    });

    for (const bucket of Object.values(daily.hourBuckets)) {
      bucket.utilizationRate = calculateRate({
        numerator: bucket.bookedMinutes,
        denominator: bucket.availableMinutes,
      });
    }
  }

  return Object.values(dailyAnalytics);
}

function mergeMetric(
  metrics: Record<string, AnalyticsMetric>,
  metric: AnalyticsMetric,
) {
  metrics[metric.id] =
    metrics[metric.id] || createEmptyMetric({ id: metric.id, name: metric.name });
  metrics[metric.id].bookings += metric.bookings;
  metrics[metric.id].completedBookings += metric.completedBookings;
  metrics[metric.id].cancelledBookings += metric.cancelledBookings;
  metrics[metric.id].noShowBookings += metric.noShowBookings;
  metrics[metric.id].revenue += metric.revenue;
  metrics[metric.id].bookedMinutes += metric.bookedMinutes;
}

function mergeCustomerValue(
  customers: Record<string, AnalyticsCustomerValue>,
  customer: AnalyticsCustomerValue,
) {
  customers[customer.id] = customers[customer.id] || {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    completedBookings: 0,
    revenue: 0,
  };
  customers[customer.id].completedBookings += customer.completedBookings;
  customers[customer.id].revenue += customer.revenue;
}

function mergeHourBucket(
  buckets: Record<string, AnalyticsHourBucket>,
  bucket: AnalyticsHourBucket,
) {
  const key = `${bucket.dayOfWeek}-${bucket.hour}`;
  buckets[key] =
    buckets[key] ||
    createEmptyHourBucket({
      dayOfWeek: bucket.dayOfWeek,
      hour: bucket.hour,
    });
  buckets[key].bookings += bucket.bookings;
  buckets[key].completedBookings += bucket.completedBookings;
  buckets[key].cancelledBookings += bucket.cancelledBookings;
  buckets[key].noShowBookings += bucket.noShowBookings;
  buckets[key].revenue += bucket.revenue;
  buckets[key].bookedMinutes += bucket.bookedMinutes;
  buckets[key].availableMinutes += bucket.availableMinutes;
  buckets[key].utilizationRate = calculateRate({
    numerator: buckets[key].bookedMinutes,
    denominator: buckets[key].availableMinutes,
  });
}

function sortByRevenue<T extends { revenue: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.revenue - a.revenue);
}

export function buildAnalyticsDashboardResponse(
  payload: GetDashboardPayload,
): AnalyticsDashboardResponse {
  const revenueByService: Record<string, AnalyticsMetric> = {};
  const revenueByEmployee: Record<string, AnalyticsMetric> = {};
  const customerLifetimeValue: Record<string, AnalyticsCustomerValue> = {};
  const hourBuckets: Record<string, AnalyticsHourBucket> = {};
  const summary: AnalyticsDashboardSummary = {
    totalRevenue: 0,
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    noShowBookings: 0,
    noShowRate: 0,
    utilizationRate: 0,
    retentionRate: 0,
    averageCustomerLifetimeValue: 0,
    activeCustomerCount: 0,
    repeatCustomerCount: 0,
  };
  let bookedMinutes = 0;
  let availableMinutes = 0;

  for (const daily of payload.dailyAnalytics) {
    summary.totalRevenue += daily.totalRevenue;
    summary.totalBookings += daily.totalBookings;
    summary.completedBookings += daily.completedBookings;
    summary.cancelledBookings += daily.cancelledBookings;
    summary.noShowBookings += daily.noShowBookings;
    bookedMinutes += daily.bookedMinutes;
    availableMinutes += daily.availableMinutes;
    summary.activeCustomerCount += daily.activeCustomerCount;
    summary.repeatCustomerCount += daily.repeatCustomerCount;

    Object.values(daily.revenueByService).forEach((metric) =>
      mergeMetric(revenueByService, metric),
    );
    Object.values(daily.revenueByEmployee).forEach((metric) =>
      mergeMetric(revenueByEmployee, metric),
    );
    Object.values(daily.customerLifetimeValue).forEach((customer) =>
      mergeCustomerValue(customerLifetimeValue, customer),
    );
    Object.values(daily.hourBuckets).forEach((bucket) =>
      mergeHourBucket(hourBuckets, bucket),
    );
  }

  const paidCustomers = Object.values(customerLifetimeValue).filter(
    (customer) => customer.completedBookings > 0,
  );
  summary.activeCustomerCount = paidCustomers.length;
  summary.repeatCustomerCount = paidCustomers.filter(
    (customer) => customer.completedBookings > 1,
  ).length;
  summary.noShowRate = calculateRate({
    numerator: summary.noShowBookings,
    denominator:
      summary.completedBookings +
      summary.noShowBookings +
      summary.cancelledBookings,
  });
  summary.utilizationRate = calculateRate({
    numerator: bookedMinutes,
    denominator: availableMinutes,
  });
  summary.retentionRate = calculateRate({
    numerator: summary.repeatCustomerCount,
    denominator: summary.activeCustomerCount,
  });
  summary.averageCustomerLifetimeValue = calculateRate({
    numerator: summary.totalRevenue,
    denominator: paidCustomers.length,
  });

  return {
    periodStartAt: `${payload.startDate}T00:00:00.000Z`,
    periodEndAt: `${payload.endDate}T23:59:59.999Z`,
    timezone: payload.timezone || DEFAULT_TIMEZONE,
    summary,
    revenueByService: sortByRevenue(Object.values(revenueByService)),
    revenueByEmployee: sortByRevenue(Object.values(revenueByEmployee)),
    topCustomersByLifetimeValue: sortByRevenue(paidCustomers).slice(0, 10),
    hourBuckets: Object.values(hourBuckets).sort(
      (a, b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.hour - b.hour,
    ),
    insights: payload.insights,
  };
}

function buildUtilizationInsight(payload: {
  type: ANALYTICS_INSIGHT_TYPE.UNDERBOOKED_PERIOD | ANALYTICS_INSIGHT_TYPE.PEAK_PERIOD;
  bucket: AnalyticsHourBucket;
  startDate: string;
  endDate: string;
}): AnalyticsInsightData {
  const generatedAt = new Date().toISOString();
  const dayLabel = DAY_LABELS[payload.bucket.dayOfWeek];
  const timeRange = formatHourRange({
    startHour: payload.bucket.hour,
    endHour: payload.bucket.hour + 1,
  });
  const utilization = Math.round(payload.bucket.utilizationRate * 100);

  if (payload.type === ANALYTICS_INSIGHT_TYPE.UNDERBOOKED_PERIOD) {
    return {
      type: ANALYTICS_INSIGHT_TYPE.UNDERBOOKED_PERIOD,
      severity: ANALYTICS_INSIGHT_SEVERITY.OPPORTUNITY,
      message: `${dayLabel} at ${timeRange} are underbooked (${utilization}% utilization).`,
      recommendation: "Consider a 10% slow-period discount or bundled add-on during this slot.",
      metric: payload.bucket.utilizationRate,
      dayOfWeek: payload.bucket.dayOfWeek,
      startHour: payload.bucket.hour,
      endHour: payload.bucket.hour + 1,
      generatedAt,
      periodStartAt: `${payload.startDate}T00:00:00.000Z`,
      periodEndAt: `${payload.endDate}T23:59:59.999Z`,
    };
  }

  return {
    type: ANALYTICS_INSIGHT_TYPE.PEAK_PERIOD,
    severity: ANALYTICS_INSIGHT_SEVERITY.INFO,
    message: `${dayLabel} at ${timeRange} are near capacity (${utilization}% utilization).`,
    recommendation: "Consider a 15% peak multiplier or steering discounts away from this slot.",
    metric: payload.bucket.utilizationRate,
    dayOfWeek: payload.bucket.dayOfWeek,
    startHour: payload.bucket.hour,
    endHour: payload.bucket.hour + 1,
    generatedAt,
    periodStartAt: `${payload.startDate}T00:00:00.000Z`,
    periodEndAt: `${payload.endDate}T23:59:59.999Z`,
  };
}

export function buildAnalyticsInsights(payload: {
  dashboard: AnalyticsDashboardResponse;
  startDate: string;
  endDate: string;
}): AnalyticsInsightData[] {
  const insights: AnalyticsInsightData[] = [];
  const bucketsWithAvailability = payload.dashboard.hourBuckets.filter(
    (bucket) => bucket.availableMinutes >= 120,
  );
  const underbookedBucket = [...bucketsWithAvailability]
    .filter((bucket) => bucket.utilizationRate < 0.35)
    .sort(
      (a, b) =>
        a.utilizationRate - b.utilizationRate ||
        b.availableMinutes - a.availableMinutes,
    )[0];
  const peakBucket = [...bucketsWithAvailability]
    .filter((bucket) => bucket.utilizationRate >= 0.8)
    .sort(
      (a, b) =>
        b.utilizationRate - a.utilizationRate ||
        b.availableMinutes - a.availableMinutes,
    )[0];

  if (underbookedBucket) {
    insights.push(
      buildUtilizationInsight({
        type: ANALYTICS_INSIGHT_TYPE.UNDERBOOKED_PERIOD,
        bucket: underbookedBucket,
        startDate: payload.startDate,
        endDate: payload.endDate,
      }),
    );
  }

  if (peakBucket) {
    insights.push(
      buildUtilizationInsight({
        type: ANALYTICS_INSIGHT_TYPE.PEAK_PERIOD,
        bucket: peakBucket,
        startDate: payload.startDate,
        endDate: payload.endDate,
      }),
    );
  }

  if (payload.dashboard.summary.noShowRate >= 0.1) {
    const noShowRate = Math.round(payload.dashboard.summary.noShowRate * 100);
    insights.push({
      type: ANALYTICS_INSIGHT_TYPE.NO_SHOW_RATE,
      severity: ANALYTICS_INSIGHT_SEVERITY.WARNING,
      message: `No-show rate is ${noShowRate}% for this period.`,
      recommendation: "Consider confirmation reminders or deposits for high-risk bookings.",
      metric: payload.dashboard.summary.noShowRate,
      generatedAt: new Date().toISOString(),
      periodStartAt: `${payload.startDate}T00:00:00.000Z`,
      periodEndAt: `${payload.endDate}T23:59:59.999Z`,
    });
  }

  return insights;
}

export function buildInsightId(payload: {
  insight: AnalyticsInsightData;
  startDate: string;
  endDate: string;
}): string {
  const day = payload.insight.dayOfWeek || "all";
  const startHour = payload.insight.startHour ?? "all";

  return [
    payload.insight.type,
    payload.startDate,
    payload.endDate,
    day,
    startHour,
  ].join("-");
}
