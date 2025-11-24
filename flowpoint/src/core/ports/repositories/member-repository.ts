import {
  GenericRepository,
  Member,
  MemberData,
  OrganizationIdPayload,
} from "@/core";

export type MemberRepository = GenericRepository<
  Member,
  MemberData,
  OrganizationIdPayload
>;
