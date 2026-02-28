import { MemberRepository } from "@/core";

interface EnsureSelfMemberAccessPayload {
  userId: string;
  organizationId: string;
}

interface EnsureSelfMemberAccessDependencies {
  memberRepository: MemberRepository;
}

export async function ensureSelfMemberAccess(
  payload: EnsureSelfMemberAccessPayload,
  dependencies: EnsureSelfMemberAccessDependencies,
): Promise<string> {
  const member = await dependencies.memberRepository.get({
    organizationId: payload.organizationId,
    id: payload.userId,
  });

  if (!member) {
    throw new Error("User is not a member of this organization");
  }

  return member.id;
}
