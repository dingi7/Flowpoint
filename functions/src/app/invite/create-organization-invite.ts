import {
  InviteData,
  InviteRepository,
  InviteStatus,
  LoggerService,
  MemberRepository,
  PermissionKey,
  RoleRepository,
} from "@/core";

interface Payload {
  inviterId: string;
  organizationId: string;
  inviteeEmail: string;
  inviteeRoleIds: string[];
  validFor?: number;
}

interface Dependencies {
  loggerService: LoggerService;
  inviteRepository: InviteRepository;
  memberRepository: MemberRepository;
  roleRepository: RoleRepository;
}

export async function createOrganizationInviteFn(
  payload: Payload,
  dependencies: Dependencies,
) {
  const { inviterId, organizationId, inviteeEmail, inviteeRoleIds, validFor } =
    payload;
  const { loggerService, inviteRepository, memberRepository, roleRepository } =
    dependencies;

  // 1. Check if the inviter has the roles necessary to create an invite
  const inviter = await memberRepository.get({
    organizationId,
    id: inviterId,
  });

  if (!inviter) {
    loggerService.info("Inviter not found");
    throw new Error("Inviter not found");
  }

  loggerService.info("Inviter found", { inviter });

  // 2. Check if the inviter has the necessary roles
  loggerService.info("About to query roles", {
    organizationId,
    inviterRoleIds: inviter.roleIds,
    roleIdsType: typeof inviter.roleIds,
    roleIdsLength: inviter.roleIds?.length,
  });

  const inviterRoles = await roleRepository.getMany({
    organizationId,
    ids: inviter.roleIds,
  });

  loggerService.info("Inviter roles query result", {
    inviterRoles,
    rolesCount: inviterRoles.length,
    queryParams: { organizationId, ids: inviter.roleIds },
  });

  if (inviterRoles.length === 0) {
    loggerService.info("Inviter has no roles");
    throw new Error("Inviter has no roles");
  }

  // 3. Check if the inviter roles allow him to invite members
  const canInvite = inviterRoles.some((role) =>
    role.permissions.includes(PermissionKey.MANAGE_MEMBERS),
  );

  if (!canInvite) {
    loggerService.info("Inviter does not have the necessary roles");
    throw new Error("Inviter does not have the necessary roles");
  }

  // 4. Check if an invite already exists for this email
  const existingInvites = await inviteRepository.getAll({
    queryConstraints: [
      {
        field: "inviteeEmail",
        operator: "==",
        value: inviteeEmail,
      },
      {
        field: "organizationId",
        operator: "==",
        value: organizationId,
      },
      {
        field: "status",
        operator: "==",
        value: InviteStatus.PENDING,
      },
    ],
  });

  if (existingInvites.length > 0) {
    loggerService.info("Invite already exists", { existingInvites });
    throw new Error("Invite already exists");
  }

  // 5. Check if the invitee roles exist
  const inviteeRoles = await roleRepository.getMany({
    organizationId,
    ids: inviteeRoleIds,
  });

  if (inviteeRoles.length !== inviteeRoleIds.length) {
    loggerService.info("Invitee roles do not exist", { inviteeRoleIds });
    throw new Error("Invitee roles do not exist");
  }

  loggerService.info("Invitee roles found", { inviteeRoles });

  const inviteData: InviteData = {
    inviterId,
    organizationId,
    inviteeEmail,
    roleIds: inviteeRoleIds,
    status: InviteStatus.PENDING,
  };

  if (validFor) {
    inviteData.validFor = validFor;
  }

  // 6. Create the invite
  const invite = await inviteRepository.create({
    data: inviteData,
  });

  loggerService.info("Invite created", { invite });

  return invite;
}
