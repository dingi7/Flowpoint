import { DatabaseService, Invite, InviteData, InviteRepository } from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getInviteRepository(
  databaseService: DatabaseService,
): InviteRepository {
  return getGenericRepository<Invite, InviteData>(
    () => DatabaseCollection.INVITES,
    databaseService,
  );
}
