import { getAvailableTimeslotsApiFn } from "@/app/api/get-available-timeslots";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { authenticateApiKey, AuthenticatedRequest } from "@/utils/api-auth-middleware";
import { onRequest } from "firebase-functions/v2/https";
import { z } from "zod";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
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
const timeOffRepository = repositoryHost.getTimeOffRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);

const timeslotRequestSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const apiGetAvailableTimeslots = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
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
      const validationResult = timeslotRequestSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: "Invalid request data",
          details: validationResult.error.errors,
          success: false,
        });
        return;
      }

      const { serviceId, date } = validationResult.data;

      const timeslots = await getAvailableTimeslotsApiFn(
        {
          serviceId,
          date,
          organizationId: req.organizationId!,
        },
        {
          calendarRepository,
          serviceRepository,
          loggerService,
          timeOffRepository,
          appointmentRepository,
        },
      );

      res.status(200).json({
        success: true,
        timeslots,
      });
    } catch (error) {
      loggerService.error("Error fetching timeslots via API", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to fetch timeslots",
        success: false,
      });
    }
  },
);

