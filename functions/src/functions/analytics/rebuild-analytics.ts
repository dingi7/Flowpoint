import { Secrets } from "@/config/secrets";
import { rebuildAnalyticsFn } from "@/app/analytics/rebuild-analytics";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { checkBilling, isBillingRequiredError } from "@/utils/check-billing";
import { defineSecret } from "firebase-functions/params";
import { onCall } from "firebase-functions/https";

interface Payload {
  organizationId: string;
  startDate?: string;
  endDate?: string;
}

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const clerkService = serviceHost.getClerkService();
const clerkSecretKey = defineSecret(Secrets.CLERK_SECRET_KEY);

const analyticsDailyRepository =
  repositoryHost.getAnalyticsDailyRepository(databaseService);
const analyticsInsightRepository =
  repositoryHost.getAnalyticsInsightRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);
const calendarRepository =
  repositoryHost.getCalendarRepository(databaseService);
const customerRepository =
  repositoryHost.getCustomerRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);

export const rebuildAnalytics = onCall<Payload>(
  {
    secrets: [clerkSecretKey],
  },
  async (request) => {
    try {
      await checkBilling(
        { organizationId: request.data.organizationId },
        {
          organizationRepository,
          clerkService,
          clerkSecretKey: clerkSecretKey.value(),
          loggerService,
        },
      );

      return rebuildAnalyticsFn(request.data, {
        analyticsDailyRepository,
        analyticsInsightRepository,
        appointmentRepository,
        calendarRepository,
        customerRepository,
        loggerService,
        memberRepository,
        organizationRepository,
        serviceRepository,
      });
    } catch (error) {
      if (isBillingRequiredError(error)) {
        throw error;
      }

      loggerService.error("Rebuild analytics error", error);
      throw new Error(
        `Analytics rebuild failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  },
);
