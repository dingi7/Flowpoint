import { addDays } from 'date-fns';
import {
  InviteRepository,
  InviteStatus,
  LoggerService,
  MemberRepository,
  UserRepository,
} from "@/core";

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
}

export async function acceptOrganizationInviteFn(
  payload: Payload,
  dependencies: Dependencies,
) {
  const { inviteId, userId, image, description, name } = payload;
  const { loggerService, inviteRepository, memberRepository, userRepository } =
    dependencies;

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

  await userRepository.update({id: userId, data: {organizationIds: [invite.organizationId, ...user.organizationIds]}})

  await memberRepository.set({
    organizationId: invite.organizationId,
    id: userId,
    data: {
      organizationId: invite.organizationId,
      roleIds: invite.roleIds,
      name,
      image,
      description,
    },
  });

  // 5. Update the invite status
  await inviteRepository.update({
    id: inviteId,
    data: {
      status: InviteStatus.ACCEPTED,
    },
  });

  loggerService.info("Invite accepted", { inviteId, userId });
}
