import {
  CalendarRepository,
  DAY_OF_WEEK,
  LoggerService,
  MemberRepository,
  OrganizationRepository,
  OWNER_TYPE,
  UserRepository,
} from "@/core";

interface CreateMemberPayload {
  userId: string;
  organizationId: string;
  name: string;
  roleIds: string[];
  image?: string;
  description?: string;
  timezone?: string;
}

interface Dependencies {
  memberRepository: MemberRepository;
  userRepository: UserRepository;
  calendarRepository: CalendarRepository;
  organizationRepository: OrganizationRepository;
  loggerService: LoggerService;
}

/**
 * Centralized function to create a member with all necessary setup:
 * 1. Creates the member record
 * 2. Adds the organization to the user's organization list
 * 3. Creates a default calendar for the member
 */
export async function createMemberFn(
  payload: CreateMemberPayload,
  dependencies: Dependencies,
): Promise<void> {
  const {
    userId,
    organizationId,
    name,
    roleIds,
    image,
    description,
    timezone,
  } = payload;

  const {
    memberRepository,
    userRepository,
    calendarRepository,
    loggerService,
    organizationRepository,
  } = dependencies;

  loggerService.info("Starting member creation process", {
    userId,
    organizationId,
    name,
  });

  // 1. Get current user to update organization list
  const user = await userRepository.get({ id: userId });
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // 2. Update user's organization list (avoid duplicates)
  const updatedOrganizationIds = user.organizationIds.includes(organizationId)
    ? user.organizationIds
    : [organizationId, ...user.organizationIds];

  await userRepository.update({
    id: userId,
    data: { organizationIds: updatedOrganizationIds },
  });

  loggerService.info("Updated user organization list", {
    userId,
    organizationIds: updatedOrganizationIds,
  });

  // 3. Create member record
  await memberRepository.set({
    organizationId,
    id: userId,
    data: {
      organizationId,
      roleIds,
      name,
      image: image || "",
      description: description || "",
      status: "active",
    },
  });

  loggerService.info("Created member record", { userId, organizationId });

  const organization = await organizationRepository.get({ id: organizationId });
  if (!organization) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  // 4. Create default calendar for the member
  const defaultWorkingHours = Object.values(DAY_OF_WEEK).reduce(
    (acc, day) => {
      const isWorkingDay = organization.settings.workingDays.includes(day);
      acc[day] = isWorkingDay
        ? [
            {
              start: organization.settings.workingHours.start,
              end: organization.settings.workingHours.end,
            },
          ]
        : [];
      return acc;
    },
    {} as Record<DAY_OF_WEEK, Array<{ start: string; end: string }>>,
  );

  const calendarData = {
    ownerType: OWNER_TYPE.MEMBER,
    ownerId: userId,
    name: `${name}'s Calendar`,
    workingHours: defaultWorkingHours,
    bufferTime: 0,
    timeZone: timezone || organization.settings.timezone,
  };

  const calendarId = await calendarRepository.create({
    data: calendarData,
    organizationId,
  });

  loggerService.info("Created member calendar", {
    calendarId,
    userId,
    organizationId,
  });

  loggerService.info("Member creation completed successfully", {
    userId,
    organizationId,
    calendarId,
  });
}
