import {
  CalendarRepository,
  LoggerService,
  MemberRepository,
  OWNER_TYPE,
  PermissionKey,
  RoleRepository,
  UserRepository,
} from "@/core";

interface Payload {
  initiatorId: string;
  memberId: string;
  organizationId: string;
}

interface Dependencies {
  memberRepository: MemberRepository;
  userRepository: UserRepository;
  calendarRepository: CalendarRepository;
  loggerService: LoggerService;
  roleRepository: RoleRepository;
}

/**
 * Centralized function to delete a member with all necessary cleanup:
 * 1. Removes the organization from the user's organization list
 * 2. Deletes the member's calendar(s)
 * 3. Deletes the member record
 */
export async function kickOrganizationMemberFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<void> {
  const { initiatorId, memberId, organizationId } = payload;

  const {
    memberRepository,
    userRepository,
    calendarRepository,
    loggerService,
    roleRepository,
  } = dependencies;

  loggerService.info("Starting member deletion process", {
    initiatorId,
    memberId,
    organizationId,
  });

  // 1. Check if the initiator is a member of the organization
  const initiator = await memberRepository.get({
    organizationId,
    id: initiatorId,
  });

  if (!initiator) {
    loggerService.info("Initiator not found");
    throw new Error("Initiator not found");
  }

  loggerService.info("Initiator found", { initiator });

  // 2. Check if the inviter has the necessary roles
  loggerService.info("About to query roles", {
    organizationId,
    initiatorRoleIds: initiator.roleIds,
    roleIdsType: typeof initiator.roleIds,
    roleIdsLength: initiator.roleIds?.length,
  });

  const initiatorRoles = await roleRepository.getMany({
    organizationId,
    ids: initiator.roleIds,
  });

  loggerService.info("Initiator roles query result", {
    initiatorRoles,
    rolesCount: initiatorRoles.length,
    queryParams: { organizationId, ids: initiator.roleIds },
  });

  if (initiatorRoles.length === 0) {
    loggerService.info("Initiator has no roles");
    throw new Error("Initiator has no roles");
  }

  const canKick = initiatorRoles.some((role) =>
    role.permissions.includes(PermissionKey.MANAGE_MEMBERS),
  );

  if (!canKick) {
    loggerService.info("Initiator does not have the necessary roles");
    throw new Error("Initiator does not have the necessary roles");
  }

  // 1. Get the user and verify they exist
  const user = await userRepository.get({ id: memberId });
  if (!user) {
    throw new Error(`User not found: ${memberId}`);
  }

  // 2. Remove the organization from the user's organization list
  const updatedOrganizationIds = user.organizationIds.filter(
    (orgId) => orgId !== organizationId,
  );

  await userRepository.update({
    id: memberId,
    data: { organizationIds: updatedOrganizationIds },
  });

  loggerService.info("Removed organization from user's organization list", {
    memberId,
    organizationId,
    remainingOrganizations: updatedOrganizationIds,
  });

  // 3. Delete the member's calendar(s)
  const calendars = await calendarRepository.getAll({
    queryConstraints: [
      { field: "ownerId", operator: "==", value: memberId },
      { field: "ownerType", operator: "==", value: OWNER_TYPE.MEMBER },
    ],
    organizationId,
  });

  for (const calendar of calendars) {
    await calendarRepository.delete({
      id: calendar.id,
      organizationId,
    });
    loggerService.info("Deleted member calendar", {
      calendarId: calendar.id,
      memberId,
      organizationId,
    });
  }

  // 4. Delete the member record
  await memberRepository.delete({
    id: memberId,
    organizationId,
  });

  loggerService.info("Deleted member record", { memberId, organizationId });

  loggerService.info("Member deletion completed successfully", {
    memberId,
    organizationId,
    deletedCalendars: calendars.length,
  });
}
