import {
  GenericRepository,
  OrganizationIdPayload,
  Service,
  ServiceData,
} from "@/core";

export type ServiceRepository = GenericRepository<
  Service,
  ServiceData,
  OrganizationIdPayload
>;
