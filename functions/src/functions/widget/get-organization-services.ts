import { getOrganizationServicesFn } from "@/app/widget/get-oranization-services";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onRequest } from "firebase-functions/v2/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();

const serviceRepository = repositoryHost.getServiceRepository(databaseService);

export const widgetGetOrganizationServices = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (req, res) => {
    const payload = {
      organizationId: req.query.organizationId as string,
    };

    try {
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

      const services = await getOrganizationServicesFn(payload, {
        serviceRepository,
      });

      res.status(200).json({
        services,
        success: true,
      });
    } catch (error) {
      loggerService.error("Error fetching services:", error);
      res.status(500).json({
        error: "Failed to fetch services",
        success: false,
      });
    }
  },
);
