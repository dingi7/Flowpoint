import {
  GenericRepository,
  OrganizationIdPayload,
  Role,
  RoleData,
} from "@/core";

export type RoleRepository = GenericRepository<
  Role,
  RoleData,
  OrganizationIdPayload
>;
