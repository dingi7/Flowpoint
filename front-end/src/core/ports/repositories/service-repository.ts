import { GenericRepository, Service, ServiceData, OrganizationIDPayload } from "@/core";

export type ServiceRepository = GenericRepository<Service, ServiceData, OrganizationIDPayload>;
