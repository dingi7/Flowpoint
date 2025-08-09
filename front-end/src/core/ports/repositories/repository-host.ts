import { UserRepository } from "./user-repository";

import { DatabaseService } from "../services/database-service";

export interface RepositoryHost {
  getUserRepository(databaseService: DatabaseService): UserRepository;
}
