import { Customer, CustomerData, GenericRepository, OrganizationIdPayload } from "@/core";

export type CustomerRepository = GenericRepository<Customer, CustomerData, OrganizationIdPayload>;
