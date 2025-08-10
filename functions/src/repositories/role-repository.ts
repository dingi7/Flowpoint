import { DatabaseService, Role, RoleData, RoleRepository } from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getRoleRepository(
  databaseService: DatabaseService,
): RoleRepository {
  return getGenericRepository<Role, RoleData>(
    () => DatabaseCollection.ROLES,
    databaseService,
  );
}
