import {
  DatabaseService,
  Organization,
  OrganizationData,
  OrganizationRepository,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getOrganizationRepository(
  databaseService: DatabaseService,
): OrganizationRepository {
  return getGenericRepository<Organization, OrganizationData>(
    () => DatabaseCollection.ORGANIZATIONS,
    databaseService,
  );
}
