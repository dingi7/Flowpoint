import { Customer, CustomerData, GenericRepository, OrganizationIDPayload } from "@/core";

export type CustomerRepository = GenericRepository<Customer, CustomerData, OrganizationIDPayload>;
