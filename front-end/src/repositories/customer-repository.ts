import {
  Customer,
  CustomerData,
  CustomerRepository,
  DatabaseService,
  OrganizationIDPayload,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getCustomerRepository(
  databaseService: DatabaseService,
): CustomerRepository {
  return getGenericRepository<Customer, CustomerData, OrganizationIDPayload>(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationID}/${DatabaseCollection.CUSTOMERS}`,
    databaseService,
  );
}
