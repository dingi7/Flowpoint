import {
  AnalyticsDailyRepository,
  AnalyticsDashboardResponse,
  AnalyticsInsightRepository,
  AppointmentRepository,
  CalendarRepository,
  CustomerRepository,
  LoggerService,
  MemberRepository,
  OrganizationRepository,
  ServiceRepository,
} from "@/core";
import { buildAnalyticsDashboardResponse } from "./analytics-calculations";
import {
  normalizeAnalyticsDateRange,
  rebuildAnalyticsFn,
} from "./rebuild-analytics";

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

function getExpectedDayCount(payload: { startDate: string; endDate: string }) {
  const start = new Date(`${payload.startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${payload.endDate}T00:00:00.000Z`).getTime();

  return Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
}

export async function getAnalyticsDashboardFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<AnalyticsDashboardResponse> {
  const { organizationId } = payload;
  const {
    analyticsDailyRepository,
    analyticsInsightRepository,
    loggerService,
    organizationRepository,
  } = dependencies;
  const { startDate, endDate, periodStartAt, periodEndAt } =
    normalizeAnalyticsDateRange(payload);
  const organization = await organizationRepository.get({ id: organizationId });
  const timezone = organization?.settings.timezone || "UTC";

  const [dailyAnalytics, insights] = await Promise.all([
    analyticsDailyRepository.getAll({
      organizationId,
      queryConstraints: [
        { field: "date", operator: ">=", value: startDate },
        { field: "date", operator: "<=", value: endDate },
      ],
      orderBy: { field: "date", direction: "asc" },
    }),
    analyticsInsightRepository.getAll({
      organizationId,
      queryConstraints: [
        { field: "periodStartAt", operator: "==", value: periodStartAt },
        { field: "periodEndAt", operator: "==", value: periodEndAt },
      ],
    }),
  ]);

  if (dailyAnalytics.length < getExpectedDayCount({ startDate, endDate })) {
    loggerService.info("Analytics dashboard cache incomplete; rebuilding", {
      organizationId,
      startDate,
      endDate,
      dailyDocuments: dailyAnalytics.length,
    });

    return rebuildAnalyticsFn(payload, dependencies);
  }

  return buildAnalyticsDashboardResponse({
    dailyAnalytics,
    insights,
    startDate,
    endDate,
    timezone,
  });
}
