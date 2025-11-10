import {
  InviteData,
  InviteRepository,
  InviteStatus,
  LoggerService,
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
  roleRepository: RoleRepository;
}

export async function createOrganizationInviteFn(
  payload: Payload,
  dependencies: Dependencies,
) {
  const { inviterId, organizationId, inviteeEmail, inviteeRoleIds, validFor } =
    payload;
  const { loggerService, inviteRepository, roleRepository } =
    dependencies;

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
