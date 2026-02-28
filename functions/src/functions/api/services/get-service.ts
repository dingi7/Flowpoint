import { getServiceApiFn } from "@/app/api/services/get-service";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { authenticateApiKey, AuthenticatedRequest } from "@/utils/api-auth-middleware";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { Secrets } from "@/config/secrets";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const clerkService = serviceHost.getClerkService();
const clerkSecretKey = defineSecret(Secrets.CLERK_SECRET_KEY);
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);
const secretManagerService = serviceHost.getSecretManagerService({
  loggerService,
});
const apiKeyHashRepository =
  repositoryHost.getApiKeyHashRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);

export const apiGetService = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [clerkSecretKey],
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
      clerkService,
      clerkSecretKey: clerkSecretKey.value(),
      loggerService,
    });

    if (!isAuthenticated) {
      return;
    }

    const serviceId = req.query.serviceId as string;

    if (!serviceId) {
      res.status(400).json({
        error: "Missing serviceId parameter",
        success: false,
      });
      return;
    }

    try {
      const service = await getServiceApiFn(
        {
          organizationId: req.organizationId!,
          serviceId,
        },
        {
          serviceRepository,
          loggerService,
        },
      );

      if (!service) {
        res.status(404).json({
          error: "Service not found",
          success: false,
        });
        return;
      }

      res.status(200).json({
        success: true,
        service,
      });
    } catch (error) {
      loggerService.error("Error getting service via API", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to get service",
        success: false,
      });
    }
  },
);
