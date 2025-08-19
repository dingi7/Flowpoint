import {
  DatabaseService,
  OrganizationIDPayload,
  Service,
  ServiceData,
  ServiceRepository,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getServiceRepository(
  databaseService: DatabaseService,
): ServiceRepository {
  return getGenericRepository<Service, ServiceData, OrganizationIDPayload>(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.SERVICES}`,
    databaseService,
  );
}
