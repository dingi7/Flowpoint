import { bookAppointmentFn } from "@/app/appointment/book-appointment";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { getClientIp, getTimezoneFromIp } from "@/utils/ip-timezone";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { Secrets } from "@/config/secrets";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const mailgunApiKeySecret = defineSecret(Secrets.MAILGUN_API_KEY);
const mailgunDomainSecret = defineSecret(Secrets.MAILGUN_DOMAIN);
const mailgunUrlSecret = defineSecret(Secrets.MAILGUN_URL);

const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);

const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const customerRepository =
  repositoryHost.getCustomerRepository(databaseService);
const calendarRepository =
  repositoryHost.getCalendarRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);
const timeOffRepository = repositoryHost.getTimeOffRepository(databaseService);

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
  title?: string;
  description?: string;
  additionalCustomerFields?: Record<string, unknown>;
}

export const widgetBookAppointment = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [mailgunApiKeySecret, mailgunDomainSecret, mailgunUrlSecret],
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed", success: false });
      return;
    }

    try {
      const payload = req.body as Payload;

      if (
        !payload.organizationId ||
        typeof payload.organizationId !== "string"
      ) {
        res.status(400).json({
          error: "Missing or invalid organizationId parameter",
          success: false,
        });
        return;
      }

      // Validate booking data
      if (!payload.serviceId || !payload.customerEmail || !payload.startTime) {
        res.status(400).json({
          error: "Missing required booking fields",
          success: false,
        });
        return;
      }

      const mailgunService = serviceHost.getMailgunService({
        apiKey: mailgunApiKeySecret.value(),
        domain: mailgunDomainSecret.value(),
        url: mailgunUrlSecret.value() || undefined,
      });

      const cloudTasksService = serviceHost.getCloudTasksService("sendAppointmentReminder");

      // Get timezone from client IP
      const clientIp = getClientIp(req);
      const timezone = await getTimezoneFromIp(clientIp, loggerService);

      const result = await bookAppointmentFn(
        {
          ...payload,
          timezone,
        },
        {
          appointmentRepository,
          serviceRepository,
          customerRepository,
          calendarRepository,
          timeOffRepository,
          loggerService,
          organizationRepository,
          mailgunService,
          cloudTasksService,
        },
      );

      loggerService.info("Appointment booked successfully", {
        appointmentId: result.appointmentId,
      });
      res.status(200).json({
        success: true,
        appointmentId: result.appointmentId,
        confirmationDetails: result.confirmationDetails,
      });
    } catch (error) {
      loggerService.error("Error booking appointment:", error);
      res.status(500).json({
        error: "Failed to book appointment",
        success: false,
        appointmentId: null,
        confirmationDetails: null,
      });
    }
  },
);
