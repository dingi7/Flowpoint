import {
  AnalyticsDailyRepository,
  AnalyticsDashboardResponse,
  AnalyticsInsight,
  AnalyticsInsightData,
  AnalyticsInsightRepository,
  AppointmentRepository,
  CalendarRepository,
  CustomerRepository,
  LoggerService,
  MemberRepository,
  OrganizationRepository,
  ServiceRepository,
} from "@/core";
import {
  buildAnalyticsDashboardResponse,
  buildAnalyticsInsights,
  buildDailyAnalytics,
  buildInsightId,
} from "./analytics-calculations";

interface Payload {
  organizationId: string;
  startDate?: string;
  endDate?: string;
}

interface Dependencies {
  appointmentRepository: AppointmentRepository;
  analyticsDailyRepository: AnalyticsDailyRepository;
  analyticsInsightRepository: AnalyticsInsightRepository;
  calendarRepository: CalendarRepository;
  customerRepository: CustomerRepository;
  loggerService: LoggerService;
  memberRepository: MemberRepository;
  organizationRepository: OrganizationRepository;
  serviceRepository: ServiceRepository;
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

export function getDefaultAnalyticsDateRange(payload: {
  now?: Date;
  lookbackDays?: number;
}) {
  const now = payload.now || new Date();
  const lookbackDays = payload.lookbackDays ?? 90;
  const endDate = now.toISOString().slice(0, 10);
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  start.setUTCDate(start.getUTCDate() - lookbackDays + 1);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate,
  };
}

export function normalizeAnalyticsDateRange(payload: Payload) {
  const defaults = getDefaultAnalyticsDateRange({});
  const startDate = normalizeDateKey(payload.startDate || defaults.startDate);
  const endDate = normalizeDateKey(payload.endDate || defaults.endDate);

  if (startDate > endDate) {
    throw new Error("Analytics start date must be before end date");
  }

  return {
    startDate,
    endDate,
    periodStartAt: `${startDate}T00:00:00.000Z`,
    periodEndAt: `${endDate}T23:59:59.999Z`,
  };
}

function getPaddedQueryBounds(payload: { startDate: string; endDate: string }) {
  const start = new Date(`${payload.startDate}T00:00:00.000Z`);
  const end = new Date(`${payload.endDate}T23:59:59.999Z`);
  start.setUTCDate(start.getUTCDate() - 1);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  };
}

function toInsightEntity(payload: {
  id: string;
  insight: AnalyticsInsightData;
}): AnalyticsInsight {
  return {
    id: payload.id,
    ...payload.insight,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function rebuildAnalyticsFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<AnalyticsDashboardResponse> {
  const { organizationId } = payload;
  const {
    analyticsDailyRepository,
    analyticsInsightRepository,
    appointmentRepository,
    calendarRepository,
    customerRepository,
    loggerService,
    memberRepository,
    organizationRepository,
    serviceRepository,
  } = dependencies;
  const { startDate, endDate, periodStartAt, periodEndAt } =
    normalizeAnalyticsDateRange(payload);
  const organization = await organizationRepository.get({ id: organizationId });
  const timezone = organization?.settings.timezone || "UTC";
  const queryBounds = getPaddedQueryBounds({ startDate, endDate });

  loggerService.info("Rebuilding analytics", {
    organizationId,
    startDate,
    endDate,
    timezone,
  });

  const [appointments, services, members, customers, calendars] =
    await Promise.all([
      appointmentRepository.getAll({
        organizationId,
        queryConstraints: [
          { field: "startTime", operator: ">=", value: queryBounds.startAt },
          { field: "startTime", operator: "<=", value: queryBounds.endAt },
        ],
        orderBy: { field: "startTime", direction: "asc" },
      }),
      serviceRepository.getAll({ organizationId }),
      memberRepository.getAll({ organizationId }),
      customerRepository.getAll({ organizationId }),
      calendarRepository.getAll({ organizationId }),
    ]);

  const dailyAnalytics = buildDailyAnalytics({
    appointments,
    services,
    members,
    customers,
    calendars,
    startDate,
    endDate,
    timezone,
  });

  await Promise.all(
    dailyAnalytics.map((daily) =>
      analyticsDailyRepository.set({
        id: daily.date,
        data: daily,
        organizationId,
      }),
    ),
  );

  const existingInsights = await analyticsInsightRepository.getAll({
    organizationId,
    queryConstraints: [
      { field: "periodStartAt", operator: "==", value: periodStartAt },
      { field: "periodEndAt", operator: "==", value: periodEndAt },
    ],
  });
  await Promise.all(
    existingInsights.map((insight) =>
      analyticsInsightRepository.delete({ id: insight.id, organizationId }),
    ),
  );

  const dashboardWithoutInsights = buildAnalyticsDashboardResponse({
    dailyAnalytics: dailyAnalytics.map((daily) => ({
      id: daily.date,
      ...daily,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    insights: [],
    startDate,
    endDate,
    timezone,
  });
  const insightData = buildAnalyticsInsights({
    dashboard: dashboardWithoutInsights,
    startDate,
    endDate,
  });
  const insights = insightData.map((insight) => {
    const id = buildInsightId({ insight, startDate, endDate });
    return toInsightEntity({
      id,
      insight,
    });
  });

  await Promise.all(
    insightData.map((insight) =>
      analyticsInsightRepository.set({
        id: buildInsightId({ insight, startDate, endDate }),
        data: insight,
        organizationId,
      }),
    ),
  );

  loggerService.info("Analytics rebuilt", {
    organizationId,
    dailyDocuments: dailyAnalytics.length,
    insights: insights.length,
  });

  return {
    ...dashboardWithoutInsights,
    insights,
  };
}
