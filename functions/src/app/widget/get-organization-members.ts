import { MemberRepository } from "@/core";

interface Payload {
  organizationId: string;
}

interface Dependencies {
  memberRepository: MemberRepository;
}

export async function getOrganizationMembersFn(
  payload: Payload,
  dependencies: Dependencies,
) {
  const { organizationId } = payload;
  const { memberRepository } = dependencies;

  const members = await memberRepository.getAll({
    queryConstraints: [
      {
        field: "organizationId",
        operator: "==",
        value: organizationId,
      },
      {
        field: "status",
        operator: "==",
        value: "active",
      },
    ],
    organizationId,
  });

  return members;
}

