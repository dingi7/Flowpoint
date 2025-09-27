import {
  DatabaseService,
  OrganizationIdPayload,
  Role,
  RoleData,
  RoleRepository,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getRoleRepository(
  databaseService: DatabaseService,
): RoleRepository {
  return getGenericRepository<Role, RoleData, OrganizationIdPayload>(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.ROLES}`,
    databaseService,
  );
}
