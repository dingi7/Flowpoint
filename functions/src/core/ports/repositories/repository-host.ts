import { DatabaseService } from "../services/database-service";
import { UserRepository } from "./user-repository";

export interface RepositoryHost {
  getUserRepository: (databaseService: DatabaseService) => UserRepository;
}
