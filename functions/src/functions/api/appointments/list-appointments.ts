import { listAppointmentsApiFn } from "@/app/api/appointments/list-appointments";
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
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);

const listAppointmentsQuerySchema = z.object({
  serviceId: z.string().optional(),
  customerId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const apiListAppointments = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (req: AuthenticatedRequest, res) => {
    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }

    if (req.method !== "GET") {
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
      // Validate query parameters
      const validationResult = listAppointmentsQuerySchema.safeParse(
        req.query,
      );

      if (!validationResult.success) {
        res.status(400).json({
          error: "Invalid query parameters",
          details: validationResult.error.errors,
          success: false,
        });
        return;
      }

      const appointments = await listAppointmentsApiFn(
        {
          organizationId: req.organizationId!,
          filters: validationResult.data,
        },
        {
          appointmentRepository,
          loggerService,
        },
      );

      res.status(200).json({
        success: true,
        appointments,
      });
    } catch (error) {
      loggerService.error("Error listing appointments via API", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to list appointments",
        success: false,
      });
    }
  },
);

