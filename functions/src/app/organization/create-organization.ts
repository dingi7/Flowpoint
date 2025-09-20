import {
    LoggerService,
    MemberRepository,
    OrganizationRepository,
    OrganizationSettingsData,
    PermissionKey,
    RoleRepository,
} from "../../core";

interface Payload {
  organizationData: {
    name: string;
    image?: string;
    industry?: string;
    currency: string;
    settings: OrganizationSettingsData;
  };
  userId: string;
}

interface Dependencies {
  organizationRepository: OrganizationRepository;
  memberRepository: MemberRepository;
  roleRepository: RoleRepository;
  loggerService: LoggerService; 
}

export async function createOrganizationFn(
  payload: Payload,
  dependencies: Dependencies,
) {
  const { organizationData, userId } = payload;
  const { organizationRepository, memberRepository, roleRepository, loggerService } =
    dependencies;

  const organizationId = await organizationRepository.create({
    data: organizationData,
  });

  loggerService.info(`Created organization ${organizationId}`);

  const fullAccessRoleId = await roleRepository.create({
    organizationId,
    data: {
      name: "Full Access",
      permissions: [
        PermissionKey.MANAGE_APPOINTMENTS,
        PermissionKey.MANAGE_CALENDARS,
        PermissionKey.MANAGE_MEMBERS,
        PermissionKey.VIEW_REPORTS,
      ],
      organizationId,
    },
  });

  loggerService.info(`Created role ${fullAccessRoleId}`);

  await memberRepository.set({
    organizationId,
    id: userId,
    data: {
      organizationId,
      roleIds: [fullAccessRoleId],
      name: `${organizationData.name} Owner`,
    },
  });

  loggerService.info(`Created member ${userId} for organization ${organizationId}`);

  return organizationId
}
