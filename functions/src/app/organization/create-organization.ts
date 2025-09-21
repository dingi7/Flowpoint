import {
    CalendarRepository,
    LoggerService,
    MemberRepository,
    OrganizationRepository,
    OrganizationSettingsData,
    PermissionKey,
    RoleRepository,
    UserRepository,
} from "../../core";
import { createMemberFn } from "../member/create-member";

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
  userRepository: UserRepository;
  calendarRepository: CalendarRepository;
  loggerService: LoggerService; 
}

export async function createOrganizationFn(
  payload: Payload,
  dependencies: Dependencies,
) {
  const { organizationData, userId } = payload;
  const { 
    organizationRepository, 
    memberRepository, 
    roleRepository, 
    userRepository,
    calendarRepository,
    loggerService 
  } = dependencies;

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

  // Use the centralized createMember function
  await createMemberFn(
    {
      userId,
      organizationId,
      name: `${organizationData.name} Owner`,
      roleIds: [fullAccessRoleId],
      timezone: organizationData.settings.timezone,
    },
    {
      memberRepository,
      userRepository,
      calendarRepository,
      loggerService,
      organizationRepository
    }
  );

  return organizationId
}
