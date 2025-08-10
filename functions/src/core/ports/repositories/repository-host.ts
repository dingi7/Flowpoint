import { DatabaseService } from "../services/database-service";
import { UserRepository } from "./user-repository";
import { CustomerRepository } from "./customer-repository";

export interface RepositoryHost {
  getUserRepository: (databaseService: DatabaseService) => UserRepository;
  getCustomerRepository: (databaseService: DatabaseService) => CustomerRepository;
}
