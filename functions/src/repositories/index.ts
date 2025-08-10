import type { DatabaseService, RepositoryHost } from "../core";
import { getUserRepository } from "./user-repository";
import { getCustomerRepository } from "./customer-repository";

export const repositoryHost: RepositoryHost = {
  getUserRepository: (databaseService: DatabaseService) =>
    getUserRepository(databaseService),
  getCustomerRepository: (databaseService: DatabaseService) =>
    getCustomerRepository(databaseService),
};
