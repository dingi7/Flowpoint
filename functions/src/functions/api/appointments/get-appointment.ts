import { getAppointmentApiFn } from "@/app/api/appointments/get-appointment";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { authenticateApiKey, AuthenticatedRequest } from "@/utils/api-auth-middleware";
import { onRequest } from "firebase-functions/v2/https";

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

export const apiGetAppointment = onRequest(
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

    const appointmentId = req.query.appointmentId as string;

    if (!appointmentId) {
      res.status(400).json({
        error: "Missing appointmentId parameter",
        success: false,
      });
      return;
    }

    try {
      const appointment = await getAppointmentApiFn(
        {
          organizationId: req.organizationId!,
          appointmentId,
        },
        {
          appointmentRepository,
          loggerService,
        },
      );

      if (!appointment) {
        res.status(404).json({
          error: "Appointment not found",
          success: false,
        });
        return;
      }

      res.status(200).json({
        success: true,
        appointment,
      });
    } catch (error) {
      loggerService.error("Error getting appointment via API", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to get appointment",
        success: false,
      });
    }
  },
);

