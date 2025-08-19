import {
  DatabaseService, OrganizationIdPayload,
  TimeOffRepository,
  TimeOff,
  TimeOffData
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getTimeOffRepository(
  databaseService: DatabaseService,
): TimeOffRepository {
  return getGenericRepository<TimeOff, TimeOffData, OrganizationIdPayload>(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.TIME_OFF}`,
    databaseService,
  );
}
