import { bookAppointmentFn } from "@/app/appointment/book-appointment";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { checkBilling, isBillingRequiredError } from "@/utils/check-billing";
import { getClientIp, getTimezoneFromIp } from "@/utils/ip-timezone";
import { onCall } from "firebase-functions/https";
import { defineSecret } from "firebase-functions/params";
import { Secrets } from "@/config/secrets";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const clerkService = serviceHost.getClerkService();
const clerkSecretKey = defineSecret(Secrets.CLERK_SECRET_KEY);
const mailgunApiKeySecret = defineSecret(Secrets.MAILGUN_API_KEY);
const mailgunDomainSecret = defineSecret(Secrets.MAILGUN_DOMAIN);
const mailgunUrlSecret = defineSecret(Secrets.MAILGUN_URL);

const calendarRepository =
  repositoryHost.getCalendarRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const pricingRuleRepository =
  repositoryHost.getPricingRuleRepository(databaseService);
const customerRepository =
  repositoryHost.getCustomerRepository(databaseService);
const timeOffRepository = repositoryHost.getTimeOffRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);
const userRepository = repositoryHost.getUserRepository(databaseService);

interface Payload {
  serviceId: string;
  customerEmail: string;
  customerData: {
    name: string;
    phone: string;
    address?: string;
    notes?: string;
  };
  organizationId: string;
  startTime: string;
  assigneeId: string;
  addOnServiceIds?: string[];
  fee?: number;
  title?: string;
  description?: string;
  timezone?: string;
  additionalCustomerFields?: Record<string, unknown>;
}

export const bookAppointment = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [
      clerkSecretKey,
      mailgunApiKeySecret,
      mailgunDomainSecret,
      mailgunUrlSecret,
    ],
    memory: "512MiB",
  },
  async (request) => {
    loggerService.info("Book appointment request received", {
      data: request.data,
    });

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

      const mailgunService = serviceHost.getMailgunService({
        apiKey: mailgunApiKeySecret.value(),
        domain: mailgunDomainSecret.value(),
        url: mailgunUrlSecret.value() || undefined,
      });

      const cloudTasksServiceReminder =
        serviceHost.getCloudTasksService("sendAppointmentReminder");
      const cloudTasksServiceReviewRequest =
        serviceHost.getCloudTasksService("sendAppointmentReviewRequest");
      const cloudTasksServiceRebooking =
        serviceHost.getCloudTasksService("sendAppointmentRebookingReminder");

      // Get timezone from IP if not provided in payload
      let timezone = request.data.timezone;
      if (!timezone) {
        // Try to get IP from rawRequest if available (onCall functions)
        const rawRequest = (request as unknown as { rawRequest?: { headers?: Record<string, string | string[] | undefined>; ip?: string } }).rawRequest;
        const clientIp = rawRequest && rawRequest.headers ? getClientIp({ headers: rawRequest.headers, ip: rawRequest.ip }) : null;
        timezone = await getTimezoneFromIp(clientIp, loggerService);
      }

      const result = await bookAppointmentFn(
        {
          ...request.data,
          timezone,
        },
        {
          memberRepository,
          userRepository,
          appointmentRepository,
          serviceRepository,
          pricingRuleRepository,
          customerRepository,
          calendarRepository,
          timeOffRepository,
          loggerService,
          organizationRepository,
          mailgunService,
          cloudTasksServiceReminder,
          cloudTasksServiceReviewRequest,
          cloudTasksServiceRebooking,
        },
      );

      loggerService.info("Appointment booked successfully", {
        appointmentId: result.appointmentId,
      });

      return {
        success: true,
        appointmentId: result.appointmentId,
        confirmationDetails: result.confirmationDetails,
      };
    } catch (error) {
      if (isBillingRequiredError(error)) {
        throw error;
      }
      loggerService.error("Book appointment error", error);
      throw new Error(
        `Booking failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);
