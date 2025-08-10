import { DatabaseService, Customer, CustomerData } from "../core";
import { CustomerRepository } from "../core/ports/repositories/customer-repository";
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