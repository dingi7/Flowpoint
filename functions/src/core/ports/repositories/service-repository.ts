import {
  GenericRepository,
  OrganizationIDPayload,
  Service,
  ServiceData,
} from "@/core";

export type ServiceRepository = GenericRepository<
  Service,
  ServiceData,
  OrganizationIDPayload
>;
