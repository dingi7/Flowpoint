import {
  GenericRepository,
  Member,
  MemberData,
  OrganizationIDPayload,
} from "@/core";

export type MemberRepository = GenericRepository<
  Member,
  MemberData,
  OrganizationIDPayload
>;
