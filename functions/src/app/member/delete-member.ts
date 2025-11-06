import {
  CalendarRepository,
  LoggerService,
  MemberRepository,
  OWNER_TYPE,
  UserRepository,
} from "@/core";

interface DeleteMemberPayload {
  userId: string;
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
export async function deleteMemberFn(
  payload: DeleteMemberPayload,
  dependencies: Dependencies,
): Promise<void> {
  const { userId, organizationId } = payload;

  const { memberRepository, userRepository, calendarRepository, loggerService } =
    dependencies;

  loggerService.info("Starting member deletion process", {
    userId,
    organizationId,
  });

  // 1. Get the user and verify they exist
  const user = await userRepository.get({ id: userId });
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // 2. Remove the organization from the user's organization list
  const updatedOrganizationIds = user.organizationIds.filter(
    (orgId) => orgId !== organizationId,
  );

  await userRepository.update({
    id: userId,
    data: { organizationIds: updatedOrganizationIds },
  });

  loggerService.info("Removed organization from user's organization list", {
    userId,
    organizationId,
    remainingOrganizations: updatedOrganizationIds,
  });

  // 3. Delete the member's calendar(s)
  const calendars = await calendarRepository.getAll({
    queryConstraints: [
      { field: "ownerId", operator: "==", value: userId },
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
      userId,
      organizationId,
    });
  }

  // 4. Delete the member record
  await memberRepository.delete({
    id: userId,
    organizationId,
  });

  loggerService.info("Deleted member record", { userId, organizationId });

  loggerService.info("Member deletion completed successfully", {
    userId,
    organizationId,
    deletedCalendars: calendars.length,
  });
}

