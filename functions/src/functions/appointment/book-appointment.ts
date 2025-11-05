import { bookAppointmentFn } from "@/app/appointment/book-appointment";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onCall } from "firebase-functions/https";
import { defineSecret } from "firebase-functions/params";
import { Secrets } from "@/config/secrets";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const mailgunApiKeySecret = defineSecret(Secrets.MAILGUN_API_KEY);
const mailgunDomainSecret = defineSecret(Secrets.MAILGUN_DOMAIN);
const mailgunUrlSecret = defineSecret(Secrets.MAILGUN_URL);

const calendarRepository =
  repositoryHost.getCalendarRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const customerRepository =
  repositoryHost.getCustomerRepository(databaseService);
const timeOffRepository = repositoryHost.getTimeOffRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);

interface Payload {
  serviceId: string;
  customerEmail: string;
  organizationId: string;
  startTime: string;
  assigneeId: string;
  fee?: number;
  title?: string;
  description?: string;
  additionalCustomerFields?: Record<string, unknown>;
}

export const bookAppointment = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [mailgunApiKeySecret, mailgunDomainSecret, mailgunUrlSecret],
  },
  async (request) => {
    loggerService.info("Book appointment request received", {
      data: request.data,
    });

    try {
      const mailgunService = serviceHost.getMailgunService({
        apiKey: mailgunApiKeySecret.value(),
        domain: mailgunDomainSecret.value(),
        url: mailgunUrlSecret.value() || undefined,
      });

      const cloudTasksService = serviceHost.getCloudTasksService("sendAppointmentReminder");

      const result = await bookAppointmentFn(request.data, {
        appointmentRepository,
        serviceRepository,
        customerRepository,
        calendarRepository,
        timeOffRepository,
        loggerService,
        organizationRepository,
        mailgunService,
        cloudTasksService,
      });

      loggerService.info("Appointment booked successfully", {
        appointmentId: result.appointmentId,
      });

      return {
        success: true,
        appointmentId: result.appointmentId,
        confirmationDetails: result.confirmationDetails,
      };
    } catch (error) {
      loggerService.error("Book appointment error", error);
      throw new Error(
        `Booking failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);
