import { getOrganizationServicesApiFn } from "@/app/api/get-organization-services";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import {
  authenticateApiKey,
  AuthenticatedRequest,
} from "@/utils/api-auth-middleware";
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

export const apiGetOrganizationServices = onRequest(
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
      const services = await getOrganizationServicesApiFn(
        {
          organizationId: req.organizationId!,
        },
        {
          serviceRepository,
        },
      );

      res.status(200).json({
        success: true,
        services,
      });
    } catch (error) {
      loggerService.error("Error fetching services via API", error);
      res.status(500).json({
        error: "Failed to fetch services",
        success: false,
      });
    }
  },
);

