import { DatabaseService, Member, MemberData, MemberRepository } from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getMemberRepository(
  databaseService: DatabaseService,
): MemberRepository {
  return getGenericRepository<Member, MemberData>(
    () => DatabaseCollection.MEMBERS,
    databaseService,
  );
}
