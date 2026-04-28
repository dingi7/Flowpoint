import { getAvailableTimeslotsFn } from "@/app/availability/get-available-timeslots";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { checkBilling, isBillingRequiredError } from "@/utils/check-billing";
import { onCall } from "firebase-functions/https";
import { defineSecret } from "firebase-functions/params";
import { Secrets } from "@/config/secrets";

interface Payload {
  serviceId: string;
  date: string;
  organizationId: string;
  assigneeId: string;
}

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const clerkService = serviceHost.getClerkService();
const clerkSecretKey = defineSecret(Secrets.CLERK_SECRET_KEY);

const calendarRepository =
  repositoryHost.getCalendarRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const pricingRuleRepository =
  repositoryHost.getPricingRuleRepository(databaseService);
const timeOffRepository = repositoryHost.getTimeOffRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);

export const getAvailableTimeslots = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    // minInstances: 1,
    secrets: [clerkSecretKey],
  },
  async (request) => {
    loggerService.info("getAvalibleTimeslots request");

    const { data } = request;

    loggerService.info("getAvalibleTimeslots request.data", data);

    try {
      await checkBilling(
        { organizationId: data.organizationId },
        {
          organizationRepository,
          clerkService,
          clerkSecretKey: clerkSecretKey.value(),
          loggerService,
        },
      );

      const result = await getAvailableTimeslotsFn(
        {
          ...data,
        },
        {
          calendarRepository,
          serviceRepository,
          pricingRuleRepository,
          loggerService,
          timeOffRepository,
          appointmentRepository,
        },
      );
      return result;
    } catch (error) {
      if (isBillingRequiredError(error)) {
        throw error;
      }
      loggerService.error("getAvalibleTimeslots error", error);
      throw new Error("Error getting available timeslots");
    }
  },
);
