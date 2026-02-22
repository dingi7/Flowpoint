import { addDays } from "date-fns";
import {
  CalendarRepository,
  ClerkService,
  CLERK_ORGANIZATION_ROLE,
  InviteRepository,
  InviteStatus,
  LoggerService,
  MemberRepository,
  OrganizationRepository,
  UserRepository,
} from "@/core";
import { HttpsError } from "firebase-functions/https";
import {
  FREE_ORG_PLAN_SLUG,
  getOrganizationBillingContext,
  MEMBER_LIMIT_REACHED_MESSAGE,
} from "@/utils/check-billing";
import { createMemberFn } from "../member/create-member";

interface Payload {
  inviteId: string;
  userId: string;
  name: string;
  image?: string;
  description?: string;
}

interface Dependencies {
  loggerService: LoggerService;
  inviteRepository: InviteRepository;
  memberRepository: MemberRepository;
  userRepository: UserRepository;
  calendarRepository: CalendarRepository;
  organizationRepository: OrganizationRepository;
  clerkService: ClerkService;
  clerkSecretKey: string;
}

const FREE_PLAN_MEMBER_LIMIT = 2;

export async function acceptOrganizationInviteFn(
  payload: Payload,
  dependencies: Dependencies,
) {
  const { inviteId, userId, image, description, name } = payload;
  const {
    loggerService,
    inviteRepository,
    memberRepository,
    userRepository,
    calendarRepository,
    organizationRepository,
    clerkService,
    clerkSecretKey,
  } = dependencies;

  // 1. Check if the invite exists
  const invite = await inviteRepository.get({ id: inviteId });

  if (!invite) {
    loggerService.info("Invite not found", { inviteId });
    throw new Error("Invite not found");
  }

  // 2. Check if the invite is valid
  if (invite.status !== InviteStatus.PENDING) {
    loggerService.info("Invite is not pending", { invite });
    throw new Error("Invite is not pending");
  }

  if (invite.validFor && addDays(invite.createdAt, invite.validFor) < new Date()) {
    loggerService.info("Invite has expired", { invite });
    throw new Error("Invite has expired");
  }

  // 3. Check if the user is already a member
  const existingMember = await memberRepository.get({
    organizationId: invite.organizationId,
    id: userId,
  });

  if (existingMember) {
    loggerService.info("User is already a member", { existingMember });
  }

  // check if the invite invitee email matches the users

  const user = await userRepository.get({ id: userId });

  if (!user) {
    loggerService.info("User not found", { userId });
    throw new Error("User not found");
  }

  if (invite.inviteeEmail !== user.email) {
    loggerService.info("Invite email does not match user email", {
      invite,
      user,
    });
    throw new Error("Invite email does not match user email");
  }

  const billingContext = await getOrganizationBillingContext(
    {
      organizationId: invite.organizationId,
      userId,
    },
    {
      organizationRepository,
      clerkService,
      clerkSecretKey,
      loggerService,
    },
  );

  if (
    billingContext.planSlugs.includes(FREE_ORG_PLAN_SLUG) &&
    !existingMember
  ) {
    const activeMembers = await memberRepository.getAll({
      organizationId: invite.organizationId,
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
      throw new HttpsError("failed-precondition", MEMBER_LIMIT_REACHED_MESSAGE);
    }
  }

  // Use the centralized createMember function
  await createMemberFn(
    {
      userId,
      organizationId: invite.organizationId,
      name,
      roleIds: invite.roleIds,
      image,
      description,
    },
    {
      memberRepository,
      userRepository,
      calendarRepository,
      loggerService,
      organizationRepository,
    }
  );

  const organization = await organizationRepository.get({
    id: invite.organizationId,
  });

  if (!organization) {
    throw new Error(`Organization not found: ${invite.organizationId}`);
  }

  let clerkOrganizationId = organization.clerkOrganizationId;
  let shouldAddMembership = true;

  if (!clerkOrganizationId) {
    const clerkOrganization = await clerkService.createOrganization({
      apiKey: clerkSecretKey,
      name: organization.name,
      createdBy: userId,
    });

    if (!clerkOrganization) {
      throw new Error("Failed to create Clerk organization");
    }

    clerkOrganizationId = clerkOrganization.id;

    await organizationRepository.update({
      id: invite.organizationId,
      data: {
        clerkOrganizationId,
      },
    });

    shouldAddMembership = false;
  }

  if (clerkOrganizationId && shouldAddMembership) {
    const membership = await clerkService.addOrganizationMembership({
      apiKey: clerkSecretKey,
      organizationId: clerkOrganizationId,
      userId,
      role: CLERK_ORGANIZATION_ROLE.MEMBER,
    });

    if (!membership) {
      throw new Error("Failed to add Clerk organization membership");
    }
  }

  // 5. Update the invite status
  await inviteRepository.update({
    id: inviteId,
    data: {
      status: InviteStatus.ACCEPTED,
    },
  });

  loggerService.info("Invite accepted", { inviteId, userId });
}
