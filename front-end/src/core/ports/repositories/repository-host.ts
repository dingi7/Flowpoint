import { UserRepository } from "./user-repository";
import { CustomerRepository } from "./customer-repository";

import { DatabaseService } from "../services/database-service";

export interface RepositoryHost {
  getUserRepository(databaseService: DatabaseService): UserRepository;
  getCustomerRepository(databaseService: DatabaseService): CustomerRepository;
}
