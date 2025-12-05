import { updateServiceApiFn } from "@/app/api/services/update-service";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { authenticateApiKey, AuthenticatedRequest } from "@/utils/api-auth-middleware";
import { onRequest } from "firebase-functions/v2/https";
import { serviceDataSchema } from "@/core";

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

const updateServiceRequestSchema = serviceDataSchema
  .partial();

export const apiUpdateService = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (req: AuthenticatedRequest, res) => {
    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }

    if (req.method !== "PUT" && req.method !== "PATCH") {
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

    const serviceId = req.query.serviceId as string;

    if (!serviceId) {
      res.status(400).json({
        error: "Missing serviceId parameter",
        success: false,
      });
      return;
    }

    try {
      // Validate request body
      const validationResult = updateServiceRequestSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: "Invalid request data",
          details: validationResult.error.errors,
          success: false,
        });
        return;
      }

      await updateServiceApiFn(
        {
          organizationId: req.organizationId!,
          serviceId,
          data: validationResult.data,
        },
        {
          serviceRepository,
          loggerService,
        },
      );

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      loggerService.error("Error updating service via API", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to update service",
        success: false,
      });
    }
  },
);

