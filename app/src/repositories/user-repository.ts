import { DatabaseService, User, UserData, UserRepository } from "../core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getUserRepository(
  databaseService: DatabaseService,
): UserRepository {
  return getGenericRepository<User, UserData>(
    () => DatabaseCollection.USERS,
    databaseService,
  );
}
