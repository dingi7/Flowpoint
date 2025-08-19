import { GenericRepository, Role, RoleData, OrganizationIdPayload } from "@/core";

export type RoleRepository = GenericRepository<Role, RoleData, OrganizationIdPayload>;
