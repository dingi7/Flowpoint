import {
  CalendarRepository,
  LoggerService,
  MemberRepository,
  OWNER_TYPE,
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
  } = dependencies;

  loggerService.info("Starting member deletion process", {
    initiatorId,
    memberId,
    organizationId,
  });

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
