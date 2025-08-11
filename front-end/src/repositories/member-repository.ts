import {
  DatabaseService,
  Member,
  MemberData,
  MemberRepository,
  OrganizationIDPayload,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getMemberRepository(
  databaseService: DatabaseService,
): MemberRepository {
  return getGenericRepository<Member, MemberData, OrganizationIDPayload>(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationID}/${DatabaseCollection.MEMBERS}`,
    databaseService,
  );
}
