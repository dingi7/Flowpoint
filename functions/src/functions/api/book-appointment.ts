import { bookAppointmentApiFn } from "@/app/api/book-appointment";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { authenticateApiKey, AuthenticatedRequest } from "@/utils/api-auth-middleware";
import { getClientIp, getTimezoneFromIp } from "@/utils/ip-timezone";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { Secrets } from "@/config/secrets";
import { z } from "zod";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const mailgunApiKeySecret = defineSecret(Secrets.MAILGUN_API_KEY);
const mailgunDomainSecret = defineSecret(Secrets.MAILGUN_DOMAIN);
const mailgunUrlSecret = defineSecret(Secrets.MAILGUN_URL);

const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const secretManagerService = serviceHost.getSecretManagerService({
  loggerService,
});
const apiKeyHashRepository =
  repositoryHost.getApiKeyHashRepository(databaseService);
const calendarRepository =
  repositoryHost.getCalendarRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const customerRepository =
  repositoryHost.getCustomerRepository(databaseService);
const timeOffRepository = repositoryHost.getTimeOffRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);

const bookAppointmentRequestSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  customerEmail: z.string().email("Invalid email address"),
  startTime: z.string().datetime("Invalid start time format"),
  assigneeId: z.string().min(1, "Assignee ID is required"),
  title: z.string().optional(),
  description: z.string().optional(),
  additionalCustomerFields: z.record(z.unknown()).optional(),
});

export const apiBookAppointment = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [mailgunApiKeySecret, mailgunDomainSecret, mailgunUrlSecret],
  },
  async (req: AuthenticatedRequest, res) => {
    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed", success: false });
      return;
    }

    // Authenticate API key
    const isAuthenticated = await authenticateApiKey(req, res, {
      organizationRepository,
      secretManagerService,
      apiKeyHashRepository,
      loggerService,
    });

    if (!isAuthenticated) {
      return;
    }

    try {
      // Validate request body
      const validationResult = bookAppointmentRequestSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: "Invalid request data",
          details: validationResult.error.errors,
          success: false,
        });
        return;
      }

      const mailgunService = serviceHost.getMailgunService({
        apiKey: mailgunApiKeySecret.value(),
        domain: mailgunDomainSecret.value(),
        url: mailgunUrlSecret.value() || undefined,
      });

      const cloudTasksService = serviceHost.getCloudTasksService(
        "sendAppointmentReminder",
      );

      // Get timezone from client IP
      const clientIp = getClientIp(req);
      const timezone = await getTimezoneFromIp(clientIp, loggerService);

      const result = await bookAppointmentApiFn(
        {
          ...validationResult.data,
          organizationId: req.organizationId!,
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

      res.status(200).json({
        success: true,
        appointmentId: result.appointmentId,
        confirmationDetails: result.confirmationDetails,
      });
    } catch (error) {
      loggerService.error("Error booking appointment via API", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to book appointment",
        success: false,
      });
    }
  },
);

