import { listServicesApiFn } from "@/app/api/services/list-services";
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
const serviceRepository = repositoryHost.getServiceRepository(databaseService);

export const apiListServices = onRequest(
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
      const services = await listServicesApiFn(
        {
          organizationId: req.organizationId!,
        },
        {
          serviceRepository,
          loggerService,
        },
      );

      res.status(200).json({
        success: true,
        services,
      });
    } catch (error) {
      loggerService.error("Error listing services via API", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to list services",
        success: false,
      });
    }
  },
);

