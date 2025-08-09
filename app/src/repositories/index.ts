import { DatabaseService, RepositoryHost } from "../core";
import { getUserRepository } from "./user-repository";

export const repositoryHost: RepositoryHost = {
  getUserRepository: (databaseService: DatabaseService) =>
    getUserRepository(databaseService),
};
