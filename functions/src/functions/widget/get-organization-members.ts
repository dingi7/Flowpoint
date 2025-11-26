import { getOrganizationMembersFn } from "@/app/widget/get-organization-members";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { handleCorsPreflight, setCorsHeaders } from "@/utils/cors";
import { onRequest } from "firebase-functions/v2/https";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();

const memberRepository = repositoryHost.getMemberRepository(databaseService);

export const widgetGetOrganizationMembers = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (req, res) => {
    setCorsHeaders(res);

    if (handleCorsPreflight(req, res)) {
      return;
    }

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

      const members = await getOrganizationMembersFn(payload, {
        memberRepository,
      });

      res.status(200).json({
        members,
        success: true,
      });
    } catch (error) {
      loggerService.error("Error fetching members:", error);
      res.status(500).json({
        error: "Failed to fetch members",
        success: false,
      });
    }
  },
);

