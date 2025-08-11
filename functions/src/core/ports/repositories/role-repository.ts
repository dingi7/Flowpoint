import {
  GenericRepository,
  OrganizationIDPayload,
  Role,
  RoleData,
} from "@/core";

export type RoleRepository = GenericRepository<
  Role,
  RoleData,
  OrganizationIDPayload
>;
