import type { DatabaseService, Customer, CustomerData, CustomerRepository } from "../core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getCustomerRepository(
  databaseService: DatabaseService,
): CustomerRepository {
  return getGenericRepository<Customer, CustomerData>(
    () => DatabaseCollection.CUSTOMERS,
    databaseService,
  );
}