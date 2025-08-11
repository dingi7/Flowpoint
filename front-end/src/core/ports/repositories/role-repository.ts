import { GenericRepository, Role, RoleData, OrganizationIDPayload } from "@/core";

export type RoleRepository = GenericRepository<Role, RoleData, OrganizationIDPayload>;
