import {
  Customer,
  CustomerData,
  CustomerRepository,
  DatabaseService,
  OrganizationIdPayload,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getCustomerRepository(
  databaseService: DatabaseService,
): CustomerRepository {
  return getGenericRepository<Customer, CustomerData, OrganizationIdPayload>(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.CUSTOMERS}`,
    databaseService,
  );
}
