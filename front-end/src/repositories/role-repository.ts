import { DatabaseService, OrganizationIDPayload, Role, RoleData, RoleRepository } from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getRoleRepository(
  databaseService: DatabaseService,
): RoleRepository {
  return getGenericRepository<Role, RoleData, OrganizationIDPayload>(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationID}/${DatabaseCollection.ROLES}`,
    databaseService,
  );
}
