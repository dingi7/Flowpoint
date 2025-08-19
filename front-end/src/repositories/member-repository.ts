import {
  DatabaseService,
  Member,
  MemberData,
  MemberRepository,
  OrganizationIdPayload,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getMemberRepository(
  databaseService: DatabaseService,
): MemberRepository {
  return getGenericRepository<Member, MemberData, OrganizationIdPayload>(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.MEMBERS}`,
    databaseService,
  );
}
