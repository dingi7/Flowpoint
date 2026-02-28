import { createOrganizationInviteFn } from "@/app/invite/create-organization-invite";
import { PermissionKey } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import {
  FREE_ORG_PLAN_SLUG,
  getOrganizationBillingContext,
  MEMBER_LIMIT_REACHED_MESSAGE,
} from "@/utils/check-billing";
import { checkPermission } from "@/utils/check-permission";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/https";
import { defineSecret } from "firebase-functions/params";
import { Secrets } from "@/config/secrets";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const clerkService = serviceHost.getClerkService();
const clerkSecretKey = defineSecret(Secrets.CLERK_SECRET_KEY);

const inviteRepository = repositoryHost.getInviteRepository(databaseService);
const roleRepository = repositoryHost.getRoleRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);

interface Payload {
  organizationId: string;
  inviteeEmail: string;
  inviteeRoleIds: string[];
  validFor?: number;
}

const FREE_PLAN_MEMBER_LIMIT = 2;

export const createOrganizationInvite = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [clerkSecretKey],
  },
  async (request: CallableRequest<Payload>) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    const { data } = request;

    loggerService.info("Create invite request received", {
      data,
    });

    try {
      await checkPermission(
        {
          userId: request.auth.uid,
          organizationId: data.organizationId,
          permission: PermissionKey.MANAGE_MEMBERS,
        },
        {
          loggerService,
          memberRepository,
          roleRepository,
          organizationRepository,
          clerkService,
          clerkSecretKey: clerkSecretKey.value(),
        },
      );

      const billingContext = await getOrganizationBillingContext(
        {
          organizationId: data.organizationId,
          userId: request.auth.uid,
        },
        {
          loggerService,
          organizationRepository,
          clerkService,
          clerkSecretKey: clerkSecretKey.value(),
        },
      );

      if (billingContext.planSlugs.includes(FREE_ORG_PLAN_SLUG)) {
        const activeMembers = await memberRepository.getAll({
          organizationId: data.organizationId,
          queryConstraints: [
            {
              field: "status",
              operator: "==",
              value: "active",
            },
          ],
          pagination: {
            limit: FREE_PLAN_MEMBER_LIMIT,
          },
        });

        if (activeMembers.length >= FREE_PLAN_MEMBER_LIMIT) {
          throw new HttpsError(
            "failed-precondition",
            MEMBER_LIMIT_REACHED_MESSAGE,
          );
        }
      }
      
      const invite = await createOrganizationInviteFn(
        { inviterId: request.auth.uid, ...data },
        {
          loggerService,
          inviteRepository,
          roleRepository,
        },
      );

      loggerService.info("Invite created successfully", {
        invite: invite,
      });

      return invite;
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      loggerService.error("Invite creation error", error);
      throw new Error(
        `Invite creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
);
