import {
  DatabaseService,
  OrganizationIdPayload,
  Service,
  ServiceData,
  ServiceRepository,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getServiceRepository(
  databaseService: DatabaseService,
): ServiceRepository {
  return getGenericRepository<Service, ServiceData, OrganizationIdPayload>(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.SERVICES}`,
    databaseService,
  );
}
