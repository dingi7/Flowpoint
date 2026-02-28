import { getOrganizationServicesApiFn } from "@/app/api/get-organization-services";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import {
  authenticateApiKey,
  AuthenticatedRequest,
} from "@/utils/api-auth-middleware";
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

export const apiGetOrganizationServices = onRequest(
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
