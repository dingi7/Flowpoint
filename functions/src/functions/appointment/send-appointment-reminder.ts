import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { sendAppointmentReminderEmailFn } from "@/app/notification/send-appointment-reminder-email";
import { Secrets } from "@/config/secrets";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";

const loggerService = serviceHost.getLoggerService();
const databaseService = serviceHost.getDatabaseService();
const appointmentRepository = repositoryHost.getAppointmentRepository(databaseService);
const customerRepository = repositoryHost.getCustomerRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const organizationRepository = repositoryHost.getOrganizationRepository(databaseService);

const mailgunApiKeySecret = defineSecret(Secrets.MAILGUN_API_KEY);
const mailgunDomainSecret = defineSecret(Secrets.MAILGUN_DOMAIN);
const mailgunUrlSecret = defineSecret(Secrets.MAILGUN_URL);

interface Payload {
  appointmentId: string;
  organizationId: string;
}

/**
 * HTTP endpoint to send appointment reminder emails
 * Called by Cloud Tasks at the scheduled time
 */
export const sendAppointmentReminder = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [mailgunApiKeySecret, mailgunDomainSecret, mailgunUrlSecret],
  },
  async (request, response) => {
    try {
      const payload = request.body as Payload;

      if (!payload.appointmentId || !payload.organizationId) {
        response.status(400).send("Missing required fields: appointmentId, organizationId");
        return;
      }

      const mailgunService = serviceHost.getMailgunService({
        apiKey: mailgunApiKeySecret.value(),
        domain: mailgunDomainSecret.value(),
        url: mailgunUrlSecret.value() || undefined,
      });

      await sendAppointmentReminderEmailFn(
        payload,
        {
          appointmentRepository,
          customerRepository,
          serviceRepository,
          organizationRepository,
          mailgunService,
          loggerService,
        },
      );

      response.status(200).send("Reminder email sent successfully");
    } catch (error) {
      loggerService.error("Error sending reminder email", error);
      response.status(500).send(
        `Error sending reminder: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);
