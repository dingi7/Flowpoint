import { GenericRepository, Service, ServiceData, OrganizationIdPayload } from "@/core";

export type ServiceRepository = GenericRepository<Service, ServiceData, OrganizationIdPayload>;
